/**
 * Modello unificato per Hub
 * Contiene sia dati statici (da API) che dinamici (da WS)
 */

export class Hub {
  constructor(data = {}) {
    // === DATI STATICI (da /api/hub) ===
    this.id = data.id || data.hubId || null;
    this.linkId = data.linkId || data.linkid || null;
    
    // === CHARGERS INFO ===
    // Manteniamo i chargers come array con struttura unificata
    const chargersArr = Array.isArray(data.chargers) ? data.chargers : [];
    this.chargers = chargersArr.map(c => ({
      id: c.id || c.chargerId || null,
      type: c.type || c.chargerType || 'UNKNOWN', // AC, CCS
      plugPowerKw: c.plugPowerKw || 0,
      occupied: c.occupied || false,
      active: c.active !== undefined ? c.active : true,
      evId: c.evId || null,
      chargingEnergy: c.chargingEnergy || 0,
      energy: c.energy || 0,
    }));

    // === DATI DERIVATI (computed) ===
    // Separiamo in AC (normal) e CCS (fast)
    this.normalChargers = this.chargers.filter(c => c.type.toUpperCase() === 'AC');
    this.fastChargers = this.chargers.filter(c => c.type.toUpperCase() === 'CCS');

    // === DATI DINAMICI (da WS o iniziali) ===
    this.occupancy = {
      normal: data.occupancy?.normal || this.normalChargers.filter(c => c.occupied).length || 0,
      fast: data.occupancy?.fast || this.fastChargers.filter(c => c.occupied).length || 0,
    };

    this.totalCapacity = {
      normal: this.normalChargers.length,
      fast: this.fastChargers.length,
    };

    this.energy = data.energy || 0;
    this.pos = data.pos || null; // { lat, lng }

    // === COMPUTED PROPERTIES ===
    this.name = this.id || 'Hub';
    this.isSaturated = this.isAtCapacity();
  }

  /**
   * Verifica se l'hub è saturo (a capacità)
   */
  isAtCapacity() {
    if (this.totalCapacity.normal > 0 && this.occupancy.normal >= this.totalCapacity.normal) {
      return true;
    }
    if (this.totalCapacity.fast > 0 && this.occupancy.fast >= this.totalCapacity.fast) {
      return true;
    }
    return false;
  }

  /**
   * Aggiorna i dati dinamici da WebSocket
   */
  updateFromWebSocket(wsData) {
    if (!wsData || typeof wsData !== "object") return;

    if (wsData.occupancy !== undefined) {
      this.occupancy = wsData.occupancy;
      this.isSaturated = this.isAtCapacity();
    }

    if (wsData.energy !== undefined) {
      this.energy = wsData.energy;
    }

    if (wsData.chargers) {
      const chargersArray = Object.values(wsData.chargers);
      chargersArray.forEach(wsCharger => {
        const charger = this.chargers.find(
          c => c.id === wsCharger.id || c.id === wsCharger.chargerId
        );
        if (!charger) return;

        charger.occupied = wsCharger.occupied ?? charger.occupied;
        charger.active = wsCharger.active ?? charger.active;
        charger.evId = wsCharger.evId ?? charger.evId;
        charger.chargingEnergy = wsCharger.charging_energy ?? charger.chargingEnergy;
        charger.energy = wsCharger.energy ?? charger.energy;
      });
    }

    // Importante: pos arriva già come [lat, lng] dal WebSocket handler
    if (wsData.pos !== undefined) {
      this.pos = Array.isArray(wsData.pos) ? [...wsData.pos] : wsData.pos;
    }
  }

/**
   * Ritorna una copia immutabile per l'uso in componenti React
   */
  toJSON() {
    return {
      id:     this.id,
      name:   this.name,
      linkId: this.linkId,
      // [...this.chargers] crea un nuovo array, 
      // ma .map(c => ({...c})) crea nuovi oggetti per ogni caricatore
      chargers: this.chargers.map(c => ({ ...c })), 
      normalChargers: this.normalChargers.map(c => ({ ...c })),
      fastChargers: this.fastChargers.map(c => ({ ...c })),
      // Clona anche l'oggetto occupancy
      occupancy: { ...this.occupancy },
      totalCapacity: { ...this.totalCapacity },
      energy: this.energy,
      // Ci assicuriamo che l'array posizione sia un nuovo riferimento
      pos: Array.isArray(this.pos) ? [...this.pos] : this.pos,
      isSaturated: this.isSaturated,
    };
  }

  /**
   * Ritorna solo i dati dinamici (utile per il monitoraggio)
   */
  getDynamicData() {
    return {
      id: this.id,
      occupancy: this.occupancy,
      energy: this.energy,
      chargers: this.chargers,
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
 * Factory function per creare Hub da dati API
 */
export function createHubFromAPI(apiData) {
  return new Hub({
    id: apiData.hubId,
    linkId: apiData.linkid,
    chargers: (apiData.chargers || []).map(c => ({
      id: c.chargerId,
      type: c.chargerType,
      plugPowerKw: c.plugPowerKw,
      occupied: false,
      active: true,
      energy: 0,
      chargingEnergy: 0,
      evId: null,
    })),
    energy: 0,
    occupancy: {
      normal: 0,
      fast: 0,
    },
    pos: convertPosition(apiData.position, apiData.pos),
  });
}
