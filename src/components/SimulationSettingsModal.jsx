import React, { useState } from 'react';
import {
  Paper, Typography, Box, Stack, IconButton, TextField, Switch,
  FormControlLabel, Slider, Select, MenuItem, FormControl, InputLabel,
  Divider, Button, Chip, Alert, Collapse, Fade, Grid
} from '@mui/material';

import {
  Close as CloseIcon,
  Settings as SettingsIcon,
  Speed as SpeedIcon,
  Timer as TimerIcon,
  BatteryChargingFull as BatteryIcon,
  DirectionsCar as DirectionsCarIcon,
  EvStation as EvStationIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  FolderOpen as FolderIcon,
  Publish as PublishIcon,
  BugReport as DebugIcon
} from '@mui/icons-material';

// Enum matching backend
const PlanGenerationStrategy = {
  STATIC: 'STATIC',
  DYNAMIC: 'DYNAMIC'
};

// Sezione di configurazione riutilizzabile
const SettingsSection = ({ title, icon: Icon, children }) => (
  <Box sx={{ mb: 2 }}>
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
      <Icon fontSize="small" color="primary" />
      <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {title}
      </Typography>
    </Stack>
    <Box sx={{ pl: 1 }}>
      {children}
    </Box>
  </Box>
);

// Indicatore di validità configurazione
const ValidationIndicator = ({ isValid, message }) => (
  <Chip
    icon={isValid ? <CheckCircleIcon /> : <WarningIcon />}
    label={message}
    size="small"
    sx={{
      bgcolor: isValid ? 'success.light' : 'warning.light',
      color: isValid ? 'success.dark' : 'warning.dark',
      fontWeight: 600,
      fontSize: '0.7rem'
    }}
  />
);

const SimulationSettingsModal = ({ open, onClose, onSettingsChange, initialSettings = {} }) => {
  // Stato interno mappato ai DTO
  const [settings, setSettings] = useState({
    // === HubGenerationRequestDTO ===
    hubType: initialSettings.hubType || 'csv',
    csvResourceHub: initialSettings.csvResourceHub || 'csv/charging_hub.csv',

    // === FleetGenerationRequestDTO ===
    fleetType: initialSettings.fleetType || 'csv',
    csvResourceEv: initialSettings.csvResourceEv || 'csv/ev-dataset.csv',
    numeroVeicoli: initialSettings.numeroVeicoli || 2,
    socMedio: initialSettings.socMedio || 0.70,
    socStdDev: initialSettings.socStdDev || 0.05,

    // === SimulationSettingsDTO ===
    configPath: initialSettings.configPath || 'input/v%s/berlin-v%s.config.xml',
    planStrategy: initialSettings.planStrategy || PlanGenerationStrategy.STATIC,
    sampleSizeStatic: initialSettings.sampleSizeStatic || 0.001,
    targetSocMean: initialSettings.targetSocMean || 0.90,
    targetSocStdDev: initialSettings.targetSocStdDev || 0.05,
    debugLink: initialSettings.debugLink || false,
    stepSize: initialSettings.stepSize || 150.0,
    publisherRateMs: initialSettings.publisherRateMs || 3000,
    publisherDirty: initialSettings.publisherDirty || false,
    realTime: initialSettings.realTime || false,

    // Flag di validazione
    isConfigured: initialSettings.isConfigured || false
  });

  // Verifica se la configurazione è valida
  const validateSettings = () => {
    const isValid = 
      settings.configPath.trim() !== '' &&
      settings.csvResourceHub.trim() !== '' &&
      settings.csvResourceEv.trim() !== '' &&
      settings.numeroVeicoli >= 1 &&
      settings.sampleSizeStatic >= 0 && settings.sampleSizeStatic <= 1 &&
      settings.socMedio >= 0 && settings.socMedio <= 1 &&
      settings.socStdDev >= 0 &&
      settings.targetSocMean >= 0 && settings.targetSocMean <= 1 &&
      settings.targetSocStdDev >= 0 &&
      settings.stepSize > 0 &&
      settings.publisherRateMs > 0;
    
    return isValid;
  };

  const isValid = validateSettings();

  // Handler per aggiornare le impostazioni
  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Salva e chiudi
  const handleSave = () => {
    const updatedSettings = {
      ...settings,
      isConfigured: isValid
    };
    onSettingsChange(updatedSettings);
    onClose();
  };

  // Reset alle impostazioni di default
  const handleReset = () => {
    setSettings({
      // HubGenerationRequestDTO
      hubType: 'csv',
      csvResourceHub: 'csv/charging_hub.csv',
      // FleetGenerationRequestDTO
      fleetType: 'csv',
      csvResourceEv: 'csv/ev-dataset.csv',
      numeroVeicoli: 2,
      socMedio: 0.70,
      socStdDev: 0.05,
      // SimulationSettingsDTO
      configPath: 'input/v%s/berlin-v%s.config.xml',
      planStrategy: PlanGenerationStrategy.STATIC,
      sampleSizeStatic: 0.001,
      targetSocMean: 0.90,
      targetSocStdDev: 0.05,
      debugLink: false,
      stepSize: 150.0,
      publisherRateMs: 3000,
      publisherDirty: false,
      realTime: false,
      isConfigured: false
    });
  };

  if (!open) return null;

  return (
    <Fade in={open} timeout={200}>
      <Paper
        elevation={6}
        sx={{
          position: 'absolute',
          top: 20,
          left: 500,
          width: 420,
          zIndex: 1000,
          borderRadius: '12px',
          overflow: 'hidden',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        bgcolor: 'primary.main', 
        color: 'white', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <SettingsIcon />
          <Typography variant="h6" fontWeight="bold">Simulation Settings</Typography>
        </Stack>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Validation Alert */}
      <Collapse in={!isValid}>
        <Alert severity="warning" sx={{ borderRadius: 0 }}>
          Completa tutti i campi richiesti per avviare la simulazione.
        </Alert>
      </Collapse>

      {/* Content */}
      <Box sx={{ p: 2, overflowY: 'auto', flexGrow: 1 }}>
        
        {/* FILE PATHS */}
        <SettingsSection title="File Configuration" icon={FolderIcon}>
          <Stack spacing={2}>
            <TextField
              label="Config Path"
              size="small"
              fullWidth
              value={settings.configPath}
              onChange={(e) => handleChange('configPath', e.target.value)}
              helperText="Pattern: input/v%s/berlin-v%s.config.xml"
            />
            <TextField
              label="CSV Hub Resource"
              size="small"
              fullWidth
              value={settings.csvResourceHub}
              onChange={(e) => handleChange('csvResourceHub', e.target.value)}
            />
            <TextField
              label="CSV EV Resource"
              size="small"
              fullWidth
              value={settings.csvResourceEv}
              onChange={(e) => handleChange('csvResourceEv', e.target.value)}
            />
          </Stack>
        </SettingsSection>

        <Divider sx={{ my: 2 }} />

        {/* STRATEGIES */}
        <SettingsSection title="Plan Strategy" icon={SpeedIcon}>
          <Stack spacing={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Plan Strategy</InputLabel>
              <Select
                value={settings.planStrategy}
                label="Plan Strategy"
                onChange={(e) => handleChange('planStrategy', e.target.value)}
              >
                <MenuItem value={PlanGenerationStrategy.STATIC}>Static</MenuItem>
                <MenuItem value={PlanGenerationStrategy.DYNAMIC}>Dynamic</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </SettingsSection>

        <Divider sx={{ my: 2 }} />

        {/* VEHICLE SETTINGS */}
        <SettingsSection title="Vehicle Configuration" icon={DirectionsCarIcon}>
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Numero Veicoli"
                  type="number"
                  size="small"
                  fullWidth
                  value={settings.numeroVeicoli}
                  onChange={(e) => handleChange('numeroVeicoli', Math.max(1, Number(e.target.value)))}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Sample Size"
                  type="number"
                  size="small"
                  fullWidth
                  value={settings.sampleSizeStatic}
                  onChange={(e) => handleChange('sampleSizeStatic', Number(e.target.value))}
                  inputProps={{ min: 0, max: 1, step: 0.001 }}
                />
              </Grid>
            </Grid>
          </Stack>
        </SettingsSection>

        <Divider sx={{ my: 2 }} />

        {/* SOC SETTINGS */}
        <SettingsSection title="State of Charge (SoC)" icon={BatteryIcon}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                SoC Medio: {(settings.socMedio * 100).toFixed(0)}%
              </Typography>
              <Slider
                value={settings.socMedio}
                onChange={(_, val) => handleChange('socMedio', val)}
                min={0}
                max={1}
                step={0.01}
                size="small"
                sx={{
                  '& .MuiSlider-track': { bgcolor: 'success.main' },
                  '& .MuiSlider-thumb': { bgcolor: 'success.main' }
                }}
              />
            </Box>

            <TextField
              label="SoC Std Dev"
              type="number"
              size="small"
              fullWidth
              value={settings.socStdDev}
              onChange={(e) => handleChange('socStdDev', Math.max(0, Number(e.target.value)))}
              inputProps={{ min: 0, max: 1, step: 0.01 }}
            />

            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Target SoC Mean: {(settings.targetSocMean * 100).toFixed(0)}%
              </Typography>
              <Slider
                value={settings.targetSocMean}
                onChange={(_, val) => handleChange('targetSocMean', val)}
                min={0}
                max={1}
                step={0.01}
                size="small"
                sx={{
                  '& .MuiSlider-track': { bgcolor: 'info.main' },
                  '& .MuiSlider-thumb': { bgcolor: 'info.main' }
                }}
              />
            </Box>

            <TextField
              label="Target SoC Std Dev"
              type="number"
              size="small"
              fullWidth
              value={settings.targetSocStdDev}
              onChange={(e) => handleChange('targetSocStdDev', Math.max(0, Number(e.target.value)))}
              inputProps={{ min: 0, max: 1, step: 0.01 }}
            />
          </Stack>
        </SettingsSection>

        <Divider sx={{ my: 2 }} />

        {/* SIMULATION PARAMS */}
        <SettingsSection title="Simulation Parameters" icon={TimerIcon}>
          <Stack spacing={2}>
            <TextField
              label="Step Size"
              type="number"
              size="small"
              fullWidth
              value={settings.stepSize}
              onChange={(e) => handleChange('stepSize', Math.max(0.1, Number(e.target.value)))}
              inputProps={{ min: 0.1, step: 10 }}
              helperText="Intervallo di simulazione (secondi)"
            />
          </Stack>
        </SettingsSection>

        <Divider sx={{ my: 2 }} />

        {/* PUBLISHER SETTINGS */}
        <SettingsSection title="Publisher Settings" icon={PublishIcon}>
          <Stack spacing={2}>
            <TextField
              label="Publisher Rate (ms)"
              type="number"
              size="small"
              fullWidth
              value={settings.publisherRateMs}
              onChange={(e) => handleChange('publisherRateMs', Math.max(100, Number(e.target.value)))}
              inputProps={{ min: 100, step: 100 }}
              helperText="Frequenza di aggiornamento WebSocket"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.publisherDirty}
                  onChange={(e) => handleChange('publisherDirty', e.target.checked)}
                  size="small"
                />
              }
              label={<Typography variant="body2">Publisher Dirty (solo modifiche)</Typography>}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.realTime}
                  onChange={(e) => handleChange('realTime', e.target.checked)}
                  size="small"
                />
              }
              label={<Typography variant="body2">Real Time Mode</Typography>}
            />
          </Stack>
        </SettingsSection>

        <Divider sx={{ my: 2 }} />

        {/* DEBUG */}
        <SettingsSection title="Debug Options" icon={DebugIcon}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.debugLink}
                onChange={(e) => handleChange('debugLink', e.target.checked)}
                size="small"
              />
            }
            label={<Typography variant="body2">Debug Link</Typography>}
          />
        </SettingsSection>

      </Box>

      {/* Footer */}
      <Box sx={{ 
        p: 2, 
        bgcolor: '#f8f9fa', 
        borderTop: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <ValidationIndicator 
          isValid={isValid} 
          message={isValid ? 'Pronto per simulare' : 'Configurazione incompleta'} 
        />
        
        <Stack direction="row" spacing={1}>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={handleReset}
            sx={{ textTransform: 'none' }}
          >
            Reset
          </Button>
          <Button 
            variant="contained" 
            size="small" 
            onClick={handleSave}
            disabled={!isValid}
            sx={{ textTransform: 'none' }}
          >
            Salva Impostazioni
          </Button>
        </Stack>
      </Box>
    </Paper>
    </Fade>
  );
};

export default SimulationSettingsModal;
