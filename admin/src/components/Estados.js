import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { TriangleAlert } from 'lucide-react-native';
import { colores } from '../theme';
import Boton from './Boton';
import Texto from './Texto';

export function Cargando({ alto = 240 }) {
  return <View style={[styles.centro, { height: alto }]}><ActivityIndicator color={colores.primario} /></View>;
}

export function ErrorVista({ mensaje, onReintentar }) {
  return (
    <View style={[styles.centro, { paddingVertical: 60 }]}>
      <TriangleAlert size={26} color={colores.ambar} strokeWidth={2} />
      <Texto peso="bold" tam={16} style={{ marginTop: 10 }}>{mensaje}</Texto>
      {onReintentar ? <Boton titulo="Reintentar" variante="secundario" onPress={onReintentar} style={{ marginTop: 14 }} /> : null}
    </View>
  );
}

export function Vacio({ titulo, texto, accion }) {
  return (
    <View style={[styles.centro, { paddingVertical: 48, paddingHorizontal: 24 }]}>
      <Texto peso="bold" tam={15} centro>{titulo}</Texto>
      {texto ? <Texto tam={13} color={colores.textoSec} centro style={{ marginTop: 4, maxWidth: 420 }}>{texto}</Texto> : null}
      {accion ? <View style={{ marginTop: 14 }}>{accion}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({ centro: { alignItems: 'center', justifyContent: 'center' } });
