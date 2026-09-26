import { View } from 'react-native';

// Las cuatro esquinas de la guía de encuadre (foto y escaneo).
export default function MarcoEncuadre({ ancho, alto, color = '#FFFFFF', grosor = 3, largo = 30, radio = 12, style }) {
  const esquina = { position: 'absolute', width: largo, height: largo, borderColor: color };
  return (
    <View pointerEvents="none" style={[{ width: ancho, height: alto }, style]}>
      <View style={[esquina, { top: 0, left: 0, borderTopWidth: grosor, borderLeftWidth: grosor, borderTopLeftRadius: radio }]} />
      <View style={[esquina, { top: 0, right: 0, borderTopWidth: grosor, borderRightWidth: grosor, borderTopRightRadius: radio }]} />
      <View style={[esquina, { bottom: 0, left: 0, borderBottomWidth: grosor, borderLeftWidth: grosor, borderBottomLeftRadius: radio }]} />
      <View style={[esquina, { bottom: 0, right: 0, borderBottomWidth: grosor, borderRightWidth: grosor, borderBottomRightRadius: radio }]} />
    </View>
  );
}

