import { StyleSheet, View } from 'react-native';
import { Package } from 'lucide-react-native';
import { colores } from '../theme';

// Cuadrito color cartón con el ícono de paquete (tarjetas de transferencia y reporte).
/** @param {{ tam?: number }} props */
export default function IconoCaja({ tam = 36 }) {
  return (
    <View style={[styles.base, { width: tam, height: tam }]}>
      <Package size={tam * 0.5} color={colores.caja} strokeWidth={2} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 9, backgroundColor: colores.cajaSuave, alignItems: 'center', justifyContent: 'center' },
});
