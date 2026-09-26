import { StyleSheet, View } from 'react-native';
import { colores } from '../theme';
import Texto from './Texto';

// Pastilla pequeña de estado: "Próxima parada", "En ruta", "Bien", "Obligatoria"...
const TONOS = {
  azul: { fondo: colores.primarioSuave, texto: colores.azulTexto },
  azulLleno: { fondo: colores.primario, texto: colores.blanco },
  verde: { fondo: colores.verdeSuave, texto: colores.verdeTexto },
  ambar: { fondo: colores.ambarIcono, texto: colores.ambarTexto },
  rojo: { fondo: colores.rojoSuave, texto: colores.rojo },
  gris: { fondo: colores.gris, texto: colores.textoSec },
  oscuro: { fondo: colores.camaraChip, texto: colores.blanco },
};

export default function Etiqueta({ texto, tono = 'azul', icono: Icono, tam = 11, style }) {
  const t = TONOS[tono];
  return (
    <View style={[styles.base, { backgroundColor: t.fondo }, style]}>
      {Icono ? <Icono size={tam + 1} color={t.texto} strokeWidth={2.4} style={{ marginRight: 4 }} /> : null}
      <Texto peso="bold" tam={tam} color={t.texto} alto={tam + 4}>{texto}</Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
});
