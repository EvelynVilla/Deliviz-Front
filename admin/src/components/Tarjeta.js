import { StyleSheet, View } from 'react-native';
import { colores } from '../theme';
import Texto from './Texto';

// Contenedor blanco del panel, con título y algo opcional a la derecha.
export default function Tarjeta({ titulo, derecha, children, style, relleno = 20, sinRelleno }) {
  return (
    <View style={[styles.base, !sinRelleno && { padding: relleno }, style]}>
      {titulo ? (
        <View style={[styles.cabecera, sinRelleno && { paddingHorizontal: relleno, paddingTop: relleno }]}>
          <Texto peso="bold" tam={16}>{titulo}</Texto>
          {derecha}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colores.blanco, borderRadius: 16, borderWidth: 1, borderColor: colores.borde },
  cabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, minHeight: 26 },
});
