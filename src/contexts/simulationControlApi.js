// API client centralizzato per controllo simulazione
import axios from 'axios';

const API_BASE = 'http://localhost:8080/api';

export const simulationControlApi = {
  // ============ HUB ============

  /**
   * Recupera gli hub (GET /api/hub)
   * @returns {Promise<{status:number, data:any}>}
   */
  getHub: async () => {
    return axios.get(`${API_BASE}/hub`)
      .then(res => ({ status: res.status, data: res.data }))
      .catch(err => {
        if (err.response) {
          return { status: err.response.status, data: err.response.data };
        }
        throw err;
      });
  },

  /**
   * Configura/genera gli hub (POST /api/hub)
   * @param {object} [hubConfig] - HubGenerationRequestDTO
   * @param {string} [hubConfig.type] - Tipo generazione: 'csv' o 'json'
   * @param {string} [hubConfig.csvResource] - Path CSV (se type='csv')
   * @param {Array} [hubConfig.hubs] - Lista hub (se type='json')
   * @returns {Promise<{status:number, data:any}>}
   */
  postHub: async (hubConfig = null) => {
    return axios.post(`${API_BASE}/hub`, hubConfig)
      .then(res => ({ status: res.status, data: res.data }))
      .catch(err => {
        if (err.response) {
          return { status: err.response.status, data: err.response.data };
        }
        throw err;
      });
  },

  // ============ FLEET ============

  /**
   * Recupera la flotta (GET /api/fleet)
   * @returns {Promise<{status:number, data:any}>}
   */
  getFleet: async () => {
    return axios.get(`${API_BASE}/fleet`)
      .then(res => ({ status: res.status, data: res.data }))
      .catch(err => {
        if (err.response) {
          return { status: err.response.status, data: err.response.data };
        }
        throw err;
      });
  },

  /**
   * Configura/genera la flotta (POST /api/fleet)
   * @param {object} [fleetConfig] - FleetGenerationRequestDTO
   * @param {string} [fleetConfig.type] - Tipo generazione: 'csv'
   * @param {string} [fleetConfig.csvResource] - Path CSV veicoli
   * @param {number} [fleetConfig.numeroVeicoli] - Numero veicoli (min 1)
   * @param {number} [fleetConfig.socMedio] - SOC medio (0.0-1.0)
   * @param {number} [fleetConfig.socStdDev] - Deviazione standard SOC (0.0-1.0)
   * @returns {Promise<{status:number, data:any}>}
   */
  postFleet: async (fleetConfig = null) => {
    return axios.post(`${API_BASE}/fleet`, fleetConfig)
      .then(res => ({ status: res.status, data: res.data }))
      .catch(err => {
        if (err.response) {
          return { status: err.response.status, data: err.response.data };
        }
        throw err;
      });
  },

  // ============ SIMULATION CONTROL ============

  /**
   * Avvia la simulazione (POST /api/simulation/run)
   * @param {object} [settings] - SimulationSettingsDTO opzionale
   * @returns {Promise<{status:number, data:any}>}
   */
  runSimulation: async (settings) => {
    return axios.post(`${API_BASE}/simulation/run`, settings || null)
      .then(res => ({ status: res.status, data: res.data }))
      .catch(err => {
        if (err.response) {
          return { status: err.response.status, data: err.response.data };
        }
        throw err;
      });
  },

  /**
   * Arresta la simulazione (POST /api/simulation/shutdown)
   * @returns {Promise<{status:number, data:any}>}
   */
  shutdownSimulation: async () => {
    return axios.post(`${API_BASE}/simulation/shutdown`)
      .then(res => ({ status: res.status, data: res.data }))
      .catch(err => {
        if (err.response) {
          return { status: err.response.status, data: err.response.data };
        }
        throw err;
      });
  }
};
