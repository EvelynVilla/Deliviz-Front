// Estilo claro del mapa, parecido al de los mockups (calles blancas sobre gris azulado).
// Solo aplica con Google Maps (Android). En iOS se usa Apple Maps con su estilo normal.
export default [
  { elementType: 'geometry', stylers: [{ color: '#EEF2F7' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7A869C' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#F4F7FB' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', stylers: [{ visibility: 'on' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#DCEFD9' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#5E9B63' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#DDE4EE' }] },
  { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road.highway', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#CFE3F6' }] },
];
