import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Stack,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Divider,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const HubsConfigSection = ({ hubs, onChange }) => {
  const [editingId, setEditingId] = useState(null);

  const addHub = () => {
    const newHub = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Hub ${hubs.length + 1}`,
      latitude: 52.52,
      longitude: 13.40,
      normalStations: 5,
      fastStations: 2,
      plugsPerStation: 2,

      // Nessun charger di default, l'utente deve aggiungerlo manualmente
      chargers: [],
    };
    const updatedHubs = [...hubs, newHub];
    onChange(updatedHubs);
  };

  const deleteHub = (id) => {
    onChange(hubs.filter((h) => h.id !== id));
  };


  const updateHub = (id, field, value) => {
    onChange(
      hubs.map((h) =>
        h.id === id
          ? {
              ...h,
              [field]: isNaN(value) ? value : Number(value),
            }
          : h
      )
    );
  };

  // Charger handlers
  const addCharger = (hubId) => {
    onChange(
      hubs.map((h) =>
        h.id === hubId
          ? {
              ...h,
              chargers: [
                ...h.chargers,
                {
                  id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                  type: 'CCS',
                  quantity: 1,
                  power: 50,
                },
              ],
            }
          : h
      )
    );
  };

  const updateCharger = (hubId, chargerId, field, value) => {
    onChange(
      hubs.map((h) =>
        h.id === hubId
          ? {
              ...h,
              chargers: h.chargers.map((c) =>
                c.id === chargerId
                  ? {
                      ...c,
                      [field]:
                        field === 'power' || field === 'quantity'
                          ? Number(value)
                          : value,
                    }
                  : c
              ),
            }
          : h
      )
    );
  };

  const deleteCharger = (hubId, chargerId) => {
    onChange(
      hubs.map((h) =>
        h.id === hubId
          ? {
              ...h,
              chargers: h.chargers.filter((c) => c.id !== chargerId),
            }
          : h
      )
    );
  };

  const toggleEditing = (id) => {
    setEditingId(editingId === id ? null : id);
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" gutterBottom>
          Charging Hubs Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Define charging hub locations and capacities
        </Typography>
      </Box>

      {/* Hub List */}
      <Stack spacing={2}>
        {hubs.map((hub) => (
          <Card key={hub.id} variant="outlined">
            <CardContent>
              {editingId === hub.id ? (
                <Stack spacing={2}>
                  <Grid container spacing={2}>
                    {/* Name */}
                    <Grid item xs={12}>
                      <TextField
                        label="Hub Name"
                        value={hub.name}
                        onChange={(e) => updateHub(hub.id, 'name', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>

                    {/* Latitude & Longitude */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Latitude"
                        type="number"
                        value={hub.latitude}
                        onChange={(e) => updateHub(hub.id, 'latitude', e.target.value)}
                        fullWidth
                        size="small"
                        inputProps={{ step: 0.0001 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Longitude"
                        type="number"
                        value={hub.longitude}
                        onChange={(e) => updateHub(hub.id, 'longitude', e.target.value)}
                        fullWidth
                        size="small"
                        inputProps={{ step: 0.0001 }}
                      />
                    </Grid>
                  </Grid>

                  {/* Charger List */}
                  <Box mt={2}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      Chargers
                    </Typography>
                    <Stack spacing={1}>
                      {hub.chargers && hub.chargers.length > 0 ? (
                        hub.chargers.map((charger) => (
                          <Paper key={charger.id} sx={{ p: 1.5, bgcolor: '#f5f5f5' }}>
                            <Grid container spacing={1} alignItems="center">
                              <Grid item xs={12} sm={3}>
                                <TextField
                                  label="Tipo"
                                  select
                                  SelectProps={{ native: true }}
                                  value={charger.type}
                                  onChange={(e) => {
                                    const newType = e.target.value;
                                    let newPower = charger.power;
                                    if (charger.type === 'CCS' && charger.power === 50 && newType === 'AC') {
                                      newPower = 3.5;
                                    } else if (charger.type === 'AC' && charger.power === 3.5 && newType === 'CCS') {
                                      newPower = 50;
                                    }
                                    // Aggiorna tipo e potenza insieme
                                    onChange(
                                      hubs.map((h) =>
                                        h.id === hub.id
                                          ? {
                                              ...h,
                                              chargers: h.chargers.map((c) =>
                                                c.id === charger.id
                                                  ? { ...c, type: newType, power: newPower }
                                                  : c
                                              ),
                                            }
                                          : h
                                      )
                                    );
                                  }}
                                  size="small"
                                  fullWidth
                                >
                                  <option value="CCS">CCS</option>
                                  <option value="AC">AC</option>
                                </TextField>
                              </Grid>
                              <Grid item xs={12} sm={3}>
                                <TextField
                                  label="Quantità"
                                  type="number"
                                  value={charger.quantity}
                                  onChange={(e) => updateCharger(hub.id, charger.id, 'quantity', e.target.value)}
                                  size="small"
                                  inputProps={{ min: 1 }}
                                  fullWidth
                                />
                              </Grid>
                              <Grid item xs={12} sm={4}>
                                <TextField
                                  label="Potenza (kW)"
                                  type="number"
                                  value={charger.power}
                                  onChange={(e) => {
                                    let val = Number(e.target.value);
                                    if (charger.type === 'CCS' && val < 50) val = 50;
                                    if (charger.type === 'AC' && val < 3.5) val = 3.5;
                                    updateCharger(hub.id, charger.id, 'power', val);
                                  }}
                                  size="small"
                                  inputProps={{ min: charger.type === 'CCS' ? 50 : 3.5, step: 0.1 }}
                                  fullWidth
                                />
                              </Grid>
                              <Grid item xs={12} sm={2}>
                                <IconButton color="error" onClick={() => deleteCharger(hub.id, charger.id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Grid>
                            </Grid>
                          </Paper>
                        ))
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Nessun charger configurato
                        </Typography>
                      )}
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => addCharger(hub.id)}
                        sx={{ mt: 1, alignSelf: 'flex-start' }}
                      >
                        Aggiungi Charger
                      </Button>
                    </Stack>
                  </Box>
                </Stack>
              ) : (
                <Stack spacing={1}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {hub.name}
                  </Typography>
                  <Divider />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Location
                        </Typography>
                        <Typography variant="body2">
                          {hub.latitude.toFixed(4)}, {hub.longitude.toFixed(4)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Chargers
                        </Typography>
                        <Typography variant="body2">
                          {hub.chargers && hub.chargers.length > 0
                            ? hub.chargers.map((c) => `${c.quantity}x ${c.type} (${c.power}kW)`).join(', ')
                            : 'Nessun charger'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Stack>
              )}
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => toggleEditing(hub.id)}>
                {editingId === hub.id ? 'Done' : 'Edit'}
              </Button>
              <Button
                size="small"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => deleteHub(hub.id)}
              >
                Delete
              </Button>
            </CardActions>
          </Card>
        ))}
      </Stack>

      {/* Add Hub Button */}
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={addHub}
        fullWidth
        sx={{ py: 1.5 }}
      >
        Add Charging Hub
      </Button>

      {/* Helper Text */}
      <Paper sx={{ p: 2, bgcolor: '#e3f2fd', border: '1px solid #bbdefb' }}>
        <Typography variant="caption">
          <strong>Tip:</strong> Each hub can have multiple charging stations with different
          charging speeds (normal vs. fast). Plugs per station allows for multiple simultaneous
          charges at a single station (e.g., common in shared parking lots).
        </Typography>
      </Paper>
    </Stack>
  );
};

export default HubsConfigSection;
