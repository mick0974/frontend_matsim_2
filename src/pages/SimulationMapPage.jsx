import React, { useState, useEffect } from "react";
import { 
  Box, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogContentText, 
  DialogActions, 
  Button,
  Typography,
  Snackbar,
  Alert
} from "@mui/material";
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import MapView from "../components/map";
import EnhancedFloatingMenu from "../components/EnhancedFloatingMenu";
import SimulationSettingsModal from "../components/SimulationSettingsModal";
import { useSimulation } from "../contexts/SimulationContext.jsx";
import "./SimulationMapPage.css";

// Configurazione centralizzata degli stati dei veicoli
const STATE_CONFIG = {
  moving: {
    label: 'Moving',
    color: '#2196f3',
    statsKey: 'vehiclesMoving',
  },
  charging: {
    label: 'Charging',
    color: '#4caf50',
    statsKey: 'vehiclesCharging',
  },
  parked: {
    label: 'Parked',
    color: '#9c27b0',
    statsKey: 'vehiclesParked',
  },
  idle: {
    label: 'Idle',
    color: '#ff9800',
    statsKey: 'vehiclesIdle',
  },
  stopped: {
    label: 'Stopped',
    color: '#f44336',
    statsKey: 'vehiclesStopped',
  },
  unknown: {
    label: 'Unknown',
    color: '#757575',
    statsKey: null,
  },
};

const SimulationMapPage = () => {
  const {
    vehicles,
    hubs,
    simulationStats,
    simulationTime,
    vehiclePaths,
    wsConnected,
    isSimulationRunning,
    runSimulationWithSettings,
    stopSimulationWithSettings,
  } = useSimulation();

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showingRouteVehicle, setShowingRouteVehicle] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [simulationSettings, setSimulationSettings] = useState({ isConfigured: false });
  const [isSimulating, setIsSimulating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [filters, setFilters] = useState({
    moving:   true,
    charging: true,
    parked:   true,
    idle:     true,
    stopped:  true,
  });

  // Avvia la simulazione e connessione WS quando si preme Play
  // Connessione WS rimossa dal mount - avviene solo quando l'utente preme Play
  useEffect(() => {
    let mounted = true;

    return () => {
      mounted = false;
    };
  }, []);

  // Mostra il modal se non ci sono dati o WS non connessa
  useEffect(() => {
    if (!wsConnected && vehicles.length === 0) {
      const timeout = setTimeout(() => setShowErrorModal(true), 15000);
      return () => clearTimeout(timeout);
    } else {
      setShowErrorModal(false);
    }
  }, [wsConnected, vehicles.length]);

  const handleCloseModal = () => setShowErrorModal(false);
  const handleRetryConnection = async () => {
    setShowErrorModal(false);
    // Se il modal di retry viene mostrato, prova ad avviare con settings default
    const result = await runSimulationWithSettings({});
    if (result.success) {
      setNotification({
        open: true,
        message: result.message,
        severity: 'success'
      });
    }
  };

  // Handlers per settings
  const handleSettingsToggle = () => {
    setSettingsOpen(prev => !prev);
  };

  const handleSettingsChange = (newSettings) => {
    setSimulationSettings(newSettings);
  };

  const handlePlayClick = async () => {
    if (!simulationSettings.isConfigured) {
      setSettingsOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      // Costruisci DTO per le impostazioni
      const dtoPayload = {
        configPath: simulationSettings.configPath,
        csvResourceHub: simulationSettings.csvResourceHub,
        csvResourceEv: simulationSettings.csvResourceEv,
        vehicleStrategy: simulationSettings.vehicleStrategy,
        planStrategy: simulationSettings.planStrategy,
        sampleSizeStatic: simulationSettings.sampleSizeStatic,
        numeroVeicoli: simulationSettings.numeroVeicoli,
        socMedio: simulationSettings.socMedio,
        socStdDev: simulationSettings.socStdDev,
        targetSocMean: simulationSettings.targetSocMean,
        targetSocStdDev: simulationSettings.targetSocStdDev,
        stepSize: simulationSettings.stepSize,
        debugLink: simulationSettings.debugLink,
        publisherRateMs: simulationSettings.publisherRateMs,
        publisherDirty: simulationSettings.publisherDirty,
        realTime: simulationSettings.realTime
      };

      // Chiama il context che gestisce tutto il flusso
      const result = await runSimulationWithSettings(dtoPayload);

      if (result.success) {
        setIsSimulating(true);
        setNotification({
          open: true,
          message: result.message,
          severity: 'success'
        });
      } else {
        setNotification({
          open: true,
          message: result.message,
          severity: 'error'
        });
      }
    } catch (error) {
      setNotification({
        open: true,
        message: error.message || 'Errore durante l\'avvio della simulazione',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopClick = async () => {
    try {
      const result = await stopSimulationWithSettings();
      if (result.success) {
        setNotification({
          open: true,
          message: result.message,
          severity: 'success'
        });
      } else {
        setNotification({
          open: true,
          message: result.message,
          severity: result.status === 503 ? 'warning' : 'error'
        });
      }
    } catch (error) {
      setNotification({
        open: true,
        message: error.message || 'Errore durante l\'arresto della simulazione',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayOrStop = () => {
    const nextIsSimulating = !isSimulating;
    setIsSimulating(nextIsSimulating);
    setIsLoading(true);

    if (isSimulating) {
      handleStopClick();
    } else {
      handlePlayClick();
    }
  };

  // Filtra veicoli (plain objects dal Context)
  const filteredVehicles = vehicles.filter(v => {
    const state = (v.state || 'unknown').toLowerCase();
    return filters[state] !== false;
  });

  // Fallback posizione (es: centro mappa o coordinate note)
  const DEFAULT_POS = { lat: 52.5162, lng: 13.4117 }; // Berlino centro

  // POI per la mappa: aggiungi property type, fallback posizione e conversione a array [lat, lng]
  const toLatLngArray = (pos) => {
    if (Array.isArray(pos) && pos.length === 2) return pos;
    if (pos && typeof pos.lat === 'number' && typeof pos.lng === 'number') return [pos.lat, pos.lng];
    return [DEFAULT_POS.lat, DEFAULT_POS.lng];
  };

  /**
   * Crea una chiave univoca per raggruppare i POI per posizione
   * Usa una precisione di 6 decimali per evitare di raggruppare posizioni molto vicine ma non identiche
   */
  const getPosKey = (pos) => {
    if (!Array.isArray(pos) || pos.length < 2) return 'default';
    return `${pos[0].toFixed(6)},${pos[1].toFixed(6)}`;
  };

  /**
   * Aggrega i POI: raggruppa veicoli per posizione
   * Se più veicoli in un hub → mostra icona hub con badge
   * Se più veicoli non in hub → mostra icona veicolo con badge
   */
  const aggregatePois = () => {
    // Crea POI base per veicoli e hub
    const vehiclePois = filteredVehicles.map(v => ({
      ...v,
      type: "vehicle",
      pos: toLatLngArray(v.pos),
    }));

    const hubPois = hubs.map(h => ({
      ...h,
      type: "hub",
      pos: toLatLngArray(h.pos),
    }));

    // Raggruppa i veicoli per posizione
    const vehiclesByPosition = {};
    
    vehiclePois.forEach(vehicle => {
      const key = getPosKey(vehicle.pos);
      if (!vehiclesByPosition[key]) {
        vehiclesByPosition[key] = [];
      }
      vehiclesByPosition[key].push(vehicle);
    });

    // Raggruppa gli hub per posizione
    const hubsByPosition = {};
    hubPois.forEach(hub => {
      const key = getPosKey(hub.pos);
      hubsByPosition[key] = hub;
    });

    // Costruisci i POI finali con aggregazione
    const aggregatedPois = [];

    // Per ogni posizione con veicoli
    Object.entries(vehiclesByPosition).forEach(([posKey, vehiclesAtPos]) => {
      const pos = vehiclesAtPos[0].pos; // Tutti i veicoli in questo gruppo hanno la stessa posizione
      const hubAtPos = hubsByPosition[posKey];

      if (vehiclesAtPos.length === 1 && !hubAtPos) {
        // Singolo veicolo, nessun hub → aggiungilo così com'è
        aggregatedPois.push(vehiclesAtPos[0]);
      } else if (vehiclesAtPos.length > 1) {
        // Multipli veicoli
        if (hubAtPos) {
          // Aggregazione in hub: mostra icona hub con badge
          const stateDistribution = {};
          vehiclesAtPos.forEach(v => {
            stateDistribution[v.state] = (stateDistribution[v.state] || 0) + 1;
          });

          const dominantState = Object.entries(stateDistribution).sort(
            (a, b) => b[1] - a[1]
          )[0][0];

          aggregatedPois.push({
            ...hubAtPos,
            type: "aggregated-hub",
            aggregatedVehicles: vehiclesAtPos,
            aggregateData: {
              count: vehiclesAtPos.length,
              dominantState,
              stateDistribution,
              isHub: true,
            },
            pos,
          });
        } else {
          // Aggregazione non-hub: mostra icona veicolo con badge
          const stateDistribution = {};
          vehiclesAtPos.forEach(v => {
            stateDistribution[v.state] = (stateDistribution[v.state] || 0) + 1;
          });

          const dominantState = Object.entries(stateDistribution).sort(
            (a, b) => b[1] - a[1]
          )[0][0];

          aggregatedPois.push({
            id: `aggregated-${posKey}`,
            type: "aggregated-vehicle",
            aggregatedVehicles: vehiclesAtPos,
            aggregateData: {
              count: vehiclesAtPos.length,
              dominantState,
              stateDistribution,
              isHub: false,
            },
            pos,
          });
        }
      } else if (hubAtPos) {
        // Un solo veicolo in un hub → mostra hub con badge
        const stateDistribution = {};
        vehiclesAtPos.forEach(v => {
          stateDistribution[v.state] = (stateDistribution[v.state] || 0) + 1;
        });

        const dominantState = Object.entries(stateDistribution).sort(
          (a, b) => b[1] - a[1]
        )[0][0];

        aggregatedPois.push({
          ...hubAtPos,
          type: "aggregated-hub",
          aggregatedVehicles: vehiclesAtPos,
          aggregateData: {
            count: vehiclesAtPos.length,
            dominantState,
            stateDistribution,
            isHub: true,
          },
          pos,
        });
      }
    });

    // Aggiungi gli hub senza veicoli
    Object.entries(hubsByPosition).forEach(([posKey, hub]) => {
      if (!vehiclesByPosition[posKey]) {
        aggregatedPois.push(hub);
      }
    });

    return aggregatedPois;
  };

  const allPois = aggregatePois();

  const handleMarkerClick = (poi) => {
    if (poi.type === "vehicle") setSelectedVehicle(poi);
  };

  // Toggle visualizzazione percorso veicolo
  const handleToggleRoute = (vehicleId) => {
    setShowingRouteVehicle(prev => prev === vehicleId ? null : vehicleId);
  };

  // Ottieni il percorso del veicolo selezionato
  const activeVehiclePath = showingRouteVehicle ? (vehiclePaths[showingRouteVehicle] || []) : [];

  return (
    <Box sx={{ height: "100vh", width: "100%", position: "relative", overflow: "hidden" }}>
      <EnhancedFloatingMenu
        vehicles={filteredVehicles}
        hubs={hubs}
        stats={simulationStats}
        simulationTime={simulationTime}
        onSelectVehicle={setSelectedVehicle}
        filters={filters}
        onFiltersChange={setFilters}
        isConnected={wsConnected}
        isSimulationRunning={isSimulationRunning}
        stateConfig={STATE_CONFIG}
        showingRouteVehicle={showingRouteVehicle}
        onToggleRoute={handleToggleRoute}
        // Props per settings
        settingsOpen={settingsOpen}
        onSettingsToggle={handleSettingsToggle}
        simulationSettings={simulationSettings}
        isSimulating={isSimulating}
        onPlayClick={handlePlayOrStop}
        isLoading={isLoading}
      />

      {/* Floating Settings Menu */}
      <SimulationSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSettingsChange={handleSettingsChange}
        initialSettings={simulationSettings}
      />

      <MapView
        pois={allPois}
        onSelectPoi={handleMarkerClick}
        selectedVehicle={selectedVehicle}
        stateConfig={STATE_CONFIG}
        vehiclePath={activeVehiclePath}
      />

      {/* Modal di errore */}
      <Dialog
        open={showErrorModal}
        onClose={handleCloseModal}
        PaperProps={{ sx: { borderRadius: "12px", p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ErrorOutlineIcon color="error" fontSize="large" />
          <Typography variant="h6" fontWeight="bold">Servizio Offline</Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Impossibile stabilire una connessione con il server della simulazione.
            Il servizio potrebbe essere temporaneamente non disponibile o il backend è spento.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseModal} color="inherit">Chiudi</Button>
          <Button 
            onClick={handleRetryConnection} 
            variant="contained" 
            color="primary"
          >
            Riprova Connessione
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar per notifiche */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setNotification({ ...notification, open: false })} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SimulationMapPage;
