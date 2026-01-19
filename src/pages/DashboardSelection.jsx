import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import EvStationIcon from '@mui/icons-material/EvStation';
import TimelineIcon from '@mui/icons-material/Timeline';
import { useSimulation } from '../contexts/SimulationContext';

const DashboardSelection = () => {
  const navigate = useNavigate();
  const { chargingHubs, isSetupComplete } = useSimulation();

  const dashboards = [
    {
      id: 'user',
      title: 'User Dashboard',
      description: 'Plan your route with optimal charging stops',
      icon: <DirectionsCarIcon sx={{ fontSize: 40, color: '#2196f3' }} />,
      route: '/user/dashboard',
      enabled: true,
      badge: null,
    },
    {
      id: 'simulation',
      title: 'Simulation Dashboard',
      description: 'Setup and monitor multi-vehicle simulations',
      icon: <TimelineIcon sx={{ fontSize: 40, color: '#4caf50' }} />,
      route: '/simulation/setup',
      enabled: true,
      badge: isSetupComplete() ? 'Ready' : null,
    },
    {
      id: 'hub-manager',
      title: 'Hub Manager Dashboard',
      description: 'Manage charging hubs and monitor stall occupancy',
      icon: <EvStationIcon sx={{ fontSize: 40, color: '#ff9800' }} />,
      route: '/hub/dashboard',
      enabled: true,//chargingHubs && chargingHubs.length > 0,
      badge: chargingHubs ? `${chargingHubs.length} Hubs` : null,
    },
  ];

  return (
    <Box sx={{ 
      width: '100%', 
      minHeight: '80vh', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'background.default',
      p: { xs: 2, md: 4, lg: 6 } // Padding responsivo
    }}>
      <Box sx={{ mb: 6, textAlign: 'left' }}>
        <Typography variant="h4" component="h1" fontWeight="800" gutterBottom>
          Dashboard Selection
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Select an operational environment to manage your fleet
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ flexGrow: 1 }}>
        {dashboards.map((dashboard) => (
          <Grid item xs={12} md={6} lg={4} key={dashboard.id}>
            <Card
              variant="outlined"
              onClick={() => dashboard.enabled && navigate(dashboard.route)}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                position: 'relative',
                transition: 'all 0.2s ease-in-out',
                opacity: dashboard.enabled ? 1 : 0.7,
                cursor: dashboard.enabled ? 'pointer' : 'not-allowed',
                '&:hover': dashboard.enabled ? {
                  borderColor: 'primary.main',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  transform: 'translateY(-4px)'
                } : {},
              }}
            >
              <CardContent sx={{ p: 4, flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box sx={{ 
                    p: 1.5, 
                    borderRadius: 2, 
                    bgcolor: 'action.hover',
                    display: 'flex'
                  }}>
                    {dashboard.icon}
                  </Box>
                  {dashboard.badge && (
                    <Chip label={dashboard.badge} color="primary" size="small" sx={{ fontWeight: bold }} />
                  )}
                </Box>

                <Typography variant="h5" fontWeight="700" gutterBottom>
                  {dashboard.title}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                  {dashboard.description}
                </Typography>

                {!dashboard.enabled && (
                  <Chip 
                    label="Requirements not met" 
                    size="small" 
                    color="error" 
                    variant="soft" // Se disponibile nel tuo tema, altrimenti "outlined"
                    sx={{ mt: 'auto' }}
                  />
                )}
              </CardContent>
              
              <CardActions sx={{ p: 3, pt: 0 }}>
                <Button 
                  fullWidth 
                  variant={dashboard.enabled ? "contained" : "outlined"}
                  disabled={!dashboard.enabled}
                  disableElevation
                  sx={{ borderRadius: 2, py: 1 }}
                >
                  Enter System
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default DashboardSelection;