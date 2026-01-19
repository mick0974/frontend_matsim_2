import ApiClient from "./ApiClient.js";
import AppConfig from "../config/appConfig.js";

class HubManagementServiceAPI {
  constructor() {
    this.apiClient = new ApiClient(AppConfig.HUB_MANAGER_SERVICE.BASE_URL);
  }

  getHubStructure(hubId) {
    return this.apiClient.executeRestCall(
      `/api/${hubId}/management/structure`,
      "GET"
    );
  }

  getHubState(hubId) {
    return this.apiClient.executeRestCall(
      `/api/${hubId}/management/state`,
      "GET"
    );
  }

  getChargerState(hubId, chargerId) {
    return this.apiClient.executeRestCall(
      `/api/${hubId}/management/charger/${chargerId}/state`,
      "GET"
    );
  }

  changeChargerOperationalState(hubId, chargerId, state) {
    let operation;
    if (state === 'ACTIVE') {
      operation = 'activate';
    } else {
      operation = 'deactivate';
    }

    const url = `/api/${hubId}/management/charger/${chargerId}/${operation}`;
    return this.apiClient.executeRestCall(url, "PUT");
  }

  getReservations(hubId) {
    return this.apiClient.executeRestCall(
      `/api/${hubId}/reservation`,
      "GET"
    )
  }
}

export default new HubManagementServiceAPI();
