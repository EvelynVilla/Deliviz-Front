import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { X } from 'lucide-react-native';
import { colores } from '../theme';
import Texto from './Texto';

export default function Dialogo({ visible, titulo, subtitulo, onCerrar, children, pie, ancho = 480 }) {
  const { width, height } = useWindowDimensions();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <View style={styles.velo}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCerrar} accessibilityLabel="Cerrar" />
        <View style={[styles.caja, { width: Math.min(ancho, width - 32), maxHeight: height - 48 }]}>
          <View style={styles.cabecera}>
            <View style={{ flex: 1 }}>
              <Texto peso="bold" tam={18}>{titulo}</Texto>
              {subtitulo ? <Texto tam={13} color={colores.textoSec} style={{ marginTop: 2 }}>{subtitulo}</Texto> : null}
            </View>
            <Pressable onPress={onCerrar} hitSlop={8} style={({ hovered }) => [styles.cerrar, hovered && { backgroundColor: colores.gris }]} accessibilityLabel="Cerrar">
              <X size={18} color={colores.textoSec} strokeWidth={2.3} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 6 }}>{children}</ScrollView>
          {pie ? <View style={styles.pie}>{pie}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  velo: { flex: 1, backgroundColor: 'rgba(13,29,62,0.35)', alignItems: 'center', justifyContent: 'center' },
  caja: { backgroundColor: colores.blanco, borderRadius: 18, overflow: 'hidden', shadowColor: '#0D1D3E', shadowOpacity: 0.2, shadowRadius: 30, shadowOffset: { width: 0, height: 12 }, elevation: 12 },
  cabecera: { flexDirection: 'row', alignItems: 'flex-start', padding: 22, paddingBottom: 14 },
  cerrar: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  pie: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, padding: 18, paddingHorizontal: 22, borderTopWidth: 1, borderTopColor: colores.gris },
});
