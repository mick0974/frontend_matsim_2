import React, {useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Paper, Typography, Card, CardContent, LinearProgress, Select, MenuItem, FormControl, InputLabel, Stack, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, IconButton, Tooltip, Tabs, Tab, Divider, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import EventIcon from '@mui/icons-material/Event';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import MapView from '../components/map';
import { useSimulation } from '../contexts/SimulationContext';
import HubManagementApi from "../services/hubManagementApi.js";
import AppConfig from "../config/appConfig.js";
import {HUB_MANAGER_MOCK} from "../utils/HubManagerDashboardMock.js";

// Default states when mock is disabled
const DEFAULT_HUB_STRUCTURE = {
  chargerStructureDTOs: []
};

const DEFAULT_HUB_STATE = {
  occupancy: 0,
  energy: 0,
  chargerStates: []
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
  const { monitoringHubs, chargingHubs } = useSimulation();
  const hubs = monitoringHubs.length > 0 ? monitoringHubs : chargingHubs || mockHubs;
  const [selectedHubId, setSelectedHubId] = useState(hubs.length > 0 ? hubs[0].id : null);

  const [selectedHubStructure, setHubStructure] = useState(DEFAULT_HUB_STRUCTURE);
  const [hubStructureError, setHubStructureError] = useState(null);
  const [selectedHubState, setHubState] = useState(DEFAULT_HUB_STATE);
  const [hubStateError, setHubStateError] = useState(null);
  const [togglingChargers, setTogglingChargers] = useState(new Set());

  // Reservations state
  const [reservations, setReservations] = useState(DEFAULT_RESERVATIONS);
  const [reservationsError, setReservationsError] = useState(null);
  const [reservationTab, setReservationTab] = useState(0); // 0 = today, 1 = all

  const selectedHub = hubs.find((h) => h.id === selectedHubId);

  // Determine data source
  const useMockData = !AppConfig.USE_MOCK_DATA;
  const hubStructure = useMockData ? HUB_MANAGER_MOCK.MOCK_HUB_STRUCTURE : selectedHubStructure;
  const hubState = useMockData ? HUB_MANAGER_MOCK.MOCK_HUB_STATE : selectedHubState;
  const reservationsData = useMockData ? HUB_MANAGER_MOCK.MOCK_RESERVATIONS : reservations;

  // Merge hub structure and hub state to get complete charger data
  const chargerStructureMap = new Map(
    (hubStructure.chargerStructureDTOs || []).map(chargerStructure => [chargerStructure.chargerId, chargerStructure.plugType])
  );

  const chargers = (hubState.chargerStates || []).map(chargerState => ({
    ...chargerState,
    plugType: chargerStructureMap.get(chargerState.chargerId) || 'UNKNOWN'
  }));

  const totalEnergyDelivered = hubState.energy || 0.0;
  const occupiedChargers = chargers.filter((c) => c.occupied).length;
  const activeChargers = chargers.filter((c) => isChargerActive(c.chargerOperationalState)).length;

  // Calculate capacity breakdown from structure and state
  const totalNormalChargers = (hubStructure.chargerStructureDTOs || []).filter(cs => cs.plugType === 'standard').length;
  const totalFastChargers = (hubStructure.chargerStructureDTOs || []).filter(cs => cs.plugType === 'fast charge').length;

  const normalChargers = chargers.filter((c) => c.plugType === 'standard');
  const fastChargers = chargers.filter((c) => c.plugType === 'fast charge');

  const normalActive = normalChargers.filter((c) => isChargerActive(c.chargerOperationalState)).length;
  const fastActive = fastChargers.filter((c) => isChargerActive(c.chargerOperationalState)).length;

  const mapPois = hubs.map((hub) => ({ ...hub, type: 'hub' }));

  // To render the hub data, its structure and current state are necessary
  const hubManagerServiceError = (hubStructureError !== null || hubStateError !== null) && !useMockData;

  // Error messages to render
  const getErrorMessage = () => {
    if (hubStructureError)
      return `Error loading hub structure`;

    if (hubStateError)
      return `${hubStateError}`;

    return 'An error occurred while loading hub data.';
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

  // Check if charger is active (ON/ACTIVE)
  function isChargerActive(state) {
    return state === 'ACTIVE' || state === 'ON';
  }

  // Get charger type label
  const getChargerTypeLabel = (plugType) => {
    if (plugType === 'standard') return 'Normal';
    if (plugType === 'fast charge') return 'Fast';
    return plugType;
  };

  // Get operational status
  const getChargerOperationalState = (state) => {
    const isActive = isChargerActive(state);
    return (
      <Chip
        label={isActive ? 'Active' : 'Inactive'}
        size="small"
        color={isActive ? 'success' : 'default'}
        variant={isActive ? 'filled' : 'outlined'}
      />
    );
  };

  // Get charging status chip
  const getChargingStatusChip = (occupied) => {
    return (
      <Chip
        label={occupied ? 'Charging' : 'Idle'}
        size="small"
        color={occupied ? 'primary' : 'default'}
        variant={occupied ? 'filled' : 'outlined'}
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
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('it-IT', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Toggle charger state (active/inactive)
  const changeChargerOperationalState = async (chargerId, currentState) => {
    if (!selectedHubId || useMockData) return;

    const isActive = isChargerActive(currentState);
    const newState = isActive ? 'INACTIVE' : 'ACTIVE';

    setTogglingChargers(prev => new Set(prev).add(chargerId));

    try {
      await HubManagementApi.changeChargerOperationalState(selectedHubId, chargerId, newState);

      const updatedState = await HubManagementApi.getHubState(selectedHubId);
      setHubState(updatedState || DEFAULT_HUB_STATE);
      setHubStateError(null);
    } catch (err) {
      console.error('Error toggling charger state:', err);
      const errorMsg = err.response?.status === 404
        ? 'Selected hub not found'
        : `Failed to activate/deactivate charger:`;
      setHubStateError(errorMsg);
    } finally {
      setTogglingChargers(prev => {
        const newSet = new Set(prev);
        newSet.delete(chargerId);
        return newSet;
      });
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
        ? 'Selected hub not found '
        : `Failed to fetch hub structure}`;
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
        ? 'Hub not found'
        : `Failed to fetch hub state}`;
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
        ? 'Hub not found'
        : `Failed to fetch reservations'}`;
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

    // Polling hub state every 5 seconds (update time simulation)
    const intervalId = setInterval(() => {
      fetchHubState();
    }, 5000);

    // Polling reservation every 60 seconds
    const intervalId2 = setInterval(() => {
      fetchReservations();
    }, 60_000);

    return () => {clearInterval(intervalId); clearInterval(intervalId2);};
  }, [selectedHubId, useMockData]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#fafafa' }}>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 2, borderRadius: 0 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ mb: 1 }}>
          Back to Dashboards
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
            Hub Selection & Statistics
          </Typography>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Select Hub</InputLabel>
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
                    Unable to Load Hub Data
                  </Typography>
                  <Typography variant="body2">
                    {getErrorMessage()}
                  </Typography>
                </Alert>
              ) : (
                <>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>Hub Overview</Typography>
                  <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid item xs={6}>
                      <Card variant="outlined">
                        <CardContent sx={{ pb: 1.5 }}>
                          <Typography variant="caption" color="text.secondary">Location</Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {selectedHub.pos[0].toFixed(4)}, {selectedHub.pos[1].toFixed(4)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6}>
                      <Card variant="outlined">
                        <CardContent sx={{ pb: 1.5 }}>
                          <Typography variant="caption" color="text.secondary">Active Chargers</Typography>
                          <Typography variant="h6" sx={{ mt: 1 }}>{activeChargers} / {chargers.length}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6}>
                      <Card variant="outlined">
                        <CardContent sx={{ pb: 1.5 }}>
                          <Typography variant="caption" color="text.secondary">Vehicles Charging</Typography>
                          <Typography variant="h6" sx={{ mt: 1 }}>{occupiedChargers}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6}>
                      <Card variant="outlined">
                        <CardContent sx={{ pb: 1.5 }}>
                          <Typography variant="caption" color="text.secondary">Total Energy</Typography>
                          <Typography variant="h6" sx={{ mt: 1 }}>{totalEnergyDelivered} kWh</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>Charging Stations</Typography>
                  <TableContainer sx={{ maxHeight: 300, mb: 4 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                          <TableCell>Charger</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Vehicle</TableCell>
                          <TableCell align="right">Energy (kWh)</TableCell>
                          <TableCell align="center">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {chargers.map((charger) => {
                          const isActive = isChargerActive(charger.chargerOperationalState);
                          const isToggling = togglingChargers.has(charger.chargerId);

                          return (
                            <TableRow key={charger.chargerId}>
                              <TableCell variant="head">{charger.chargerId}</TableCell>
                              <TableCell>
                                <Chip
                                  label={getChargerTypeLabel(charger.plugType)}
                                  size="small"
                                  variant="outlined"
                                  color={charger.plugType !== 'standard' ? 'warning' : 'default'}
                                />
                              </TableCell>
                              <TableCell>{getChargerOperationalState(charger.chargerOperationalState)}</TableCell>
                              <TableCell>{getChargingStatusChip(charger.occupied)}</TableCell>
                              <TableCell align="right">{charger.energy}</TableCell>
                              <TableCell align="center">
                                <Tooltip title={useMockData ? 'Disabled in mock mode' : (isActive ? 'Turn Off' : 'Turn On')}>
                                  <span>
                                    <IconButton
                                      size="small"
                                      onClick={() => changeChargerOperationalState(charger.chargerId, charger.chargerOperationalState)}
                                      disabled={isToggling || useMockData}
                                      sx={{
                                        color: isActive ? 'success.main' : 'text.disabled',
                                        '&:hover': {
                                          bgcolor: isActive ? 'success.light' : 'action.hover'
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
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>Capacity Breakdown</Typography>
                  <Stack spacing={2} sx={{ mb: 4 }}>
                    <Card variant="outlined">
                      <CardContent sx={{ pb: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption">Normal Charging</Typography>
                          <Typography variant="caption" fontWeight="bold">{normalActive} / {totalNormalChargers} Active</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={totalNormalChargers > 0 ? (normalActive / totalNormalChargers) * 100 : 0} />
                      </CardContent>
                    </Card>
                    <Card variant="outlined">
                      <CardContent sx={{ pb: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption">Fast Charging</Typography>
                          <Typography variant="caption" fontWeight="bold">{fastActive} / {totalFastChargers} Active</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={totalFastChargers > 0 ? (fastActive / totalFastChargers) * 100 : 0}
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
                      Reservations
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
                    <Tab label={`Today (${todayReservations.length})`} sx={{ minHeight: 40 }} />
                    <Tab label={`All (${allReservations.length})`} sx={{ minHeight: 40 }} />
                  </Tabs>

                  {!reservationsError && displayedReservations.length === 0 ? (
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="body2" color="text.secondary" align="center">
                          No reservations registered yet
                        </Typography>
                      </CardContent>
                    </Card>
                  ) : !reservationsError ? (
                    <TableContainer sx={{ maxHeight: 350 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                            <TableCell>Vehicle</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Time Slot</TableCell>
                            <TableCell>Charger</TableCell>
                            <TableCell>Type</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {displayedReservations.map((reservation, index) => (
                            <TableRow key={`${reservation.vehicleId}-${reservation.reservationDate}-${index}`}>
                              <TableCell variant="head">{reservation.vehicleId}</TableCell>
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
                              <TableCell>{reservation.chargerId}</TableCell>
                              <TableCell>
                                <Chip
                                  label={getChargerTypeLabel(reservation.reservedPlug)}
                                  size="small"
                                  variant="outlined"
                                  color={reservation.reservedPlug !== 'standard' ? 'warning' : 'default'}
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