import { StyleSheet, View } from 'react-native';
import { Info } from 'lucide-react-native';
import { colores } from '../theme';
import Texto from './Texto';

// Caja de aviso. tono 'gris' (info neutra), 'azul' (reglas de foto), 'ambar' (indicaciones / paso sin foto).
// Con `bloque`, el ícono va en un cuadro blanco y el título en su propia línea (pantalla 7).
export default function Aviso({ children, titulo, tono = 'gris', icono: Icono = Info, bloque, style }) {
  const t = TONOS[tono];
  if (bloque) {
    return (
      <View style={[styles.base, styles.bloque, { backgroundColor: t.fondo }, style]}>
        <View style={styles.cuadro}><Icono size={17} color={t.icono} strokeWidth={2.2} /></View>
        <View style={{ flex: 1, marginLeft: 11 }}>
          <Texto peso="bold" tam={14} color={t.titulo}>{titulo}</Texto>
          <Texto tam={12.5} color={t.texto} alto={17} style={{ marginTop: 1 }}>{children}</Texto>
        </View>
      </View>
    );
  }
  return (
    <View style={[styles.base, { backgroundColor: t.fondo }, style]}>
      <Icono size={15} color={t.icono} strokeWidth={2.2} style={{ marginTop: 2, marginRight: 9 }} />
      <Texto tam={12.5} color={t.texto} alto={18} style={{ flex: 1 }}>
        {titulo ? <Texto peso="bold" tam={12.5} color={t.titulo} alto={18}>{titulo} </Texto> : null}
        {children}
      </Texto>
    </View>
  );
}

const TONOS = {
  gris: { fondo: colores.gris, icono: colores.textoSec, texto: colores.textoSec, titulo: colores.tinta },
  azul: { fondo: colores.primarioSuave, icono: colores.azulTexto, texto: colores.azulTexto, titulo: colores.azulTexto },
  ambar: { fondo: colores.ambarSuave, icono: colores.ambar, texto: colores.ambarTexto, titulo: colores.ambarTexto },
};

const styles = StyleSheet.create({
  base: { flexDirection: 'row', borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11 },
  bloque: { paddingVertical: 13, alignItems: 'flex-start' },
  cuadro: {
    width: 34, height: 34, borderRadius: 9, backgroundColor: colores.blanco, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#7C5210', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
});
