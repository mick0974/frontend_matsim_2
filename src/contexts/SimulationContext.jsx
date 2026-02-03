import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { useSimulationWebSocket } from "./SimulationWebSocket";
import { simulationControlApi } from "./simulationControlApi";
import { createVehicleFromAPI } from "../models/Vehicle";
import { createHubFromAPI } from "../models/Hub";

/**
 * SimulationContext gestisce lo stato della simulazione.
 * 
 * ARCHITETTURA DATI:
 * - All'avvio: fetchSimulationData() crea istanze Vehicle/Hub tramite factory (createVehicleFromAPI, createHubFromAPI)
 * - Le istanze sono salvate in vehiclesRef/hubsRef come "fonte di verità" mutabile
 * - La WebSocket invia dati dinamici (soc, state, pos, ecc.)
 * - updateMonitoringData() aggiorna le istanze esistenti con vehicle.updateFromWebSocket()/hub.updateFromWebSocket()
 * - I componenti React ricevono snapshot immutabili tramite toJSON()
 */
const SimulationContext = createContext(null);

export const SimulationProvider = ({ children }) => {
  // === STATO SIMULAZIONE ===
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);

  // === REGISTRY (fonte di verità - istanze mutabili) ===
  const vehiclesRef = useRef([]); // array di istanze Vehicle
  const hubsRef = useRef([]);     // array di istanze Hub
  const registryReadyRef = useRef(false); // La WS non deve aggiornare finché il registry non è pronto
  
  // === CRONOLOGIA POSIZIONI VEICOLI ===
  const vehiclePathsRef = useRef({}); // { vehicleId: [[lat, lng], [lat, lng], ...] }
  const [vehiclePaths, setVehiclePaths] = useState({}); // snapshot per React

  // === STATE REACT (snapshot plain objects per i componenti) ===
  const [vehicles, setVehicles] = useState([]);  // plain objects
  const [hubs, setHubs] = useState([]);          // plain objects
  const [simulationTime, setSimulationTime] = useState({
    timestamp: 0.0,
    formattedTime: "00:00:00",
  });
  const [simulationStats, setSimulationStats] = useState({
    totalVehicles: 0,
    vehicleCounts: {
      moving: 0,
      charging: 0,
      stopped: 0,
      parked: 0,
      idle: 0,
    },
    saturatedHubs: 0,
    averageSoC: 0,
  });

  /**
   * Callback per aggiornamento dati da WebSocket
   * Muta le istanze nel registry, poi pubblica nuovi snapshot
   */
  const updateMonitoringData = useCallback((wsVehicles, wsHubs, timestamp, formattedTime) => {

    if (!registryReadyRef.current) {
      console.warn("[SimulationContext] WS ricevuto ma registry non pronto");
      return;
    }

    // Aggiorna le istanze Vehicle nel registry e traccia le posizioni
    vehiclesRef.current.forEach(vehicle => {
      const wsV = wsVehicles.find(w => w.id === vehicle.id);
      if (wsV) {
        vehicle.updateFromWebSocket(wsV);
        
        // Traccia la posizione se valida
        if (wsV.pos && Array.isArray(wsV.pos) && wsV.pos.length === 2) {
          if (!vehiclePathsRef.current[vehicle.id]) {
            vehiclePathsRef.current[vehicle.id] = [];
          }
          const lastPos = vehiclePathsRef.current[vehicle.id].slice(-1)[0];
          // Evita duplicati consecutivi
          if (!lastPos || lastPos[0] !== wsV.pos[0] || lastPos[1] !== wsV.pos[1]) {
            vehiclePathsRef.current[vehicle.id].push([...wsV.pos]);
          }
        }
      }
    });

    // Aggiorna le istanze Hub nel registry
    hubsRef.current.forEach(hub => {
      const wsH = wsHubs.find(w => w.id === hub.id);
      if (wsH) {
        hub.updateFromWebSocket(wsH);
      }
    });

    // Pubblica nuovi snapshot (plain objects) per React
    const vehiclesSnapshot = vehiclesRef.current.map(v => v.toJSON());
    const hubsSnapshot = hubsRef.current.map(h => h.toJSON());

    setVehicles(vehiclesSnapshot);
    setHubs(hubsSnapshot);
    
    // Pubblica snapshot percorsi (copia profonda per triggerare re-render)
    const pathsSnapshot = {};
    Object.entries(vehiclePathsRef.current).forEach(([vehicleId, path]) => {
      pathsSnapshot[vehicleId] = [...path]; // Crea nuovo array per ogni veicolo
    });
    setVehiclePaths(pathsSnapshot);

    // Aggiorna il tempo di simulazione
    if (timestamp !== undefined || formattedTime !== undefined) {
      setSimulationTime({
        timestamp: timestamp ?? 0.0,
        formattedTime: formattedTime ?? "00:00:00",
      });
    }

    // Calcola e pubblica stats aggiornate
    const stats = computeSimulationStats(vehiclesSnapshot, hubsSnapshot);
    setSimulationStats(stats);

    console.log("[SimulationContext] WS update - snapshot pubblicati");
    console.log("Tempo:", formattedTime);
    console.log("Veicoli:", vehiclesSnapshot);
    console.log("Hubs:", hubsSnapshot);
  }, []);

  // WebSocket
  const { connect, disconnect, connected: wsConnected } = useSimulationWebSocket(updateMonitoringData);

  /**
   * Calcola le statistiche della simulazione dai plain objects
   */
  const computeSimulationStats = (vehiclesData, hubsData) => {
    const totalVehicles = vehiclesData.length;
    
    const vehiclesCharging = vehiclesData.filter(
      v => (v.state || '').toLowerCase() === 'charging'
    ).length;

    const vehiclesMoving = vehiclesData.filter(
      v => (v.state || '').toLowerCase() === 'moving'
    ).length;

    const vehiclesIdle = vehiclesData.filter(
      v => (v.state || '').toLowerCase() === 'idle'
    ).length;

    const vehiclesStopped = vehiclesData.filter(
      v => (v.state || '').toLowerCase() === 'stopped'
    ).length;

    const vehiclesParked = vehiclesData.filter(
      v => (v.state || '').toLowerCase() === 'parked'
    ).length;

    const saturatedHubs = hubsData.filter(h => h.isSaturated).length;
    const averageSoC = totalVehicles > 0
      ?  (vehiclesData.reduce((sum, v) => sum + Number(v.soc ?? 0), 0) / totalVehicles)
      : 0;

    return {
      totalVehicles,
      vehicleCounts: {
        moving:   vehiclesMoving,
        parked:   vehiclesParked,
        charging: vehiclesCharging,
        idle:     vehiclesIdle,
        stopped:  vehiclesStopped,
      },
      saturatedHubs,
      averageSoC:averageSoC,
    };
  };

  /**
   * Carica i dati da API e popola il context (interno, usato da runSimulationWithSettings)
   */
  const loadSimulationData = useCallback(async () => {
    // GET /hub e /fleet per popolare il context
    const [hubResult, fleetResult] = await Promise.all([
      simulationControlApi.getHub(),
      simulationControlApi.getFleet()
    ]);

    if (hubResult.status >= 400) {
      throw new Error(`Failed to fetch hubs: ${hubResult.status}`);
    }
    if (fleetResult.status >= 400) {
      throw new Error(`Failed to fetch fleet: ${fleetResult.status}`);
    }

    // Crea istanze dai dati API
    const vehicleInstances = (fleetResult.data?.data?.vehicles || []).map(createVehicleFromAPI);
    const hubInstances = (hubResult.data?.data?.hubs || []).map(createHubFromAPI);

    // Salva istanze nel registry (fonte di verità)
    vehiclesRef.current = vehicleInstances;
    hubsRef.current = hubInstances;
    registryReadyRef.current = true;

    // Pubblica snapshot plain objects per React
    const vehiclesSnapshot = vehicleInstances.map(v => v.toJSON());
    const hubsSnapshot = hubInstances.map(h => h.toJSON());

    setVehicles(vehiclesSnapshot);
    setHubs(hubsSnapshot);

    // Calcola stats iniziali
    const stats = computeSimulationStats(vehiclesSnapshot, hubsSnapshot);
    setSimulationStats(stats);

    console.log("[SimulationContext] Dati caricati - snapshot pubblicati");
    console.log("Veicoli:", vehiclesSnapshot.length);
    console.log("Hubs:", hubsSnapshot.length);

    return { vehicles: vehicleInstances, hubs: hubInstances };
  }, []);

  /**
   * Start simulazione (legacy - manteniamo per compatibilità)
   */
  const startSimulation = useCallback(async () => {
    setIsSimulationRunning(true);
    try {
      await loadSimulationData();
      connect();
    } catch (e) {
      console.error("[SimulationContext] Errore fetch dati iniziali:", e);
      setIsSimulationRunning(false);
      throw e;
    }
  }, [connect, loadSimulationData]);

  /**
   * Stop simulazione: chiudi WS, svuota registry e state
   */
  const stopSimulation = useCallback(() => {
    disconnect();
    setIsSimulationRunning(false);

    // Svuota registry
    vehiclesRef.current = [];
    hubsRef.current = [];
    registryReadyRef.current = false;
    vehiclePathsRef.current = {};

    // Svuota state React
    setVehicles([]);
    setHubs([]);
    setVehiclePaths({});
    setSimulationTime({
      timestamp: 0.0,
      formattedTime: "00:00:00",
    });
    setSimulationStats({
      totalVehicles: 0,
      vehicleCounts: {
        moving:   0,
        charging: 0,
        idle:     0,
        stopped:  0,
      },
      saturatedHubs: 0,
      averageSoC: 0,
    });
  }, [disconnect]);


  const isSetupComplete = useCallback(() => {
    return true;
  }, []);

  /**
   * Avvia la simulazione con il flusso completo:
   * 1. POST /hub (genera hub)
   * 2. POST /fleet (genera flotta)
   * 3. POST /simulation/run (avvia simulazione)
   * 4. GET /hub e /fleet (carica dati nel context)
   * 5. Connect WS (aggiornamenti real-time)
   * 
   * @param {object} settings - SimulationSettingsDTO
   * @returns {Promise<{success:boolean, status:number, message:string}>}
   */
  const runSimulationWithSettings = useCallback(async (settings) => {
    try {
      // 1. POST /hub - genera hub con HubGenerationRequestDTO
      const hubConfig = {
        type: 'csv',
        csvResource: settings.csvResourceHub || 'csv/charging_hub.csv'
      };
      const hubPostResult = await simulationControlApi.postHub(hubConfig);
      if (hubPostResult.status >= 400) {
        return { 
          success: false, 
          status: hubPostResult.status, 
          message: `Errore generazione hub: ${hubPostResult.data?.message || hubPostResult.status}` 
        };
      }
      console.log("[SimulationContext] POST /hub completato", hubConfig);

      // 2. POST /fleet - genera flotta con FleetGenerationRequestDTO
      const fleetConfig = {
        type: 'csv',
        csvResource: settings.csvResourceEv || 'csv/ev-dataset.csv',
        numeroVeicoli: settings.numeroVeicoli,
        socMedio: settings.socMedio,
        socStdDev: settings.socStdDev
      };
      const fleetPostResult = await simulationControlApi.postFleet(fleetConfig);
      if (fleetPostResult.status >= 400) {
        return { 
          success: false, 
          status: fleetPostResult.status, 
          message: `Errore generazione flotta: ${fleetPostResult.data?.message || fleetPostResult.status}` 
        };
      }
      console.log("[SimulationContext] POST /fleet completato", fleetConfig);

      // 3. POST /simulation/run - avvia simulazione con SimulationSettingsDTO
      const simulationSettings = {
        configPath: settings.configPath,
        planStrategy: settings.planStrategy,
        sampleSizeStatic: settings.sampleSizeStatic,
        targetSocMean: settings.targetSocMean,
        targetSocStdDev: settings.targetSocStdDev,
        debugLink: settings.debugLink,
        stepSize: settings.stepSize,
        publisherRateMs: settings.publisherRateMs,
        publisherDirty: settings.publisherDirty,
        realTime: settings.realTime
      };
      const runResult = await simulationControlApi.runSimulation(simulationSettings);
      if (runResult.status === 409) {
        return { success: false, status: 409, message: 'Simulazione già in esecuzione' };
      }
      if (runResult.status === 400) {
        return { success: false, status: 400, message: runResult.data?.message || 'Errore: parametri non validi' };
      }
      if (runResult.status >= 400) {
        return { success: false, status: runResult.status, message: runResult.data?.message || 'Errore avvio simulazione' };
      }
      console.log("[SimulationContext] POST /simulation/run completato");

      // 4. Carica dati e connetti WS
      setIsSimulationRunning(true);
      await loadSimulationData();
      connect();

      return { success: true, status: 200, message: 'Simulazione avviata con successo!' };
    } catch (error) {
      console.error("[SimulationContext] Errore runSimulationWithSettings:", error);
      setIsSimulationRunning(false);
      return { success: false, status: 0, message: error.message || 'Errore durante l\'avvio della simulazione' };
    }
  }, [loadSimulationData, connect]);

  /**
   * Arresta la simulazione
   * Disconnette la WS, chiama l'API /simulation/shutdown
   */
  const stopSimulationWithSettings = useCallback(async () => {
    try {
      // Arresta la WS prima di richiedere lo shutdown al server
      stopSimulation();

      const result = await simulationControlApi.shutdownSimulation();

      if (result.status === 200) {
        return { success: true, status: 200, message: 'Simulazione arrestata con successo' };
      } else if (result.status === 503) {
        return { success: false, status: 503, message: 'Simulazione non in esecuzione' };
      } else if (result.status === 500) {
        return { success: false, status: 500, message: result.data?.message || 'Errore durante l\'arresto della simulazione' };
      }
    } catch (error) {
      return { success: false, status: 0, message: error.message || 'Errore durante l\'arresto della simulazione' };
    }
  }, [stopSimulation]);

  // === INTERFACCIA ESPOSTA AI COMPONENTI ===
  const value = {
    // Stato
    isSimulationRunning,
    wsConnected,
    simulationStats,
    simulationTime,
    isSetupComplete,

    // Dati (plain objects, mai istanze di classe)
    vehicles,
    hubs,
    vehiclePaths,

    // Azioni
    startSimulation,
    stopSimulation,
    runSimulationWithSettings,
    stopSimulationWithSettings,
  };

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
};

export const useSimulation = () => {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error("useSimulation must be used within SimulationProvider");
  return ctx;
};

export default SimulationContext;
