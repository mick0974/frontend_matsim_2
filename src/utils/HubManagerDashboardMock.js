const MOCK_CHARGER_STRUCTURE = [
  { chargerId: 'charger_1', chargerType: 'AC', plugPowerKw: 10.0},
  { chargerId: 'charger_2', chargerType: 'AC', plugPowerKw: 13.0},
  { chargerId: 'charger_3', chargerType: 'AC', plugPowerKw: 22.0},
  { chargerId: 'charger_4', chargerType: 'CCS', plugPowerKw: 50.0},
  { chargerId: 'charger_5', chargerType: 'CCS', plugPowerKw: 150.0}
];

const MOCK_CHARGER_STATES = [
  { chargerId: 'charger_1', chargerOperationalState: 'ACTIVE', currentPower: 10.0, occupied: true },
  { chargerId: 'charger_2', chargerOperationalState: 'ACTIVE', currentPower: 0.0, occupied: false },
  { chargerId: 'charger_3', chargerOperationalState: 'ACTIVE', currentPower: 8.5, occupied: true },
  { chargerId: 'charger_4', chargerOperationalState: 'INACTIVE', currentPower: 0.0, occupied: false },
  { chargerId: 'charger_5', chargerOperationalState: 'ACTIVE', currentPower: 88.0, occupied: true }
];

export const HUB_MANAGER_MOCK = {
  MOCK_CHARGER_STRUCTURE,

  MOCK_HUB_STRUCTURE: {
    chargerStructureDTOs: MOCK_CHARGER_STRUCTURE
  },

  MOCK_CHARGER_STATES,

  MOCK_HUB_STATE: {
    activeChargers: 4,
    occupiedChargers: 3,
    currentMaxPower: 195.0,
    currentPowerInUse: 106.5,
    currentPowerRemaining: 88.5,
    currentPowerInUsePercentage: 54.62,
    chargerStates: MOCK_CHARGER_STATES
  },

  MOCK_RESERVATIONS: [
    { vehicleId: 'EV_1', reservationDate: '2026-01-18', startTime: '09:00', endTime: '10:30', reservedPlug: 'AC' },
    { vehicleId: 'EV_3', reservationDate: '2026-01-18', startTime: '11:00', endTime: '12:00', reservedPlug: 'CCS' },
    { vehicleId: 'EV_5', reservationDate: '2026-01-18', startTime: '14:00', endTime: '15:30', reservedPlug: 'AC' },
    { vehicleId: 'EV_2', reservationDate: '2026-01-19', startTime: '08:00', endTime: '09:30', reservedPlug: 'CCS' },
    { vehicleId: 'EV_4', reservationDate: '2026-01-19', startTime: '10:00', endTime: '11:00', reservedPlug: 'AC' },
    { vehicleId: 'EV_6', reservationDate: '2026-01-20', startTime: '13:00', endTime: '14:30', reservedPlug: 'AC' }
  ]
};
