import { Pressable, StyleSheet, View } from 'react-native';
import { colores, radios } from '../theme';
import Texto from './Texto';

// Opción de lista con radio a la derecha (estado del paquete, nuevo responsable).
// `izquierda` es el ícono o avatar que va al inicio.
/** @param {{ titulo: string, detalle?: string, seleccionada?: boolean, onPress: () => void, izquierda?: import('react').ReactNode }} props */
export default function OpcionRadio({ titulo, detalle, seleccionada, onPress, izquierda }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: !!seleccionada }}
      style={({ pressed }) => [styles.base, seleccionada && styles.sel, pressed && !seleccionada && { backgroundColor: '#FAFBFD' }]}
    >
      {izquierda}
      <View style={{ flex: 1, marginLeft: izquierda ? 12 : 0 }}>
        <Texto peso="bold" tam={15}>{titulo}</Texto>
        {detalle ? <Texto tam={12} color={colores.textoSec}>{detalle}</Texto> : null}
      </View>
      <View style={[styles.radio, seleccionada && { borderColor: colores.primario }]}>
        {seleccionada ? <View style={styles.punto} /> : null}
      </View>
    </Pressable>
  );
}

/** @param {{ icono: import('react').ComponentType<any>, fondo: string, color: string, tam?: number }} props */
export function CuadroIcono({ icono: Icono, fondo, color, tam = 36 }) {
  return (
    <View style={{ width: tam, height: tam, borderRadius: 9, backgroundColor: fondo, alignItems: 'center', justifyContent: 'center' }}>
      <Icono size={tam * 0.47} color={color} strokeWidth={2.2} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colores.blanco, borderRadius: radios.tarjeta,
    borderWidth: 1, borderColor: colores.borde, paddingHorizontal: 13, paddingVertical: 11, marginBottom: 8,
  },
  sel: { borderColor: colores.primario, borderWidth: 1.5, backgroundColor: '#F8FBFF' },
  radio: { width: 21, height: 21, borderRadius: 11, borderWidth: 1.5, borderColor: colores.hueco, alignItems: 'center', justifyContent: 'center' },
  punto: { width: 11, height: 11, borderRadius: 6, backgroundColor: colores.primario },
});
