import React, { useState, useMemo } from 'react';
import { styled } from '@mui/material/styles';
import {
  Paper, Typography, Tabs, Tab, Box, Stack, List, ListItem, ListItemIcon,
  ListItemText, Card, CardContent, LinearProgress, Chip, Divider, IconButton,
  TextField, Tooltip, Collapse, CardActions
} from '@mui/material';

// Icone
import {
  PushPin as PushPinIcon,
  PushPinOutlined as PushPinOutlinedIcon,
  DirectionsCar as DirectionsCarIcon,
  EvStation as EvStationIcon,
  SignalCellularAlt as SignalCellularAltIcon,
  FiberManualRecord as FiberManualRecordIcon,
  Search as SearchIcon,
  Done as DoneIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon
} from '@mui/icons-material';

import HubCard from "./HubCard.jsx";

// Componente Styled per l'espansione dei Hub
const ExpandMore = styled((props) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
  transform: expand ? 'rotate(180deg)' : 'rotate(0deg)',
}));

// --- SOTTO-COMPONENTE: FILTRI ---
const FilterChips = ({ filters, onFiltersChange, stateConfig}) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', py: 0.5 }}>
    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
      Filters
    </Typography>
    <Stack direction="row" spacing={1}>
      {Object.entries(stateConfig).map(([key, cfg]) => {
        if (!cfg.filterKey) return null;
        const isActive = filters[cfg.filterKey];
        return (
          <Chip
            key={key}
            label={cfg.label}
            size="small"
            onClick={() => onFiltersChange({ ...filters, [cfg.filterKey]: !isActive })}
            sx={{
              height: 22,
              fontSize: '0.65rem',
              fontWeight: isActive ? 700 : 400,
              backgroundColor: isActive ? cfg.color : 'transparent',
              color: isActive ? '#fff' : 'text.secondary',
              borderColor: cfg.color,
              border: isActive ? 'none' : '1px solid',
              '&:hover': {
                backgroundColor: isActive ? cfg.color : 'rgba(0,0,0,0.04)',
                opacity: 0.9,
                transform: 'translateY(-1px)'
              }
            }}
          />
        );
      })}
    </Stack>
  </Box>
);

// --- SOTTO-COMPONENTE: STATS VEICOLI ---
const VehicleStats = ({ simulationStats, config}) => {
  return (
    <>
      {Object.entries(simulationStats.vehicleCounts).map(([state, value]) => (
        <Box key={state} sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
              {state}
            </Typography>
            <Typography variant="caption" fontWeight="bold">
              {value}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={
              simulationStats.totalVehicles > 0
                ? (value / simulationStats.totalVehicles) * 100
                : 0
            }
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: `${config[state].color}22`,
              '& .MuiLinearProgress-bar': {
                bgcolor: config[state].color,
              },
            }}
          />
        </Box>
      ))}
    </>
  );
};

// --- SOTTO-COMPONENTE: VOCE MENù
const DataCard = ({ title, value}) => (
  <Card variant="outlined">
    <CardContent sx={{ p: '8px 16px', '&:last-child': { pb: '8px' } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">{title}</Typography>
        <Typography variant="h6" fontWeight="bold" color="primary">{value}</Typography>
      </Box>
    </CardContent>
  </Card>
);


const SimulationProgressBar = ({ currentTime, progress = 0 }) => {
  // Funzione per determinare il colore in base allo scaglione
  const getProgressColor = (val) => {
    if (val < 25) return '#2196f3'; // Blu (Fase iniziale)
    if (val < 60) return '#4caf50'; // Verde (In corso)
    if (val < 90) return '#ff9800'; // Arancione (Fase finale)
    return '#f44336';              // Rosso (Quasi terminata)
  };

  const currentColor = getProgressColor(progress);

  return (
    <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="caption" fontWeight="bold" color="text.secondary">
          SIMULATION TIME
        </Typography>
        <Typography variant="caption" fontWeight="bold" sx={{ fontFamily: 'monospace', fontSize: '1rem', color: currentColor }}>
          {currentTime || "00:00:00"}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <LinearProgress 
          variant="determinate" 
          value={Math.min(progress, 100)} 
          sx={{ 
            flexGrow: 1, 
            height: 10, 
            borderRadius: 5,
            bgcolor: 'rgba(0,0,0,0.05)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 5,
              bgcolor: currentColor,
              transition: 'transform 0.4s ease-in-out, background-color 0.5s ease'
            }
          }} 
        />
      </Box>
    </Box>
  );
};


// --- LISTA VEICOLI
const VehicleList = ({ vehicles, onSelectVehicle, pinnedVehicles, togglePin, stateConfig }) => {
  return (
    <List dense sx={{ maxHeight: 400 }}>
      {vehicles.map((v) => {
        const config = stateConfig[(v.state || '').toLowerCase()] || stateConfig.unknown;
        const isPinned = pinnedVehicles[v.id];
        return (
          <ListItem
            key={v.id}
            onClick={() => onSelectVehicle(v)}
            sx={{ 
              borderRadius: 1, mb: 0.5, borderLeft: `4px solid ${isPinned ? '#2196f3' : 'transparent'}`,
              '&:hover': { bgcolor: 'action.hover', cursor: 'pointer' } 
            }}
            secondaryAction={
              <IconButton size="small" onClick={(e) => togglePin(e, v.id)}>
                {isPinned ? <PushPinIcon fontSize="small" color="primary" /> : <PushPinOutlinedIcon fontSize="small" />}
              </IconButton>
            }
          >
            <ListItemIcon sx={{ minWidth: 35 }}>
              <DirectionsCarIcon />
            </ListItemIcon>
            <ListItemText 
              primary={v.displayName} 
              secondary={
                <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                  <Chip 
                    label={config.label} 
                    size="small" 
                    variant="outlined" 
                    sx={{ height: 18, fontSize: '0.6rem', color: config.color, borderColor: config.color }} 
                  />
                  <Typography variant="caption">SoC: {v.soc}%</Typography>
                  <Typography variant="caption">Km: {v.kmDriven}</Typography>
                </Stack>
              } 
            />
          </ListItem>
        );
      })}
    </List>
  );
};


const EnhancedFloatingMenu = ({
  vehicles = [],
  hubs = [],
  stats = {},
  onSelectVehicle,
  filters,
  onFiltersChange,
  isConnected,
  stateConfig,
}) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pinnedVehicles, setPinnedVehicles] = useState({});

  // Gestione Pin
  const togglePin = (e, id) => {
    e.stopPropagation();
    setPinnedVehicles(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Logica filtraggio e ordinamento veicoli (usa direttamente Vehicle model)
  const processedVehicles = useMemo(() => {
    console.log("Rista..."); // Debug per vedere se scatta ad ogni update WS
    return [...vehicles] // Creiamo una copia locale
      .filter(v => v.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => (pinnedVehicles[b.id] || 0) - (pinnedVehicles[a.id] || 0));
  }, [vehicles, searchQuery, pinnedVehicles]);

  return (
    <Paper
      elevation={4}
      sx={{
        position: 'absolute', top: 20, left: 20, width: 380, zIndex: 1000,
        borderRadius: '12px', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" fontWeight="bold">Simulation Dashboard</Typography>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
            <FiberManualRecordIcon sx={{ fontSize: 12, color: isConnected ? '#4caf50' : '#f44336' }} />
            <Typography variant="caption">{isConnected ? 'Connected' : 'Disconnected'}</Typography>
          </Stack>
        </Box>
        <Tooltip title={isSimulating ? "Stop Simulation" : "Start Simulation"}>
          <IconButton 
            onClick={() => setIsSimulating(!isSimulating)}
            sx={{ bgcolor: isSimulating ? '#f44336' : '#4caf50', color: 'white', '&:hover': { opacity: 0.8, bgcolor: isSimulating ? 'error.dark' : 'success.dark' }, width: 45, height: 45 }}
          >
            {isSimulating ? <StopIcon /> : <PlayArrowIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      <SimulationProgressBar 
        currentTime={"10:20:30"} 
        progress={"10"} 
      />


      {/* Tabs */}
      <Tabs value={tabIndex} onChange={(_, n) => setTabIndex(n)} variant="fullWidth" sx={{ bgcolor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
        <Tab icon={<SignalCellularAltIcon fontSize="small" />} label="Stats" />
        <Tab icon={<DirectionsCarIcon fontSize="small" />} label="Vehicles" />
        <Tab icon={<EvStationIcon fontSize="small" />} label="Hubs" />
      </Tabs>

      <Box sx={{ p: 2, overflowY: 'auto', flexGrow: 1 }}>
        {/* TAB 0: STATISTICS */}
        {tabIndex === 0 && (
          <Stack spacing={2}>

            <DataCard title="Total Vehicles" value={stats.totalVehicles || 0} />
            <DataCard title="Average SoC"    value={stats.averageSoC    || 0} />  
            <DataCard title="Saturated Hubs" value={stats.saturatedHubs || 0} />

            {/* Vehicle States */}
            <Card variant="outlined">
              <CardContent sx={{ p: 1.5 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Vehicle States</Typography>
                <Stack spacing={1.5}>
                  <VehicleStats simulationStats={stats} config={stateConfig} />
                </Stack>
              </CardContent>
            </Card>

          </Stack>
        )}

        {/* TAB 1: VEHICLES */}
        {tabIndex === 1 && (
          <Stack spacing={2}>
            <TextField
              placeholder="Search vehicles..."
              size="small" fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon fontSize="small" color="action" sx={{ mr: 1 }} /> }}
            />
            
            <FilterChips filters={filters} onFiltersChange={onFiltersChange} stateConfig={stateConfig} />
            <Divider />

            <VehicleList
              vehicles={processedVehicles}
              onSelectVehicle={onSelectVehicle}
              pinnedVehicles={pinnedVehicles}
              togglePin={togglePin}
              stateConfig={stateConfig}
            ></VehicleList>
          </Stack>
        )}

        {/* TAB 2: HUBS */}
        {tabIndex === 2 && (
          <Stack spacing={2}>
            {hubs.length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>No hubs available</Typography>
            ) : (
              <Box>
                {hubs.map((hub) => (
                  <HubCard key={hub.id} hub={hub} />
                ))}
              </Box>
            )}
          </Stack>
        )}
      </Box>
    </Paper>
  );
};

export default EnhancedFloatingMenu;