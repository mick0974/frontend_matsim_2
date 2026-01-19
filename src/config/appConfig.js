/**
 * Application configuration
 * Controls mock vs. real backend usage
 */

export const AppConfig = {
  // Toggle mock vs real backend
  USE_MOCK_DATA: true,

  // Backend API base URL
  API_BASE_URL:
    import.meta.env.VITE_API_URL || 'http://localhost:8080/api',

  // WebSocket server URL
  WEBSOCKET_URL:
    import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws/simulation',

  // Default map center (Berlin)
  DEFAULT_MAP_CENTER: [52.52, 13.4],
  DEFAULT_MAP_ZOOM: 13,

  // Simulation update interval (ms) for mock WebSocket
  MOCK_UPDATE_INTERVAL: 1000,

  // Max time to execute API call before abort
  API_TIMEOUT: 10_000,

  HUB_MANAGER_SERVICE: {
    BASE_URL: import.meta.env.VITE_HUB_URL || "http://localhost:80"
  }
};

export default AppConfig;
