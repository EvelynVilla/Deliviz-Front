import { Pressable, StyleSheet, View } from 'react-native';
import { TriangleAlert } from 'lucide-react-native';
import { colores } from '../theme';
import { cuando, duracion } from '../utils/formato';
import Texto from './Texto';

export function textoAlerta(a) {
  if (a.tipo === 'sin_eventos') return { titulo: `${a.guia} sin eventos`, detalle: `Lleva ${duracion(a.minutos)} sin un registro nuevo.`, tono: 'ambar' };
  if (a.tipo === 'excepcion') return { titulo: `${a.guia} excepción`, detalle: `${a.motivo}. Foto y motivo registrados.`, tono: 'rojo' };
  return { titulo: `${a.guia} ${a.problema === 'Paquete dañado' ? 'dañado en ruta' : a.problema.toLowerCase()}`, detalle: `Reporte con foto de ${a.repartidor}.`, tono: 'ambar' };
}

export function IconoAlerta({ tono, tam = 34 }) {
  const rojo = tono === 'rojo';
  return (
    <View style={{ width: tam, height: tam, borderRadius: 9, backgroundColor: rojo ? colores.rojoSuave : colores.ambarIcono, alignItems: 'center', justifyContent: 'center' }}>
      <TriangleAlert size={tam * 0.47} color={rojo ? colores.rojo : colores.ambar} strokeWidth={2.2} />
    </View>
  );
}

// Filas compactas (tarjeta "Alertas activas" de P3)
export default function ListaAlertas({ alertas, onAbrir, conFecha }) {
  return (
    <View>
      {alertas.map((a, i) => {
        const t = textoAlerta(a);
        return (
          <Pressable key={a.id} onPress={() => onAbrir(a)} style={({ hovered }) => [styles.fila, i > 0 && styles.sep, hovered && { backgroundColor: '#FAFBFD' }]} accessibilityRole="link">
            <IconoAlerta tono={t.tono} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Texto peso="bold" tam={14}>{t.titulo}</Texto>
              <Texto tam={12.5} color={colores.textoSec}>{t.detalle}{conFecha ? ` ${cuando(a.fecha)}.` : ''}</Texto>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  sep: { borderTopWidth: 1, borderTopColor: colores.gris },
});
