import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colores, espacio } from '../theme';
import Texto from './Texto';

// Encabezado de las pantallas internas: botón atrás cuadrado, título y subtítulo opcional.
/** @param {{ titulo: string, subtitulo?: string, derecha?: import('react').ReactNode, onAtras?: () => void, tamTitulo?: number }} props */
export default function Encabezado({ titulo, subtitulo, derecha, onAtras, tamTitulo = 18 }) {
  const navigation = useNavigation();
  return (
    <View style={styles.cont}>
      <BotonAtras onPress={onAtras ?? (() => navigation.goBack())} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Texto peso="bold" tam={tamTitulo}>{titulo}</Texto>
        {subtitulo ? <Texto tam={12} color={colores.textoSec} style={{ marginTop: -1 }}>{subtitulo}</Texto> : null}
      </View>
      {derecha}
    </View>
  );
}

/** @param {{ onPress: () => void }} props */
export function BotonAtras({ onPress }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityLabel="Regresar" style={({ pressed }) => [styles.atras, pressed && { backgroundColor: colores.gris }]}>
      <ChevronLeft size={20} color={colores.tinta} strokeWidth={2.4} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cont: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: espacio.pantalla, paddingTop: 6, paddingBottom: 12 },
  atras: {
    width: 38, height: 38, borderRadius: 11, backgroundColor: colores.blanco,
    borderWidth: 1, borderColor: colores.borde, alignItems: 'center', justifyContent: 'center',
  },
});
