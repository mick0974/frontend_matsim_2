const MOCK_CHARGER_STRUCTURE = [
  { chargerId: 'charger_1', plugType: 'STANDARD' },
  { chargerId: 'charger_2', plugType: 'STANDARD' },
  { chargerId: 'charger_3', plugType: 'STANDARD' },
  { chargerId: 'charger_4', plugType: 'FAST CHARGE' },
  { chargerId: 'charger_5', plugType: 'FAST CHARGE' }
];

const MOCK_CHARGER_STATES = [
  { chargerId: 'charger_1', chargerOperationalState: 'ACTIVE', energy: 45.2, occupied: true },
  { chargerId: 'charger_2', chargerOperationalState: 'ACTIVE', energy: 0, occupied: false },
  { chargerId: 'charger_3', chargerOperationalState: 'ACTIVE', energy: 62.5, occupied: true },
  { chargerId: 'charger_4', chargerOperationalState: 'INACTIVE', energy: 0, occupied: false },
  { chargerId: 'charger_5', chargerOperationalState: 'ACTIVE', energy: 88.0, occupied: true }
];

export const HUB_MANAGER_MOCK = {
  MOCK_CHARGER_STRUCTURE,

  MOCK_HUB_STRUCTURE: {
    chargerStructureDTOs: MOCK_CHARGER_STRUCTURE
  },

  MOCK_CHARGER_STATES,

  MOCK_HUB_STATE: {
    occupancy: 3,
    energy: 195.7,
    chargerStates: MOCK_CHARGER_STATES
  },

  MOCK_RESERVATIONS: [
    { vehicleId: 'EV_1', reservationDate: '2026-01-18', startTime: '09:00', endTime: '10:30', reservedPlug: 'STANDARD', chargerId: 'charger_1' },
    { vehicleId: 'EV_3', reservationDate: '2026-01-18', startTime: '11:00', endTime: '12:00', reservedPlug: 'FAST CHARGE', chargerId: 'charger_5' },
    { vehicleId: 'EV_5', reservationDate: '2026-01-18', startTime: '14:00', endTime: '15:30', reservedPlug: 'STANDARD', chargerId: 'charger_2' },
    { vehicleId: 'EV_2', reservationDate: '2026-01-19', startTime: '08:00', endTime: '09:30', reservedPlug: 'FAST CHARGE', chargerId: 'charger_4' },
    { vehicleId: 'EV_4', reservationDate: '2026-01-19', startTime: '10:00', endTime: '11:00', reservedPlug: 'STANDARD', chargerId: 'charger_3' },
    { vehicleId: 'EV_6', reservationDate: '2026-01-20', startTime: '13:00', endTime: '14:30', reservedPlug: 'STANDARD', chargerId: 'charger_1' }
  ]
};
