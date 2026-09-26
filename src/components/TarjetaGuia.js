import { StyleSheet, View } from 'react-native';
import { colores, radios } from '../theme';
import IconoCaja from './IconoCaja';
import Texto from './Texto';

// Encabezado compacto de paquete (pantallas 9, 10 y aceptar transferencia).
/** @param {{ paquete: { guia: string, destinatario?: string|null, direccion?: string|null }, style?: import('react-native').StyleProp<import('react-native').ViewStyle> }} props */
export default function TarjetaGuia({ paquete, style }) {
  return (
    <View style={[styles.base, style]}>
      <IconoCaja />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Texto peso="bold" tam={15}>{paquete.guia}</Texto>
        <Texto tam={12} color={colores.textoSec} numberOfLines={1}>{[paquete.destinatario ?? "Destinatario sin registrar", paquete.direccion].filter(Boolean).join(", ")}</Texto>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colores.blanco, borderRadius: radios.tarjeta,
    borderWidth: 1, borderColor: colores.borde, paddingHorizontal: 13, paddingVertical: 11,
  },
});
