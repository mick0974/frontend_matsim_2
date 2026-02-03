import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import EvStationIcon from '@mui/icons-material/EvStation';
import HomeIcon from '@mui/icons-material/Home';
import WorkIcon from '@mui/icons-material/Work';
import { Typography, Box, Chip, LinearProgress } from '@mui/material';

export const POI_TYPES = {
  vehicle: {
    label: 'Veicolo',
    category: 'mobile',
    icon: <DirectionsCarIcon fontSize="inherit" />,
    color: '#2196f3',
    renderPopup: (poi) => (
      <Box>
        <Typography variant="subtitle2">{poi.model}</Typography>
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption">Batteria: {poi.soc}%</Typography>
          <LinearProgress variant="determinate" value={poi.soc} sx={{ height: 6, borderRadius: 3 }} />
        </Box>
      </Box>
    )
  },
  hub: {
    label: 'hub',
    category: 'fixed',
    icon: <EvStationIcon fontSize="inherit"/>,
    color: '#4caf50',
    renderPopup: (poi) => (
      <Box>
        <Typography variant="subtitle2">{poi.name}</Typography>
        <Chip label="Disponibile" size="small" color="success" sx={{ mt: 1 }} />
      </Box>
    )
  },
  home: {
    label: 'Casa',
    category: 'fixed',
    icon: <HomeIcon fontSize="inherit" />,
    color: '#9c27b0',
    renderPopup: (poi) => (
      <Box>
        <Typography variant="subtitle2">Casa ID: {poi.id}</Typography>
        <Typography variant="body2">Altitudine: {poi.alt}m</Typography>
      </Box>
    )
  },
  work: {
    label: 'Lavoro',
    category: 'fixed',
    icon: <WorkIcon fontSize="inherit" />,
    color: '#ff9800',
    renderPopup: (poi) => (
      <Box>
        <Typography variant="subtitle2">{poi.name}</Typography>
        <Chip label="Attivo" size="small" color="success" sx={{ mt: 1 }} />
      </Box>
    )
  }
};