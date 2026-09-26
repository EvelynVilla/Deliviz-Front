import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { colores, panel } from '../theme';
import Texto from './Texto';

// Contenido desplazable de cada sección del panel, con título, subtítulo y acciones.
export default function Pagina({ titulo, subtitulo, extraTitulo, acciones, children }) {
  const { width } = useWindowDimensions();
  const angosto = width < panel.quiebreAngosto;
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.contenido, angosto && { padding: 14 }]}>
      <View style={styles.limite}>
        <View style={[styles.cabecera, angosto && { flexDirection: 'column', alignItems: 'flex-start' }]}>
          <View style={{ flexShrink: 1, marginRight: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
              <Texto peso="extrabold" tam={angosto ? 24 : 30} alto={angosto ? 30 : 38}>{titulo}</Texto>
              {extraTitulo ? <View style={{ marginLeft: 12 }}>{extraTitulo}</View> : null}
            </View>
            {subtitulo ? <Texto tam={14.5} color={colores.textoSec} style={{ marginTop: 2 }}>{subtitulo}</Texto> : null}
          </View>
          {acciones ? <View style={[styles.acciones, angosto && { marginTop: 12 }]}>{acciones}</View> : null}
        </View>
        {children}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: 26, paddingBottom: 40 },
  limite: { width: '100%', maxWidth: panel.maxContenido, alignSelf: 'center' },
  cabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  acciones: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
});
