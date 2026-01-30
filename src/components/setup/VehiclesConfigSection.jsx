import React from 'react';
import {
  Box,
  TextField,
  Slider,
  Typography,
  Paper,
  Grid,
  Stack,
} from '@mui/material';

const VehiclesConfigSection = ({ config, onChange }) => {
  const handleTotalVehiclesChange = (e) => {
    const value = parseInt(e.target.value, 10);
    onChange({
      ...config,
      totalVehicles: value,
    });
  };

  const handleSocMeanChange = (e, value) => {
    onChange({
      ...config,
      socMean: value,
    });
  };

  const handleSocStdDevChange = (e, value) => {
    onChange({
      ...config,
      socStdDev: value,
    });
  };

  const handleUserTypeChange = (type, value) => {
    const newUserTypes = {
      ...config.userTypes,
      [type]: value,
    };

    // Normalize to 100%
    const total = Object.values(newUserTypes).reduce((a, b) => a + b, 0);
    if (total !== 100) {
      const ratio = 100 / total;
      Object.keys(newUserTypes).forEach((key) => {
        newUserTypes[key] = Math.round(newUserTypes[key] * ratio);
      });
    }

    onChange({
      ...config,
      userTypes: newUserTypes,
    });
  };

  const totalUserTypes =
    config.userTypes.commuter +
    config.userTypes.occasional +
    config.userTypes.others;

  return (
    <Stack spacing={4}>
      {/* Total Vehicles */}
      <Box>
        <Typography variant="h6" gutterBottom>
          Total Vehicles
        </Typography>
        <TextField
          type="number"
          value={config.totalVehicles}
          onChange={handleTotalVehiclesChange}
          inputProps={{ min: 1, max: 10000 }}
          fullWidth
          variant="outlined"
          size="small"
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Number of electric vehicles to simulate
        </Typography>
      </Box>

      {/* State of Charge Distribution */}
      <Paper sx={{ p: 3, bgcolor: '#f9f9f9' }}>
        <Typography variant="h6" gutterBottom>
          State of Charge (SoC) Distribution
        </Typography>

        {/* Mean SoC */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2">Mean SoC: {config.socMean}%</Typography>
          </Box>
          <Slider
            value={config.socMean}
            onChange={handleSocMeanChange}
            min={0}
            max={100}
            step={1}
            valueLabelDisplay="auto"
          />
          <Typography variant="caption" color="text.secondary">
            Average battery charge at simulation start
          </Typography>
        </Box>

        {/* Standard Deviation */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2">Std. Deviation: {config.socStdDev}%</Typography>
          </Box>
          <Slider
            value={config.socStdDev}
            onChange={handleSocStdDevChange}
            min={0}
            max={50}
            step={1}
            valueLabelDisplay="auto"
          />
          <Typography variant="caption" color="text.secondary">
            Variability in SoC distribution
          </Typography>
        </Box>
      </Paper>

      {/* User Type Distribution */}
      <Paper sx={{ p: 3, bgcolor: '#f9f9f9', display: 'none'}}>
        <Typography variant="h6" gutterBottom>
          User Type Distribution
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          Distribution percentages (auto-normalized to 100%)
        </Typography>

        <Grid container spacing={2}>
          {/* Commuter */}
          <Grid item xs={12} sm={6}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2">Commuter</Typography>
                <Typography variant="subtitle2" color="primary">
                  {config.userTypes.commuter}%
                </Typography>
              </Box>
              <Slider
                value={config.userTypes.commuter}
                onChange={(e, value) => handleUserTypeChange('commuter', value)}
                min={0}
                max={100}
                step={1}
                valueLabelDisplay="auto"
              />
              <Typography variant="caption" color="text.secondary">
                Regular daily commuters
              </Typography>
            </Box>
          </Grid>

          {/* Occasional */}
          <Grid item xs={12} sm={6}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2">Occasional</Typography>
                <Typography variant="subtitle2" color="primary">
                  {config.userTypes.occasional}%
                </Typography>
              </Box>
              <Slider
                value={config.userTypes.occasional}
                onChange={(e, value) => handleUserTypeChange('occasional', value)}
                min={0}
                max={100}
                step={1}
                valueLabelDisplay="auto"
              />
              <Typography variant="caption" color="text.secondary">
                Users with irregular patterns
              </Typography>
            </Box>
          </Grid>

          {/* Others */}
          <Grid item xs={12} sm={6}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2">Others</Typography>
                <Typography variant="subtitle2" color="primary">
                  {config.userTypes.others}%
                </Typography>
              </Box>
              <Slider
                value={config.userTypes.others}
                onChange={(e, value) => handleUserTypeChange('others', value)}
                min={0}
                max={100}
                step={1}
                valueLabelDisplay="auto"
              />
              <Typography variant="caption" color="text.secondary">
                Other user categories
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {totalUserTypes !== 100 && (
          <Typography
            variant="caption"
            color="warning"
            sx={{ mt: 2, display: 'block' }}
          >
            Warning: Distribution does not sum to 100% ({totalUserTypes}%)
          </Typography>
        )}
      </Paper>
    </Stack>
  );
};

export default VehiclesConfigSection;
