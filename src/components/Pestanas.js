import { Pressable, StyleSheet, View } from 'react-native';
import { colores } from '../theme';
import Texto from './Texto';

// Pestañas con subrayado y contador (pantalla 2: Por recoger / En ruta / Entregados).
export default function Pestanas({ opciones, activa, onCambiar }) {
  return (
    <View style={styles.cont} accessibilityRole="tablist">
      {opciones.map((o) => {
        const sel = o.clave === activa;
        return (
          <Pressable key={o.clave} onPress={() => onCambiar(o.clave)} style={styles.pestana} accessibilityRole="tab" accessibilityState={{ selected: sel }}>
            <View style={styles.fila}>
              <Texto peso={sel ? 'bold' : 'medium'} tam={14} color={sel ? colores.azulTexto : colores.textoSec}>{o.titulo}</Texto>
              <View style={[styles.contador, sel && { backgroundColor: colores.primarioSuave }]}>
                <Texto peso="bold" tam={11} color={sel ? colores.azulTexto : colores.textoSec} alto={14}>{o.cuenta}</Texto>
              </View>
            </View>
            <View style={[styles.subrayado, sel && { backgroundColor: colores.primario }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  cont: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colores.borde },
  pestana: { flex: 1, alignItems: 'center', paddingTop: 10 },
  fila: { flexDirection: 'row', alignItems: 'center', paddingBottom: 10 },
  contador: { marginLeft: 7, minWidth: 20, paddingHorizontal: 5, height: 18, borderRadius: 9, backgroundColor: colores.gris, alignItems: 'center', justifyContent: 'center' },
  subrayado: { height: 2.5, alignSelf: 'stretch', marginHorizontal: 8, borderRadius: 2, backgroundColor: 'transparent', marginBottom: -1 },
});
