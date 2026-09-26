import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { colores, radios } from '../theme';
import Texto from './Texto';

// variante: 'primario' | 'secundario' | 'peligro' | 'enlace' | 'fantasma'
export default function Boton({ titulo, onPress, variante = 'primario', icono: Icono, deshabilitado, cargando, alto = 42, tamTexto = 14, style, accessibilityLabel }) {
  const v = VARIANTES[variante];
  const inactivo = deshabilitado || cargando;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactivo}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? titulo}
      accessibilityState={{ disabled: !!inactivo }}
      style={({ pressed, hovered }) => [
        styles.base,
        { height: alto, backgroundColor: (pressed || hovered) && v.fondoActivo ? v.fondoActivo : v.fondo, borderColor: v.borde, borderWidth: v.borde ? 1 : 0 },
        variante === 'enlace' && { paddingHorizontal: 0, height: undefined },
        inactivo && { opacity: 0.45 },
        style,
      ]}
    >
      {cargando ? <ActivityIndicator color={v.texto} /> : (
        <View style={styles.fila}>
          {Icono ? <Icono size={tamTexto + 2} color={v.texto} strokeWidth={2.2} style={titulo ? { marginRight: 8 } : null} /> : null}
          {titulo ? <Texto peso={variante === 'enlace' ? 'semibold' : 'bold'} tam={tamTexto} color={v.texto}>{titulo}</Texto> : null}
        </View>
      )}
    </Pressable>
  );
}

const VARIANTES = {
  primario: { fondo: colores.primario, fondoActivo: colores.primarioPresionado, texto: colores.blanco },
  secundario: { fondo: colores.blanco, fondoActivo: colores.fondo, texto: colores.tinta, borde: colores.borde },
  peligro: { fondo: colores.blanco, fondoActivo: colores.rojoSuave, texto: colores.rojo, borde: colores.borde },
  fantasma: { fondo: 'transparent', fondoActivo: colores.gris, texto: colores.textoSec },
  enlace: { fondo: 'transparent', texto: colores.azulTexto },
};

const styles = StyleSheet.create({
  base: { borderRadius: radios.boton, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  fila: { flexDirection: 'row', alignItems: 'center' },
});
