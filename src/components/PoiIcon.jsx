import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { POI_TYPES } from './poiRegistry';

const getIcon = (type) => {  
  if(type == 'aggregated-vehicle' ) {
    return POI_TYPES.vehicle 
  }else if(type == 'aggregated-hub') {
    return POI_TYPES.hub 
  }
  return POI_TYPES[type] || POI_TYPES.hub;
}

/**
 * Crea un'icona personalizzata per i POI sulla mappa
 * @param {string} type - Tipo di POI ('vehicle', 'hub', 'aggregated')
 * @param {string} state - Stato del veicolo (per vehicle markers)
 * @param {object} stateConfig - Configurazione degli stati
 * @param {object} aggregateData - Dati di aggregazione {count, dominantState, stateDistribution}
 */
export const createCustomIcon = (type, state = null, stateConfig, aggregateData = null) => {
  // Config di base dal tipo di POI
  const config = getIcon(type);

  // Colore predefinito
  let color = config.color || '#333';
  let bgColor = '#fff';
  let borderColor = '#333';

  // Se è un veicolo singolo, usa STATE_CONFIG
  if (type === 'vehicle' && state) {
    const stateKey = state.toLowerCase();
    const stateCfg = stateConfig[stateKey] || stateConfig.unknown;

    color = stateCfg.color;
    borderColor = color;
  }

  // Hub singolo: usa config POI o fallback
  if (type === 'hub') {
    color = config.color || '#4caf50';
    borderColor = color;
  }

  // Aggregazione: usa il colore dello stato dominante
  if ((type === 'aggregated-vehicle' || type === 'aggregated-hub') && aggregateData) {
    const dominantStateKey = (aggregateData.dominantState || 'unknown').toLowerCase();
    const stateCfg = stateConfig[dominantStateKey] || stateConfig.unknown;
    color = stateCfg.color;
    borderColor = color;
  }

  // Badge per aggregazioni
  const badgeContent = aggregateData ? (
    <div
      style={{
        position: 'absolute',
        bottom: '-10px',
        right: '-10px',
        backgroundColor: color,
        color: '#fff',
        borderRadius: '50%',
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 'bold',
        border: '2px solid #fff',
        zIndex: 2000,
      }}
    >
      {aggregateData.count}
    </div>
  ) : null;

  const iconMarkup = renderToStaticMarkup(
    <div
      className="marker-pin-wrapper"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '40px',
        height: '40px',
        backgroundColor: bgColor,
        borderRadius: '50%',
        border: `3px solid ${borderColor}`,
        color: color,
        fontSize: '24px',
        boxShadow: '0px 3px 8px rgba(0,0,0,0.4)',
        position: 'relative',
        fontWeight: 'bold',
      }}
    >
      {badgeContent}
      {config.icon}
    </div>
  );

  return L.divIcon({
    html: iconMarkup,
    className: 'custom-poi-container',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};
