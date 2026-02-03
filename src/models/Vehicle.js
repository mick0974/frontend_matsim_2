/**
 * Modello unificato per Vehicle
 * Contiene sia dati statici (da API) che dinamici (da WS)
 */

export class Vehicle {
  constructor(data = {}) {
    // === DATI STATICI (da /api/fleet) ===
    this.id = data.id || data.vehicleId || null;
    this.manufacturer = data.manufacturer || '';
    this.model = data.model || '';
    this.nominalCapacityKwh = data.nominalCapacityKwh || 0;
    this.consumptionKwhPerKm = data.consumptionKwhPerKm || 0;
    this.batteryType = data.batteryType || '';
    this.torqueNm = data.torqueNm || 0;
    this.topSpeedKmh = data.topSpeedKmh || 0;
    this.rangeKm = data.rangeKm || 0;
    this.acceleration0To100 = data.acceleration0To100 || 0;
    this.fastChargingPowerKwDc = data.fastChargingPowerKwDc || 0;
    this.fastChargePort = data.fastChargePort || '';
    this.towingCapacityKg = data.towingCapacityKg || 0;
    this.cargoVolumeL = data.cargoVolumeL || 0;
    this.seats = data.seats || 0;
    this.drivetrain = data.drivetrain || '';
    this.segment = data.segment || '';
    this.lengthMm = data.lengthMm || 0;
    this.widthMm = data.widthMm || 0;
    this.heightMm = data.heightMm || 0;
    this.carBodyType = data.carBodyType || '';

    // === DATI DINAMICI (da WS o aggiornamenti) ===
    this.soc = data.soc !== undefined ? data.soc : (data.currentSoc !== undefined ? data.currentSoc * 100 : 0);
    this.currentEnergyJoules = data.currentEnergyJoules || 0;
    this.kmDriven = data.kmDriven || data.distanceTraveledKm || 0;
    this.state = data.state || 'unknown'; // moving, charging, idle, stopped
    this.linkId = data.linkId || null;
    this.heading = data.heading || 0;
    this.speed = data.speed || 0;
    this.pos = data.pos || null; // { lat, lng }

    // === COMPUTED PROPERTIES ===
    this.displayName = `${this.manufacturer} ${this.model}`.trim();
  }

  /**
   * Aggiorna i dati dinamici da WebSocket
   */
  updateFromWebSocket(wsData) {
    if (!wsData) return;

    if (wsData.soc !== undefined) this.soc = wsData.soc;
    if (wsData.currentEnergyJoules !== undefined) this.currentEnergyJoules = wsData.currentEnergyJoules;
    if (wsData.kmDriven !== undefined) this.kmDriven = wsData.kmDriven;
    
    // Gestione case-insensitive per lo stato (visto che nel DTO era "State" o "state")
    const newState = wsData.state || wsData.State;
    if (newState !== undefined) this.state = newState.toLowerCase();
    
    if (wsData.linkId !== undefined) this.linkId = wsData.linkId;
    if (wsData.heading !== undefined) this.heading = wsData.heading;
    if (wsData.speed !== undefined) this.speed = wsData.speed;
    
    // Importante: pos arriva già come [lat, lng] dal WebSocket handler
    if (wsData.pos !== undefined) {
      this.pos = Array.isArray(wsData.pos) ? [...wsData.pos] : wsData.pos;
    }
  }

  /**
   * Ritorna una copia profonda per l'uso in componenti React
   */
  toJSON() {
    return { 
      ...this,
      // Ci assicuriamo che l'array posizione sia un nuovo riferimento
      pos: Array.isArray(this.pos) ? [...this.pos] : this.pos,
    };
  }

  /**
   * Ritorna solo i dati dinamici (utile per il monitoraggio)
   */
  getDynamicData() {
    return {
      id: this.id,
      soc: this.soc,
      currentEnergyJoules: this.currentEnergyJoules,
      kmDriven: this.kmDriven,
      state: this.state,
      linkId: this.linkId,
      heading: this.heading,
      speed: this.speed,
      pos: Array.isArray(this.pos) ? [...this.pos] : this.pos,
    };
  }
}

/**
 * Converte position {x, y} dal backend in [lat, lng] per Leaflet
 */
function convertPosition(position, fallbackPos) {
  if (position && position.x !== undefined && position.y !== undefined) {
    // Backend fornisce position: {x, y} dove x=lng, y=lat
    return [position.y, position.x];
  }
  return fallbackPos || null;
}

/**
 * Factory function per creare Vehicle da dati API
 */
export function createVehicleFromAPI(apiData) {
  return new Vehicle({
    id: apiData.vehicleId,
    manufacturer: apiData.manufacturer,
    model: apiData.model,
    nominalCapacityKwh: apiData.nominalCapacityKwh,
    consumptionKwhPerKm: apiData.consumptionKwhPerKm,
    batteryType: apiData.batteryType,
    torqueNm: apiData.torqueNm,
    topSpeedKmh: apiData.topSpeedKmh,
    rangeKm: apiData.rangeKm,
    acceleration0To100: apiData.acceleration0To100,
    fastChargingPowerKwDc: apiData.fastChargingPowerKwDc,
    fastChargePort: apiData.fastChargePort,
    towingCapacityKg: apiData.towingCapacityKg,
    cargoVolumeL: apiData.cargoVolumeL,
    seats: apiData.seats,
    drivetrain: apiData.drivetrain,
    segment: apiData.segment,
    lengthMm: apiData.lengthMm,
    widthMm: apiData.widthMm,
    heightMm: apiData.heightMm,
    carBodyType: apiData.carBodyType,
    soc: apiData.currentSoc * 100,
    currentEnergyJoules: apiData.currentEnergyJoules,
    kmDriven: apiData.distanceTraveledKm,
    state: apiData.state,
    linkId: apiData.linkId,
    pos: convertPosition(apiData.position, apiData.pos),
  });
}
