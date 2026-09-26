// Fotos de ejemplo. En producción cada evento trae la URL firmada de S3 (foto y miniatura)
// que genera el endpoint de Vaneza; aquí se usan imágenes locales en su lugar.
export const FOTOS = {
  bodega: require('../../assets/img/foto-bodega.jpg'),
  entrega: require('../../assets/img/foto-entrega.jpg'),
  danado: require('../../assets/img/foto-danado.jpg'),
  puerta: require('../../assets/img/foto-puerta.jpg'),
};

export const fuenteFoto = (clave) => (clave ? FOTOS[clave] ?? { uri: clave } : null);
