import React, { useState } from 'react';
import { styled } from '@mui/material/styles';

import {
  Paper,
  Typography,
  Tabs,
  Tab,
  Box,
  Stack,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Divider,
  IconButton,
  TextField,
} from '@mui/material';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import EvStationIcon from '@mui/icons-material/EvStation';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import SearchIcon from '@mui/icons-material/Search';
import DoneIcon from '@mui/icons-material/Done';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CardActions from '@mui/material/CardActions';
import Collapse from '@mui/material/Collapse';


const ExpandMore = styled((props) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme }) => ({
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
  variants: [
    {
      props: ({ expand }) => !expand,
      style: {
        transform: 'rotate(0deg)',
      },
    },
    {
      props: ({ expand }) => !!expand,
      style: {
        transform: 'rotate(180deg)',
      },
    },
  ],
}));

const EnhancedFloatingMenu = ({
  vehicles,
  hubs,
  stats,
  onSelectVehicle,
  filters,
  onFiltersChange,
  isConnected,
}) => {
  const [tabIndex, setTabIndex] = useState(0);
  
  const [expanded, setExpanded] = React.useState(false);
  const handleExpandClick = () => {
    setExpanded(!expanded);
  };


  const [pinnedVehicles, setPinnedVehicles] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const togglePin = (vehicleId) => {
    setPinnedVehicles((prev) => ({
      ...prev,
      [vehicleId]: !prev[vehicleId],
    }));
  };

  const getFilteredVehicles = () => {
    return vehicles.filter((v) =>
      v.name && v.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getStateColor = (state) => {
    switch (state) {
      case 'charging':
        return '#4caf50';
      case 'moving':
        return '#2196f3';
      case 'idle':
        return '#ff9800';
      default:
        return '#757575';
    }
  };

  const getStateLabel = (state) => {
    return state ? state.charAt(0).toUpperCase() + state.slice(1) : 'Unknown';
  };

  return (
    <Paper
      elevation={4}
      sx={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        width: '380px',
        zIndex: 1000,
        borderRadius: '12px',
        overflow: 'hidden',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: 'primary.main',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Simulation Dashboard
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <FiberManualRecordIcon
              sx={{
                fontSize: '12px',
                color: isConnected ? '#4caf50' : '#f44336',
              }}
            />
            <Typography variant="caption">
              {isConnected ? 'Connected' : 'Disconnected'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs
        value={tabIndex}
        onChange={(e, newVal) => setTabIndex(newVal)}
        variant="fullWidth"
        indicatorColor="primary"
        sx={{
          backgroundColor: '#fafafa',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SignalCellularAltIcon sx={{ fontSize: '20px' }} />
              <span>Stats</span>
            </Box>
          }
        />
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DirectionsCarIcon sx={{ fontSize: '20px' }} />
              <span>Vehicles</span>
            </Box>
          }
        />
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EvStationIcon sx={{ fontSize: '20px' }} />
              <span>Hubs</span>
            </Box>
          }
        />
      </Tabs>

      {/* Content */}
      <Box sx={{ p: 2, overflowY: 'auto', flexGrow: 1 }}>
        {/* TAB 0: STATISTICS */}
        {tabIndex === 0 && (
          <Stack spacing={2}>
            {/* Total Vehicles & Average SoC */}
            <Card variant="outlined" sx={{ minWidth: 200 }}>
                <CardContent 
                    sx={{ 
                    padding: '8px 16px', // Riduce il padding verticale
                    '&:last-child': { pb: '8px' } // Rimuove il padding extra che MUI aggiunge all'ultimo elemento
                    }}
                >
                    <Box 
                    sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center' // Allinea verticalmente i due testi
                    }}
                    >
                    <Typography variant="body2" color="text.secondary">
                        Total Vehicles
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary" sx={{ lineHeight: 1 }}>
                        {stats.totalVehicles}
                    </Typography>
                    </Box>
                </CardContent>
            </Card>

            <Card variant="outlined" sx={{ minWidth: 200 }}>
                <CardContent 
                    sx={{ 
                    padding: '8px 16px', // Riduce il padding verticale
                    '&:last-child': { pb: '8px' } // Rimuove il padding extra che MUI aggiunge all'ultimo elemento
                    }}
                >
                    <Box 
                    sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center' // Allinea verticalmente i due testi
                    }}
                    >
                    <Typography variant="body2" color="text.secondary">
                        Average SoC
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary" sx={{ lineHeight: 1 }}>
                         {stats.averageSoC}%
                    </Typography>
                    </Box>
                </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent sx={{ pb: 1.5 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Vehicle States
                </Typography>
                <Stack spacing={1.5}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption">Moving</Typography>
                      <Typography variant="caption" fontWeight="bold">
                        {stats.vehiclesMoving}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={
                        stats.totalVehicles > 0
                          ? (stats.vehiclesMoving / stats.totalVehicles) * 100
                          : 0
                      }
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#e3f2fd',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: '#2196f3',
                        },
                      }}
                    />
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption">Charging</Typography>
                      <Typography variant="caption" fontWeight="bold">
                        {stats.vehiclesCharging}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={
                        stats.totalVehicles > 0
                          ? (stats.vehiclesCharging / stats.totalVehicles) * 100
                          : 0
                      }
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#e8f5e9',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: '#4caf50',
                        },
                      }}
                    />
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption">Idle</Typography>
                      <Typography variant="caption" fontWeight="bold">
                        {stats.vehiclesIdle}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={
                        stats.totalVehicles > 0
                          ? (stats.vehiclesIdle / stats.totalVehicles) * 100
                          : 0
                      }
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#fff3e0',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: '#ff9800',
                        },
                      }}
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ minWidth: 200 }}>
                <CardContent 
                    sx={{ 
                    padding: '8px 16px', // Riduce il padding verticale
                    '&:last-child': { pb: '8px' } // Rimuove il padding extra che MUI aggiunge all'ultimo elemento
                    }}
                >
                    <Box 
                        sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center' // Allinea verticalmente i due testi
                        }}
                    >
                    <Typography variant="body2" color="text.secondary">
                        Saturated Hubs
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color={stats.saturatedHubs > 0 ? 'error' : 'success'} sx={{ lineHeight: 1 }}>
                         {stats.saturatedHubs}
                    </Typography>
                    </Box>
                </CardContent>
            </Card>
          </Stack>
        )}

        {/* TAB 1: VEHICLES */}
        {tabIndex === 1 && (
          <Stack spacing={2}>
            {/* Search Bar */}
            <TextField
              placeholder="Search vehicles..."
              size="small"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <Box sx={{ pr: 1, display: 'flex', alignItems: 'center' }}>
                    <SearchIcon fontSize="small" color="action" />
                  </Box>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.875rem',
                },
              }}
            />

            {/* Filters */}
           <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    width: '100%',
                    py: 0.5 // Padding verticale minimo
                }}>
                <Typography 
                    variant="caption" 
                    sx={{ 
                    fontWeight: 600, 
                    color: 'text.secondary', 
                    textTransform: 'uppercase', 
                    letterSpacing: 0.5 
                    }}
                >
                    Filters
                </Typography>

                <Stack direction="row" spacing={1}>
                    {[
                    { id: 'showMoving', label: 'Moving', color: 'success' },
                    { id: 'showCharging', label: 'Charging', color: 'warning' },
                    { id: 'showIdle', label: 'Idle', color: 'error' },
                    ].map((item) => {
                    const isActive = filters[item.id];
                    return (
                        <Chip
                        key={item.id}
                        label={item.label}
                        size="small"
                        onClick={() => onFiltersChange({ ...filters, [item.id]: !isActive })}
                        variant={isActive ? "filled" : "outlined"}
                        color={isActive ? item.color : "default"}
                        deleteIcon={<DoneIcon />}
                        sx={{ 
                            height: 22, // Super sottile
                            fontSize: '0.65rem',
                            fontWeight: isActive ? 700 : 400,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            // Effetti grafici per far capire che è cliccabile
                            '&:hover': {
                            backgroundColor: isActive ? undefined : 'action.hover',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            },
                            '&:active': {
                            transform: 'translateY(0px)'
                            }
                        }}
                        />
                    );
                    })}
                </Stack>
            </Box>

            <Divider />

            {/* Vehicle List */}
            {vehicles.length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                No vehicles available
              </Typography>
            ) : getFilteredVehicles().length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                No vehicles match "{searchQuery}"
              </Typography>
            ) : (
              <List dense sx={{ maxHeight: 300, overflowY: 'auto' }}>
                {/* Pinned vehicles first, then unpinned */}
                {[
                  ...getFilteredVehicles().filter((v) => pinnedVehicles[v.id]),
                  ...getFilteredVehicles().filter((v) => !pinnedVehicles[v.id]),
                ].map((vehicle) => (
                  <ListItem
                    key={vehicle.id}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => togglePin(vehicle.id)}
                      >
                        {pinnedVehicles[vehicle.id] ? (
                          <PushPinIcon fontSize="small" color="primary" />
                        ) : (
                          <PushPinOutlinedIcon fontSize="small" />
                        )}
                      </IconButton>
                    }
                    sx={{
                      cursor: 'pointer',
                      borderLeft: pinnedVehicles[vehicle.id]
                        ? '4px solid #2196f3'
                        : '4px solid transparent',
                      pl: 1.5,
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                      },
                    }}
                    onClick={() => onSelectVehicle(vehicle)}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: getStateColor(vehicle.state),
                        }}
                      >
                        <DirectionsCarIcon fontSize="small" />
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={vehicle.name}
                      secondary={
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5, alignItems: 'center' }}>
                          <Chip
                            label={getStateLabel(vehicle.state)}
                            size="small"
                            variant="outlined"
                            sx={{
                              height: 20,
                              borderColor: getStateColor(vehicle.state),
                              color: getStateColor(vehicle.state),
                              '& .MuiChip-label': { px: 1 },
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {vehicle.soc}%
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Stack>
        )}

        {/* TAB 2: HUBS */}
        {tabIndex === 2 && (
          <Stack spacing={2}>
            {hubs.length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                No hubs available
              </Typography>
            ) : (
              hubs.map((hub) => {
                const normalOccupancy = (hub.occupancy?.normal || 0) / (hub.totalCapacity?.normal || 1);
                const fastOccupancy = (hub.occupancy?.fast || 0) / (hub.totalCapacity?.fast || 1);
                const isSaturated = normalOccupancy >= 1 || fastOccupancy >= 1;

                return (
                  <Card
                    key={hub.id}
                    variant="outlined"
                    sx={{
                      borderLeft: isSaturated ? '4px solid #f44336' : '4px solid #4caf50',
                    }}
                  >
                    <CardContent sx={{ pb: 0.5 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {hub.name}
                      </Typography>

                      {/* Normal Stations */}
                      <Box sx={{ mt: 1 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            mb: 0.5,
                          }}
                        >
                          <Typography variant="caption">Normal</Typography>
                          <Typography variant="caption" fontWeight="bold">
                            {hub.occupancy?.normal || 0} / {hub.totalCapacity?.normal || 0}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(normalOccupancy * 100, 100)}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>

                      {/* Fast Charging */}
                      {(hub.totalCapacity?.fast || 0) > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              mb: 0.5,
                            }}
                          >
                            <Typography variant="caption">Fast</Typography>
                            <Typography variant="caption" fontWeight="bold">
                              {hub.occupancy?.fast || 0} / {hub.totalCapacity?.fast || 0}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(fastOccupancy * 100, 100)}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      )}
                    </CardContent>
                    
                    <CardActions disableSpacing>
                      <ExpandMore
                        expand={expanded}
                        onClick={handleExpandClick}
                        aria-expanded={expanded}
                        aria-label="show more"
                      >
                        <ExpandMoreIcon />
                      </ExpandMore>
                    </CardActions>
                    
                    <Collapse in={expanded} timeout="auto" unmountOnExit>
                      <List dense sx={{ maxHeight: 300, overflowY: 'auto'}}>
                      
                       {/*chargers.map((charger, index) => (
                         
                        ))*/}

                         <ListItem
                            key={1}
                            sx={{
                              cursor: 'pointer',
                              '&:hover': { backgroundColor: '#f5f5f5' },
                            }}
                          >
                            {/* Numero progressivo */}
                            <Typography
                              variant="caption"
                              sx={{ width: 24, fontWeight: 600, color: 'text.secondary' }}
                            >
                              1.
                            </Typography>

                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                   {/* Tipologia */}
                                  <Typography variant="body2" fontWeight={600}>
                                    ACC
                                  </Typography>

                                  {/* Potenza */}
                                  <Typography variant="caption" color="text.secondary">
                                   40/55 kW
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <Box sx={{ display: 'flex', gap: 1, mt: 0.5, display: 'flex', justifyContent: 'space-between'}}>
                                  <Typography variant="caption" color="text.secondary">
                                    Ev_1
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    SoC: 40%
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                      </List>

                    </Collapse>
                  </Card>
                );
              })
            )}
          </Stack>
        )}
      </Box>
    </Paper>
  );
};

export default EnhancedFloatingMenu;
