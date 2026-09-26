import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Camera, Check, RotateCcw } from 'lucide-react-native';
import { colores, radios } from '../theme';
import { hora } from '../utils/formato';
import Texto from './Texto';

// Botón punteado cuando todavía no hay foto.
/** @param {{ texto?: string, alto?: number, onPress: () => void }} props */
export function TomarFotoVacio({ texto = 'Tomar foto', alto = 120, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.vacio, { height: alto }, pressed && { backgroundColor: colores.primarioSuave }]} accessibilityRole="button">
      <View style={styles.iconoVacio}><Camera size={20} color={colores.primario} strokeWidth={2.2} /></View>
      <Texto peso="semibold" tam={14} color={colores.azulTexto} style={{ marginTop: 8 }}>{texto}</Texto>
      <Texto tam={12} color={colores.textoSec}>Solo con la cámara, se guarda con hora y ubicación</Texto>
    </Pressable>
  );
}

// Fila compacta "Foto tomada, 10:24, con ubicación · Repetir" (pantalla 9).
/** @param {{ foto: { uri: string, fecha: string }, onRepetir: () => void }} props */
export function FotoTomadaFila({ foto, onRepetir }) {
  return (
    <View style={styles.fila}>
      <Image source={{ uri: foto.uri }} style={styles.mini} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Check size={14} color={colores.verde} strokeWidth={2.6} style={{ marginRight: 5 }} />
          <Texto peso="bold" tam={14} color={colores.verdeTexto}>Foto tomada</Texto>
        </View>
        <Texto tam={12} color={colores.textoSec}>{hora(foto.fecha)}, con ubicación</Texto>
      </View>
      <Pressable onPress={onRepetir} hitSlop={10} accessibilityRole="button">
        <Texto peso="bold" tam={13.5} color={colores.azulTexto}>Repetir</Texto>
      </Pressable>
    </View>
  );
}

// Foto grande con botón "Repetir foto" encima (pantallas 6 y 10).
/** @param {{ fuente: import('react-native').ImageSourcePropType, alto?: number, onRepetir?: () => void }} props */
export function FotoGrande({ fuente, alto = 190, onRepetir }) {
  return (
    <View style={[styles.grande, { height: alto }]}>
      <Image source={fuente} style={StyleSheet.absoluteFill} resizeMode="cover" />
      {onRepetir ? (
        <Pressable onPress={onRepetir} style={styles.repetir} accessibilityRole="button">
          <RotateCcw size={13} color="#fff" strokeWidth={2.4} style={{ marginRight: 6 }} />
          <Texto peso="semibold" tam={12.5} color="#fff">Repetir foto</Texto>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  vacio: {
    borderRadius: radios.tarjeta, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colores.primarioBorde,
    backgroundColor: colores.blanco, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16,
  },
  iconoVacio: { width: 40, height: 40, borderRadius: 20, backgroundColor: colores.primarioSuave, alignItems: 'center', justifyContent: 'center' },
  fila: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colores.blanco, borderRadius: radios.tarjeta,
    borderWidth: 1, borderColor: colores.borde, padding: 9, paddingRight: 16,
  },
  mini: { width: 70, height: 52, borderRadius: 8, backgroundColor: colores.gris },
  grande: { borderRadius: radios.tarjeta, overflow: 'hidden', backgroundColor: colores.gris },
  repetir: {
    position: 'absolute', left: 10, bottom: 10, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(11,18,32,0.72)', borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6,
  },
});
