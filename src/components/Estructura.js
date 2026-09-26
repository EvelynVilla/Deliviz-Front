import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colores, espacio } from '../theme';
import Texto from './Texto';

// Pantalla con fondo gris claro y área segura superior.
/** @param {{ children?: import('react').ReactNode, fondo?: string, style?: import('react-native').StyleProp<import('react-native').ViewStyle> }} props */
export function Pantalla({ children, fondo = colores.fondo, style }) {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[{ flex: 1, backgroundColor: fondo }, style]}>
      {children}
    </SafeAreaView>
  );
}

/** @param {{ children?: import('react').ReactNode, style?: import('react-native').StyleProp<import('react-native').ViewStyle> }} props */
export function Contenido({ children, style }) {
  return (
    <ScrollView contentContainerStyle={[styles.contenido, style]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

// Zona fija inferior para el botón principal.
/** @param {{ children?: import('react').ReactNode, style?: import('react-native').StyleProp<import('react-native').ViewStyle> }} props */
export function Pie({ children, style }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.pie, { paddingBottom: Math.max(insets.bottom, 12) + 4 }, style]}>{children}</View>;
}

// Título de sección ("Historial del paquete", "Nuevo responsable"...), con algo opcional a la derecha.
/** @param {{ children?: import('react').ReactNode, derecha?: import('react').ReactNode, style?: import('react-native').StyleProp<import('react-native').ViewStyle> }} props */
export function TituloSeccion({ children, derecha, style }) {
  return (
    <View style={[styles.titulo, style]}>
      <Texto peso="bold" tam={15.5}>{children}</Texto>
      {derecha}
    </View>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingHorizontal: espacio.pantalla, paddingBottom: 24 },
  pie: { paddingHorizontal: espacio.pantalla, paddingTop: 10, backgroundColor: colores.fondo },
  titulo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 10 },
});
