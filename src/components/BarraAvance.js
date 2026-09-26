import { StyleSheet, View } from 'react-native';
import { colores } from '../theme';

/** @param {{ valor: number, total: number, alto?: number }} props */
export default function BarraAvance({ valor, total, alto = 6 }) {
  const pct = total > 0 ? Math.min(1, valor / total) : 0;
  return (
    <View style={[styles.pista, { height: alto, borderRadius: alto }]} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: valor }}>
      <View style={[styles.relleno, { width: `${pct * 100}%`, borderRadius: alto }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  pista: { backgroundColor: colores.pista, overflow: 'hidden' },
  relleno: { height: '100%', backgroundColor: colores.primario },
});
