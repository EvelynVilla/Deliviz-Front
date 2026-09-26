import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Camera, Check, TriangleAlert, X } from 'lucide-react-native';
import { fuenteFoto } from '../datos/fotos';
import { colores } from '../theme';
import { fechaCorta, hora, esHoy } from '../utils/formato';
import Firma from './Firma';
import Texto from './Texto';

const ESTADO_FISICO = { bien: 'bien', danado: 'dañado', incompleto: 'incompleto' };

// Texto de cada evento, igual que en la pantalla 18 del mockup.
export function describir(e) {
  switch (e.tipo) {
    case 'llegada_bodega':
      return { titulo: 'Llegada a bodega', detalle: `${e.datos.bodega}. Estado: ${ESTADO_FISICO[e.datos.estadoPaquete]}. Recibió ${e.repartidor}.`, punto: 'foto' };
    case 'salida_ruta':
      return { titulo: 'Salida a ruta', detalle: `${e.repartidor}. Registro automático, sin foto.`, punto: 'auto' };
    case 'transferencia':
      return { titulo: 'Transferencia de responsable', detalle: `De ${e.repartidor} a ${e.destino}. Motivo: ${e.datos.motivo.toLowerCase()}.`, punto: 'foto' };
    case 'incidente':
      return { titulo: 'Problema reportado', detalle: `${e.datos.tipo}. ${e.datos.descripcion ?? ''} Reportó ${e.repartidor}.`, punto: 'alerta' };
    case 'excepcion':
      return { titulo: 'No se pudo entregar', detalle: `${e.datos.motivo}.${e.datos.notas ? ` ${e.datos.notas}` : ''} Registró ${e.repartidor}.`, punto: 'error' };
    case 'entrega':
      return { titulo: 'Entrega', detalle: `Recibió ${e.datos.recibio}, ${e.datos.relacion}. Entregó ${e.repartidor}.`, punto: 'hecho' };
    default:
      return { titulo: e.tipo, detalle: '', punto: 'auto' };
  }
}

export default function LineaTiempo({ eventos, onFoto, direccion }) {
  const variosDias = eventos.some((e) => !esHoy(e.fecha));
  return (
    <View>
      {eventos.map((e, i) => {
        const d = describir(e);
        const ultimo = i === eventos.length - 1;
        return (
          <View key={e.id} style={styles.fila}>
            <View style={styles.columnaHora}>
              <Texto peso="bold" tam={12.5} color={colores.textoSec}>{hora(e.fecha)}</Texto>
              {variosDias ? <Texto tam={11} color={colores.textoTer}>{fechaCorta(e.fecha)}</Texto> : null}
            </View>
            <View style={styles.columnaPunto}>
              <Punto tipo={d.punto} />
              {!ultimo ? <View style={styles.linea} /> : null}
            </View>
            <View style={[styles.cuerpo, !ultimo && { paddingBottom: 22 }]}>
              <Texto peso="bold" tam={14.5}>{d.titulo}</Texto>
              <Texto tam={13} color={colores.textoSec} style={{ marginTop: 1 }}>
                {e.tipo === 'entrega' && direccion ? `${direccion}. ` : ''}{d.detalle}
              </Texto>
              {e.foto || e.tipo === 'entrega' ? (
                <View style={styles.medios}>
                  {e.foto ? (
                    <Pressable onPress={() => onFoto?.(e)} accessibilityLabel={`Ver foto de ${d.titulo}`}>
                      <Image source={fuenteFoto(e.foto)} style={styles.mini} />
                    </Pressable>
                  ) : null}
                  {e.tipo === 'entrega' ? (
                    <View style={styles.miniFirma}><Firma indice={e.datos.firma} ancho={100} alto={48} grosor={3} /></View>
                  ) : null}
                </View>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function Punto({ tipo }) {
  const base = [styles.punto];
  if (tipo === 'foto') return <View style={[base, { backgroundColor: colores.primario }]}><Camera size={14} color="#fff" strokeWidth={2.4} /></View>;
  if (tipo === 'hecho') return <View style={[base, { backgroundColor: colores.verde }]}><Check size={15} color="#fff" strokeWidth={3} /></View>;
  if (tipo === 'alerta') return <View style={[base, { backgroundColor: colores.ambar }]}><TriangleAlert size={14} color="#fff" strokeWidth={2.4} /></View>;
  if (tipo === 'error') return <View style={[base, { backgroundColor: colores.rojo }]}><X size={15} color="#fff" strokeWidth={3} /></View>;
  return <View style={base}><View style={styles.hueco} /></View>;
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row' },
  columnaHora: { width: 48, paddingTop: 6 },
  columnaPunto: { width: 32, alignItems: 'center' },
  punto: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  hueco: { width: 13, height: 13, borderRadius: 7, borderWidth: 1.8, borderColor: colores.hueco, backgroundColor: colores.blanco },
  linea: { flex: 1, width: 2, backgroundColor: colores.linea, marginVertical: 3 },
  cuerpo: { flex: 1, marginLeft: 12, paddingTop: 5 },
  medios: { flexDirection: 'row', marginTop: 10, gap: 8 },
  mini: { width: 118, height: 80, borderRadius: 10, backgroundColor: colores.gris },
  miniFirma: { width: 118, height: 80, borderRadius: 10, borderWidth: 1, borderColor: colores.borde, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.blanco },
});
