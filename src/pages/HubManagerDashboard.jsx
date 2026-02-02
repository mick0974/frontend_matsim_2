import React, {useEffect, useMemo, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
  Typography
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import EventIcon from '@mui/icons-material/Event';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import MapView from '../components/map';
import {useSimulation} from '../contexts/SimulationContext';
import HubManagementApi from "../services/hubManagementApi.js";
import {HUB_MANAGER_MOCK} from "../utils/HubManagerDashboardMock.js";

// Default states when mock is disabled
const DEFAULT_HUB_STRUCTURE = {
  chargerStructureDTOs: []
};

const DEFAULT_HUB_STATE = {
  occupancy: 0,
  energy: 0,
  chargerStates: [],
  occupiedChargers: 0,
  activeChargers: 0,
  currentMaxPower: 0,
  currentPowerInUse: 0,
  currentPowerRemaining: 0,
  currentPowerInUsePercentage: 0
};

const DEFAULT_RESERVATIONS = [];

const HubManagerDashboard = () => {
  const mockHubs = [
    {
      id: 'hub_1',
      name: 'hub_1',
      pos: [45, 9],
    },
    {
      id: 'hub_2',
      name: 'hub_2',
      pos: [45.4642, 9.1900],
    }
  ];

  const navigate = useNavigate();
  const { hubs: contextHubs } = useSimulation();
  const hubs = contextHubs.length > 0 ? contextHubs : mockHubs;
  const [selectedHubId, setSelectedHubId] = useState(hubs.length > 0 ? hubs[0].id : null);

  const [selectedHubStructure, setHubStructure] = useState(DEFAULT_HUB_STRUCTURE);
  const [hubStructureError, setHubStructureError] = useState(null);
  const [selectedHubState, setHubState] = useState(DEFAULT_HUB_STATE);
  const [hubStateError, setHubStateError] = useState(null);

  const [operationalStateChangeError, setOperationalStateChangeError] = useState(null);

  // Reservations state
  const [reservations, setReservations] = useState(DEFAULT_RESERVATIONS);
  const [reservationsError, setReservationsError] = useState(null);
  const [reservationTab, setReservationTab] = useState(0); // 0 = today, 1 = all

  const selectedHub = hubs.find((h) => h.id === selectedHubId);

  // Check if charger is active (ON/ACTIVE/IN_DEACTIVATION). IN_DEACTIVATION is the transition state from ACTIVE to INACTIVE.
  // The charger is considered still ACTIVE during the transition
  const isChargerActive = (state) => {
    return state === 'ACTIVE' || state === 'ON' || state === 'IN_DEACTIVATION';
  }

  const isChargerInTransitionState = (state) => {
    return state === 'IN_ACTIVATION' || state === 'IN_DEACTIVATION';
  }

  const isChargerStateInitialized = (state) => {
    return state !== 'NOT_INITIALIZED';
  }

  // Determine data source
  const useMockData = false; //AppConfig.USE_MOCK_DATA;
  const hubStructure = useMockData ? HUB_MANAGER_MOCK.MOCK_HUB_STRUCTURE : selectedHubStructure;
  const hubState = useMockData ? HUB_MANAGER_MOCK.MOCK_HUB_STATE : selectedHubState;
  const reservationsData = useMockData ? HUB_MANAGER_MOCK.MOCK_RESERVATIONS : reservations;

  // Merge hub structure and hub state to get complete hub data
  const chargerStructureMap = new Map(
    (hubStructure.chargerStructureDTOs || []).map(chargerStructure => [
      chargerStructure.chargerId,
      {"chargerType": chargerStructure.chargerType, "plugPowerKw": chargerStructure.plugPowerKw}
    ])
  );

  const chargers = (hubState.chargerStates || []).map(chargerState => ({
    ...chargerState,
    chargerType: chargerStructureMap.get(chargerState.chargerId)?.chargerType || 'UNKNOWN',
    plugPowerKw: chargerStructureMap.get(chargerState.chargerId)?.plugPowerKw || 0.00
  }));

  const occupiedChargers = hubState.occupiedChargers || 0;
  const activeChargers = hubState.activeChargers || 0;
  const currentMaxPower = hubState.currentMaxPower || 0.00;
  const currentPowerInUse = hubState.currentPowerInUse || 0.00;
  const currentPowerRemaining = hubState.currentPowerRemaining || 0.00;
  const currentPowerInUsePercentage = hubState.currentPowerInUsePercentage || 0.00;

  // Breakdown by charger type
  const normalChargers = chargers.filter((c) => c.chargerType === 'AC');
  const fastChargers = chargers.filter((c) => c.chargerType === 'CCS');

  const totalNormalChargers = normalChargers.length;
  const totalFastChargers = fastChargers.length;

  const normalActive = normalChargers.filter((c) => isChargerActive(c.chargerOperationalState)).length;
  const fastActive = fastChargers.filter((c) => isChargerActive(c.chargerOperationalState)).length;

  const normalOccupied = normalChargers.filter((c) => c.occupied).length;
  const fastOccupied = fastChargers.filter((c) => c.occupied).length;

  const mapPois = hubs.map((hub) => ({ ...hub, type: 'hub' }));

  // To render the hub data, its structure and current state are necessary
  const hubManagerServiceError = (hubStructureError !== null || hubStateError !== null) && !useMockData;

  // Helper that returns if the charger can be deactivated
  const canDeactivateChargers = () => {
    return chargers.filter((c) => c.chargerOperationalState === 'ON' || c.chargerOperationalState === 'ACTIVE').length > 1;
  }

  // Error messages to render
  const getErrorMessage = () => {
    if (hubStructureError)
      return `Errore nel caricamento delle informazioni sulla struttura dell'hub`;

    if (hubStateError)
      return `${hubStateError}`;

    if (operationalStateChangeError)
      return operationalStateChangeError;

    return `Errore nel caricamento dei dati dell'hub.`;
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Filter reservations
  const todayReservations = reservationsData.filter(r => r.reservationDate === getTodayDate());
  const allReservations = reservationsData;
  const displayedReservations = reservationTab === 0 ? todayReservations : allReservations;

  // Get operational state chip
  const getChargerOperationalStateChip = (state) => {
    const stateConfig = {
      'NOT_INITIALIZED': {
        label: 'Non inizializzato',
        color: 'default',
        variant: 'outlined',
        icon: null
      },
      'IN_ACTIVATION': {
        label: 'In attivazione',
        color: 'info',
        variant: 'filled',
        icon: <CircularProgress size={12} color="inherit" />
      },
      'IN_DEACTIVATION': {
        label: 'In disattivazione',
        color: 'warning',
        variant: 'filled',
        icon: <CircularProgress size={12} color="inherit" />
      },
      'ACTIVE': {
        label: 'Attivo',
        color: 'success',
        variant: 'filled',
        icon: null
      },
      'ON': {
        label: 'Acceso',
        color: 'success',
        variant: 'filled',
        icon: null
      },
      'INACTIVE': {
        label: 'Inattivo',
        color: 'error',
        variant: 'filled',
        icon: null
      },
      'OFF': {
        label: 'Spento',
        color: 'error',
        variant: 'filled',
        icon: null
      }
    };

    const config = stateConfig[state] || {
      label: state,
      color: 'default',
      variant: 'outlined',
      icon: null
    };

    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        variant={config.variant}
        icon={config.icon}
      />
    );
  };

  // Format time from LocalTime string
  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return timeString.substring(0, 5); // HH:mm
  };

  // Format date from LocalDate string
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(`${dateString}T00:00:00Z`);
    return date.toLocaleDateString('it-IT', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Toggle charger state, request activation/deactivation of selected charger
  const changeChargerOperationalState = async (chargerId, currentState) => {
    if (!selectedHubId || useMockData) return;
    if (!isChargerStateInitialized(currentState)) return;
    if (isChargerInTransitionState(currentState)) return;

    const isActive = isChargerActive(currentState);
    const newState = isActive ? 'INACTIVE' : 'ACTIVE';

    try {
      await HubManagementApi.changeChargerOperationalState(selectedHubId, chargerId, newState);

      const updatedState = await HubManagementApi.getHubState(selectedHubId);
      setHubState(updatedState || DEFAULT_HUB_STATE);
      setHubStateError(null);
    } catch (err) {
      console.error('Error toggling charger state:', err);

      if (err.response?.status === 404) {
        setHubStateError('Hub non trovato.');
      } else if (err.response?.status === 409) {
        setOperationalStateChangeError('Almeno un connettore deve essere sempre attivo oppure il connettore scelto sta già venendo attivato/disattivato.');
      } else if (err.response?.status === 503) {
        setOperationalStateChangeError('Impossibile comunicare col simulatore.');
      } else if (!err.response) {
        setOperationalStateChangeError('Errore di connessione.');
      } else {
        setOperationalStateChangeError('Si è verificato un errore imprevisto, riprova più tardi.');
      }
    }
  };

  // Fetch hub structure
  const fetchHubStructure = async () => {
    if (!selectedHubId || useMockData) return;

    try {
      const structure = await HubManagementApi.getHubStructure(selectedHubId);
      setHubStructure(structure || DEFAULT_HUB_STRUCTURE);
      setHubStructureError(null);
    } catch (err) {
      console.error('Error fetching hub structure:', err);
      const errorMsg = err.response?.status === 404
        ? 'Hub selezionato non trovato'
        : `Errore nel recupero delle informazioni dell'hub selezionato`;
      setHubStructureError(errorMsg);
      setHubStructure(DEFAULT_HUB_STRUCTURE);
    }
  };

  // Fetch hub state
  const fetchHubState = async () => {
    if (!selectedHubId || useMockData) return;

    try {
      const state = await HubManagementApi.getHubState(selectedHubId);
      setHubState(state || DEFAULT_HUB_STATE);
      setHubStateError(null);
    } catch (err) {
      console.error('Error fetching hub state:', err);
      const errorMsg = err.response?.status === 404
        ? 'Hub selezionato non trovato'
        : `Errore nel recupero delle informazioni dell'hub selezionato`;
      setHubStateError(errorMsg);
      setHubState(DEFAULT_HUB_STATE);
    }
  };

  // Fetch reservations
  const fetchReservations = async () => {
    if (!selectedHubId || useMockData) return;

    try {
      const res = await HubManagementApi.getReservations(selectedHubId);
      setReservations(res || DEFAULT_RESERVATIONS);
      setReservationsError(null);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      const errorMsg = err.response?.status === 404
        ? 'Hub selezionato non trovato'
        : `Errore nel recupero delle prenotazioni`;
      setReservationsError(errorMsg);
      setReservations(DEFAULT_RESERVATIONS);
    }
  };

  useEffect(() => {
    if (!selectedHubId) return;

    if (useMockData) {
      // Reset errors when using mock data
      setHubStructureError(null);
      setHubStateError(null);
      setReservationsError(null);
      return;
    }

    // Initial fetch
    fetchHubStructure();
    fetchHubState();
    fetchReservations();

    // Polling hub state every 2 seconds (update time simulation)
    const intervalId = setInterval(() => {
      fetchHubState();
    }, 2000);

    // Polling reservation every 60 seconds
    const intervalId2 = setInterval(() => {
      fetchReservations();
    }, 60_000);

    return () => {clearInterval(intervalId); clearInterval(intervalId2);};
  }, [selectedHubId, useMockData]);

  const transitioningChargers = useMemo(() => {
    return new Set(chargers.filter(c => isChargerInTransitionState(c.chargerOperationalState)).map(c => c.chargerId));
  }, [chargers]);

  const addChargerStateRow = (charger, canChargersBeDeactivate) => {
    const isActive = isChargerActive(charger.chargerOperationalState);
    const isTransitioning = transitioningChargers.has(charger.chargerId);
    const isNotInitialized = !isChargerStateInitialized(charger.chargerOperationalState);

    const isDisabled = isNotInitialized || isTransitioning || useMockData || (isActive && !canChargersBeDeactivate);

    const overlayButtonText = useMockData
      ? 'Disattivato in "mock mode"' : (isNotInitialized
        ? "Deve essere inizializzato" : (isTransitioning
          ? "In attesa" : (isActive
            ? 'Disattiva' : 'Attiva')))

    console.log("charger", charger)
    return (
      <TableRow key={charger.chargerId}>
        <TableCell variant="head">{charger.chargerId}</TableCell>
        <TableCell>
          <Chip
            label={charger.chargerType}
            size="small"
            variant="outlined"
            color={charger.chargerType !== 'AC' ? 'warning' : 'default'}
          />
        </TableCell>
        <TableCell>{charger.plugPowerKw}</TableCell>
        <TableCell>{getChargerOperationalStateChip(charger.chargerOperationalState)}</TableCell>
        <TableCell>
          <Chip
            label={charger.occupied ? 'Occupato' : 'Disponibile'}
            size="small"
            variant="filled"
            color={charger.occupied ? 'error' : 'primary'}
          />
        </TableCell>
        <TableCell align="right">{charger.currentPower?.toFixed(2) || 0.00}</TableCell>
        <TableCell align="center">
          <Tooltip title={overlayButtonText}>
            <span style={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}>
              <IconButton
                size="small"
                onClick={() => changeChargerOperationalState(charger.chargerId, charger.chargerOperationalState)}
                disabled={isDisabled}
                sx={{
                  color: isActive ? 'success.main' : 'text.disabled',
                  '&:hover': {
                    bgcolor: isActive ? 'success.light' : 'action.hover',
                  }
                }}
              >
                <PowerSettingsNewIcon />
              </IconButton>
            </span>
          </Tooltip>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#fafafa' }}>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 2, borderRadius: 0 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ mb: 1 }}>
          Torna alle Dashboard
        </Button>
        <Typography variant="h5" fontWeight="bold">
          Hub Manager
        </Typography>
        {useMockData && (
          <Chip label="Mock Data Mode" color="info" size="small" sx={{ ml: 2 }} />
        )}
      </Paper>

      {/* Content */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Panel - Hub Selection & Stats */}
        <Paper
          elevation={2}
          sx={{
            width: { xs: '100%', md: '40%', lg: '35%' },
            p: 3,
            overflowY: 'auto',
            borderRadius: 0,
            minWidth: 320,
          }}
        >
          <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
            Selezione Hub e Statistica
          </Typography>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Seleziona l'Hub</InputLabel>
            <Select value={selectedHubId || ''} onChange={(e) => setSelectedHubId(e.target.value)} label="Select Hub">
              {hubs.map((hub) => (
                <MenuItem key={hub.id} value={hub.id}>{hub.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedHub && (
            <>
              {/* Critical Error - Shows only error banner */}
              {hubManagerServiceError ? (
                <Alert severity="error" icon={<ErrorOutlineIcon />} sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Impossibile caricare dati hub
                  </Typography>
                  <Typography variant="body2">
                    {getErrorMessage()}
                  </Typography>
                </Alert>
              ) : (
                <>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>Dati Hub</Typography>
                  <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid item xs={6}>
                      <Card variant="outlined">
                        <CardContent sx={{ pb: 1.5 }}>
                          <Typography variant="caption" color="text.secondary">Posizione</Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {selectedHub.pos[0].toFixed(4)}, {selectedHub.pos[1].toFixed(4)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6}>
                      <Card variant="outlined">
                        <CardContent sx={{ pb: 1.5 }}>
                          <Typography variant="caption" color="text.secondary">Connettori Attivi</Typography>
                          <Typography variant="h6" sx={{ mt: 1 }}>{activeChargers} / {chargers.length}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6}>
                      <Card variant="outlined">
                        <CardContent sx={{ pb: 1.5 }}>
                          <Typography variant="caption" color="text.secondary">Veicoli in Ricarica</Typography>
                          <Typography variant="h6" sx={{ mt: 1 }}>{occupiedChargers}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  {/* Power Usage Section */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      Gestione Ricarica
                    </Typography>
                  </Box>
                  <Card variant="outlined" sx={{ mb: 4 }}>
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">Potenza Massima Erogabile</Typography>
                          <Typography variant="body1" fontWeight="bold">{currentMaxPower.toFixed(2)} kW</Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">Potenza in Uso</Typography>
                          <Typography variant="body1" fontWeight="bold" color="primary.main">
                            {currentPowerInUse.toFixed(2)} kW
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">Potenza Erogabile Rimanente</Typography>
                          <Typography variant="body1" fontWeight="bold" color="success.main">
                            {currentPowerRemaining.toFixed(2)} kW
                          </Typography>
                        </Grid>
                      </Grid>
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">Utilizzo dell'Hub</Typography>
                          <Typography variant="caption" fontWeight="bold">
                            {currentPowerInUsePercentage.toFixed(2)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={currentPowerInUsePercentage}
                          sx={{
                            height: 8,
                            borderRadius: 1,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: currentPowerInUsePercentage > 80 ? 'error.main' : 'primary.main'
                            }
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>

                  <CardContent>
                    <Box textAlign="center">
                      {operationalStateChangeError && (
                        <Typography variant="body2">
                          {operationalStateChangeError}
                        </Typography>
                      )}

                      <Typography variant="body2" color="text.secondary">
                        Nessuna Prenotazione Ancora Salvata
                      </Typography>
                    </Box>
                  </CardContent>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>Connettori</Typography>
                  <TableContainer sx={{ maxHeight: 300, mb: 4 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                          <TableCell>Connettore</TableCell>
                          <TableCell>Tipo</TableCell>
                          <TableCell>Potenza (kW)</TableCell>
                          <TableCell>Stato</TableCell>
                          <TableCell>Occupazione</TableCell>
                          <TableCell align="right">Potenza in uso (kW)</TableCell>
                          <TableCell align="center">Attiva/Disattiva</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(() => {
                          return chargers.map(charger => addChargerStateRow(charger, canDeactivateChargers()));
                        })()}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>Capacità</Typography>
                  <Stack spacing={2} sx={{ mb: 4 }}>
                    <Card variant="outlined">
                      <CardContent sx={{ pb: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption">Connettori a Ricarica Normale</Typography>
                          <Typography variant="caption" fontWeight="bold">{normalActive} / {totalNormalChargers} Attivi</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={totalNormalChargers > 0 ? (normalActive / totalNormalChargers) * 100 : 0} />
                      </CardContent>

                      <CardContent sx={{ pb: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption">Connettori a Ricarica Rapida</Typography>
                          <Typography variant="caption" fontWeight="bold">{fastActive} / {totalFastChargers} Attivi</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={totalFastChargers > 0 ? (fastActive / totalFastChargers) * 100 : 0}
                          sx={{ '& .MuiLinearProgress-bar': { backgroundColor: '#ff9800' } }}
                        />
                      </CardContent>
                    </Card>
                    <Card variant="outlined">
                      <CardContent sx={{ pb: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption">Connettori a Ricarica Lenta</Typography>
                          <Typography variant="caption" fontWeight="bold">{normalOccupied} / {normalActive} Occupati</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={normalActive > 0 ? (normalOccupied / normalActive) * 100 : 0} />
                      </CardContent>

                      <CardContent sx={{ pb: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption">Connettori a Ricarica Rapida</Typography>
                          <Typography variant="caption" fontWeight="bold">{fastOccupied} / {fastActive} Occupati</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={fastActive > 0 ? (fastOccupied / fastActive) * 100 : 0}
                          sx={{ '& .MuiLinearProgress-bar': { backgroundColor: '#ff9800' } }}
                        />
                      </CardContent>
                    </Card>
                  </Stack>

                  <Divider sx={{ my: 3 }} />

                  {/* Reservations Section */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <EventIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="subtitle2" fontWeight="bold">
                      Prenotazioni
                    </Typography>
                  </Box>

                  {/* Reservations Error */}
                  {reservationsError && !useMockData && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {reservationsError}
                    </Alert>
                  )}

                  <Tabs
                    value={reservationTab}
                    onChange={(e, newValue) => setReservationTab(newValue)}
                    sx={{ mb: 2, minHeight: 40 }}
                  >
                    <Tab label={`Oggi (${todayReservations.length})`} sx={{ minHeight: 40 }} />
                    <Tab label={`Tutte (${allReservations.length})`} sx={{ minHeight: 40 }} />
                  </Tabs>

                  {!reservationsError && displayedReservations.length === 0 ? (
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="body2" color="text.secondary" align="center">
                         <Typography variant="body2">
                          {operationalStateChangeError}
                        </Typography>
                        <Typography variant="body2">
                          {operationalStateChangeError}
                        </Typography>
                         Nessuna Prenotazione Ancora Salvata
                        </Typography>
                      </CardContent>
                    </Card>
                  ) : !reservationsError ? (
                    <TableContainer sx={{ maxHeight: 350 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                            <TableCell>Veicolo</TableCell>
                            <TableCell>Data</TableCell>
                            <TableCell>Fascia Oraria</TableCell>
                            <TableCell>Tipo di Connettore</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {displayedReservations.map((reservation, index) => (
                            <TableRow key={`${reservation.vehicleId}-${reservation.reservationDate}-${index}`}>
                              <TableCell>{reservation.vehicleId}</TableCell>
                              <TableCell>
                                <Typography variant="caption">
                                  {formatDate(reservation.reservationDate)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption">
                                  {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={reservation.reservedPlug}
                                  size="small"
                                  variant="outlined"
                                  color={reservation.reservedPlug !== 'AC' ? 'warning' : 'default'}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : null}
                </>
              )}
            </>
          )}
        </Paper>

        {/* Right Panel - Map */}
        <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' }, minWidth: 0 }}>
          <MapView pois={mapPois} onSelectPoi={(poi) => setSelectedHubId(poi.id)} selectedVehicle={null} />
        </Box>
      </Box>
    </Box>
  );
};

export default HubManagerDashboard;