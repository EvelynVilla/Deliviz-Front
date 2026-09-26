import { StyleSheet, View } from 'react-native';
import { Lock } from 'lucide-react-native';
import { colores } from '../theme';
import Texto from './Texto';

// Tabla de metadatos que no se editan (guía, fecha y hora, lugar).
/** @param {{ filas: [string, string][], nota?: string }} props */
export default function TablaDatos({ filas, nota }) {
  return (
    <View>
      <View style={styles.caja}>
        {filas.map(([k, v], i) => (
          <View key={k} style={[styles.fila, i > 0 && styles.sep]}>
            <Texto tam={13} color={colores.textoSec}>{k}</Texto>
            <Texto peso="bold" tam={13} style={{ flexShrink: 1, textAlign: 'right', marginLeft: 12 }}>{v}</Texto>
          </View>
        ))}
      </View>
      {nota ? (
        <View style={styles.nota}>
          <Lock size={12} color={colores.textoSec} strokeWidth={2.2} style={{ marginRight: 6 }} />
          <Texto tam={12} color={colores.textoSec}>{nota}</Texto>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  caja: { backgroundColor: colores.blanco, borderRadius: 12, borderWidth: 1, borderColor: colores.borde, paddingHorizontal: 13 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  sep: { borderTopWidth: 1, borderTopColor: colores.gris },
  nota: { flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingLeft: 2 },
});
