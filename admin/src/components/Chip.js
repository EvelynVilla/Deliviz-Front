import { Pressable, StyleSheet } from 'react-native';
import { colores } from '../theme';
import Texto from './Texto';

// Chip de opción (motivos, tipo de problema). Seleccionado: fondo azul claro y borde azul.
export default function Chip({ texto, seleccionado, onPress, icono: Icono }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: !!seleccionado }}
      style={({ pressed }) => [styles.base, seleccionado && styles.sel, pressed && !seleccionado && { backgroundColor: colores.gris }]}
    >
      {Icono && seleccionado ? <Icono size={15} color={colores.azulTexto} strokeWidth={2.3} style={{ marginRight: 6 }} /> : null}
      <Texto peso={seleccionado ? 'semibold' : 'medium'} tam={13} color={seleccionado ? colores.azulTexto : colores.tinta}>{texto}</Texto>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, height: 34, borderRadius: 999,
    backgroundColor: colores.blanco, borderWidth: 1, borderColor: colores.borde, marginRight: 8, marginBottom: 8,
  },
  sel: { backgroundColor: colores.primarioSuave, borderColor: colores.primario },
});
