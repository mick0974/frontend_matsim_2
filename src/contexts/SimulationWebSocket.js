import { useRef, useState, useCallback } from "react";

/**
 * Hook per gestire la connessione WebSocket della simulazione.
 * Riceve dati dinamici (soc, state, pos, ecc.) e li passa al SimulationContext
 * che li usa per aggiornare le istanze Vehicle/Hub nel registry.
 */
export function useSimulationWebSocket(updateMonitoringData) {
  const wsRef = useRef(null);
  const rafRef = useRef(null);
  const latestStateRef = useRef(null);

  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    if (wsRef.current) return;

    wsRef.current = new WebSocket(
      `ws://localhost:8080/ws/simulation`
    );

    wsRef.current.onopen = () => {
      console.log("[WS] Connected");
      setConnected(true);
    };

    wsRef.current.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type !== "TimeStepUpdate" || !msg.payload) return;

        const { vehicles, hubs, timestamp, formattedTime } = msg.payload;

        // Estrai solo i dati dinamici da passare al Context
        const wsVehicles = vehicles.map((v) => {
          return {
            id: v.vehicleId,
            soc: v.soc,
            kmDriven: v.kmDriven,
            currentEnergyJoules: v.currentEnergyJoules,
            state: v.State || v.state || "UNKNOWN",
            linkId: v.linkId,
            speed: v.speed,
            heading: v.heading,
            pos: v.position
          };
        });

        const wsHubs = hubs.map((h) => {
          return {
            id: h.hubId,
            energy: h.energy,
            occupancy: h.occupancy,
            chargers: { ...h.chargers },
            pos: h.position,
          };
        });

        latestStateRef.current = { wsVehicles, wsHubs, timestamp, formattedTime };

        if (!rafRef.current) {
          rafRef.current = requestAnimationFrame(() => {
            // Passa dati dinamici e temporali al Context
            updateMonitoringData(
              latestStateRef.current.wsVehicles,
              latestStateRef.current.wsHubs,
              latestStateRef.current.timestamp,
              latestStateRef.current.formattedTime
            );
            rafRef.current = null;
          });
        }

        console.log("[WS] TimeStepUpdate ricevuto");

      } catch (e) {
        console.error("[WS] Invalid JSON", e);
      }
    };

    wsRef.current.onclose = () => {
      wsRef.current = null;
      setConnected(false);
      console.log("[WS] Disconnected");
    };

    wsRef.current.onerror = (e) => {
      console.error("[WS] Error", e);
    };
  }, [updateMonitoringData]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    setConnected(false);
  }, []);

  return { connect, disconnect, connected };
}
