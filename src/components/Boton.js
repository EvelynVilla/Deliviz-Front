import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { colores, radios } from '../theme';
import Texto from './Texto';

// variante: 'primario' (azul lleno), 'secundario' (blanco con borde), 'peligro' (blanco con texto rojo),
// 'oscuro' (azul marino lleno), 'enlace' (solo texto azul)
/** @param {{ titulo: string, onPress?: () => void, variante?: 'primario'|'secundario'|'peligro'|'oscuro'|'enlace', icono?: import('react').ComponentType<any>, deshabilitado?: boolean, cargando?: boolean, alto?: number, tamTexto?: number, style?: import('react-native').StyleProp<import('react-native').ViewStyle> }} props */
export default function Boton({ titulo, onPress, variante = 'primario', icono: Icono, deshabilitado, cargando, alto = 50, tamTexto = 15, style }) {
  const v = VARIANTES[variante];
  const inactivo = deshabilitado || cargando;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactivo}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactivo }}
      style={({ pressed }) => [
        styles.base,
        { height: alto, backgroundColor: pressed && v.fondoPresionado ? v.fondoPresionado : v.fondo, borderColor: v.borde, borderWidth: v.borde ? 1 : 0 },
        variante === 'enlace' && styles.enlace,
        inactivo && variante !== 'enlace' && styles.inactivo,
        style,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={v.texto} />
      ) : (
        <View style={styles.fila}>
          {Icono ? <Icono size={tamTexto + 2} color={v.texto} strokeWidth={2.2} style={{ marginRight: 8 }} /> : null}
          <Texto peso={variante === 'enlace' ? 'semibold' : 'bold'} tam={tamTexto} color={v.texto}>
            {titulo}
          </Texto>
        </View>
      )}
    </Pressable>
  );
}

const VARIANTES = {
  primario: { fondo: colores.primario, fondoPresionado: colores.primarioPresionado, texto: colores.blanco },
  secundario: { fondo: colores.blanco, fondoPresionado: colores.gris, texto: colores.tinta, borde: colores.borde },
  peligro: { fondo: colores.blanco, fondoPresionado: colores.rojoSuave, texto: colores.rojo, borde: colores.borde },
  oscuro: { fondo: colores.tinta, fondoPresionado: '#1B2C52', texto: colores.blanco },
  enlace: { fondo: 'transparent', texto: colores.azulTexto },
};

const styles = StyleSheet.create({
  base: { borderRadius: radios.boton, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  fila: { flexDirection: 'row', alignItems: 'center' },
  enlace: { height: 36 },
  inactivo: { opacity: 0.45 },
});
