import { Image, StyleSheet, View } from 'react-native';
import { Camera, Check } from 'lucide-react-native';
import { colores } from '../theme';
import { hora } from '../utils/formato';
import Etiqueta from './Etiqueta';
import Texto from './Texto';

// Historial del paquete (pantalla 3). Puntos azules con cámara = evento con foto obligatoria.
// Puntos huecos = registro automático. Punto punteado = siguiente paso pendiente.

const ESTADO_FISICO = {
  bien: { texto: 'Bien', tono: 'verde' },
  danado: { texto: 'Dañado', tono: 'ambar' },
  incompleto: { texto: 'Incompleto', tono: 'ambar' },
};

const MOTIVOS_EXCEPCION = {
  nadie_recibio: 'Nadie recibió',
  direccion_incorrecta: 'Dirección incorrecta',
  rechazado: 'Rechazó el paquete',
  otro: 'Otro motivo',
};
const RELACIONES = { titular: 'titular', familiar: 'familiar', vecino: 'vecino', recepcion: 'recepción del edificio', otro: 'otro' };

const lugarDe = (e) => e.lugar ?? 'ubicación registrada';
const minus = (t) => (t ? String(t).toLowerCase() : '');

// Convierte un evento (local o del historial de la API) en título, detalle y tipo de punto.
export function describirEvento(e) {
  switch (e.tipo) {
    case 'llegada_bodega':
      return { titulo: 'Llegada a bodega', detalle: `${hora(e.fecha)}, ${lugarDe(e)}`, tipo: 'foto', etiqueta: ESTADO_FISICO[e.estadoPaquete] };
    case 'salida_ruta':
      return { titulo: 'Salida a ruta', detalle: `${hora(e.fecha)}, registro automático sin foto`, tipo: 'auto' };
    case 'transferencia_enviada':
      return { titulo: 'Transferencia enviada', detalle: `${hora(e.fecha)}, a ${e.destino}. Motivo: ${minus(e.motivo)}`, tipo: 'foto', etiqueta: { texto: 'Por aceptar', tono: 'ambar' } };
    case 'transferencia':
    case 'transferencia_recibida':
      return { titulo: 'Transferencia recibida', detalle: `${hora(e.fecha)}${e.de ? `, de ${e.de}` : ''}${e.motivo ? `. Motivo: ${minus(e.motivo)}` : ''}`, tipo: 'foto' };
    case 'incidente': {
      const texto = e.problema ?? 'Problema';
      const detalle = e.descripcion || e.comentario;
      return { titulo: 'Problema reportado', detalle: `${hora(e.fecha)}${detalle ? `, ${detalle}` : ''}`, tipo: 'foto', etiqueta: { texto, tono: 'ambar' } };
    }
    case 'entrega':
      return {
        titulo: 'Entrega',
        detalle: `${hora(e.fecha)}, ${lugarDe(e)}${e.nombreReceptor ? `. Recibió ${e.nombreReceptor}${e.relacionReceptor ? `, ${RELACIONES[e.relacionReceptor] ?? e.relacionReceptor}` : ''}` : ''}`,
        tipo: 'hecho',
      };
    case 'excepcion':
      return {
        titulo: 'No se pudo entregar',
        detalle: `${hora(e.fecha)}, ${MOTIVOS_EXCEPCION[e.motivoExcepcion] ?? 'motivo registrado'}${e.comentario ? `. ${e.comentario}` : ''}`,
        tipo: 'foto',
        etiqueta: { texto: 'Excepción', tono: 'rojo' },
      };
    default:
      return { titulo: e.tipo, detalle: hora(e.fecha), tipo: 'auto' };
  }
}

/** @param {{ items: any[] }} props */
export default function LineaTiempo({ items }) {
  return (
    <View>
      {items.map((it, i) => (
        <View key={it.id ?? i} style={styles.fila}>
          <View style={styles.columnaPunto}>
            <Punto tipo={it.tipo} />
            {i < items.length - 1 ? <View style={styles.linea} /> : null}
          </View>
          <View style={[styles.cuerpo, i < items.length - 1 && { paddingBottom: 18 }]}>
            <View style={styles.filaTitulo}>
              <Texto peso={it.tipo === 'pendiente' ? 'bold' : 'semibold'} tam={14.5} color={it.tipo === 'pendiente' ? colores.azulTexto : colores.tinta}>{it.titulo}</Texto>
              {it.etiqueta ? <Etiqueta texto={it.etiqueta.texto} tono={it.etiqueta.tono} style={{ marginLeft: 8 }} /> : null}
            </View>
            <Texto tam={12.5} color={colores.textoSec}>{it.detalle}</Texto>
            {it.foto || it.firma ? (
              <View style={styles.fotos}>
                {it.foto ? <Image source={it.foto} style={styles.foto} /> : null}
                {it.firma ? <Image source={it.firma} style={[styles.foto, styles.firma]} resizeMode="contain" /> : null}
              </View>
            ) : null}
            {it.enCola ? <Texto tam={11.5} color={colores.ambarTexto} style={{ marginTop: 4 }}>Guardado en el teléfono, pendiente de subir</Texto> : null}
            {!it.enCola && it.fotoPendiente ? <Texto tam={11.5} color={colores.textoSec} style={{ marginTop: 4 }}>Foto en procesamiento</Texto> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

function Punto({ tipo }) {
  if (tipo === 'foto') {
    return <View style={[styles.punto, styles.puntoFoto]}><Camera size={13} color="#fff" strokeWidth={2.4} /></View>;
  }
  if (tipo === 'hecho') {
    return <View style={[styles.punto, { backgroundColor: colores.verde }]}><Check size={14} color="#fff" strokeWidth={3} /></View>;
  }
  if (tipo === 'pendiente') {
    return <View style={[styles.punto, styles.puntoPendiente]}><Camera size={13} color={colores.primario} strokeWidth={2.2} /></View>;
  }
  return <View style={styles.punto}><View style={styles.hueco} /></View>;
}

export function Leyenda() {
  return (
    <View style={styles.leyenda}>
      <View style={[styles.mini, { backgroundColor: colores.primario }]}><Camera size={9} color="#fff" strokeWidth={2.6} /></View>
      <Texto tam={11.5} color={colores.textoSec} style={{ marginRight: 16 }}>Foto obligatoria</Texto>
      <View style={[styles.mini, { borderWidth: 1.5, borderColor: colores.hueco, width: 11, height: 11 }]} />
      <Texto tam={11.5} color={colores.textoSec}>Registro automático</Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row' },
  columnaPunto: { width: 30, alignItems: 'center' },
  punto: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  puntoFoto: { backgroundColor: colores.primario },
  puntoPendiente: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colores.primario, backgroundColor: colores.blanco },
  hueco: { width: 13, height: 13, borderRadius: 7, borderWidth: 1.8, borderColor: colores.hueco, backgroundColor: colores.fondo },
  linea: { flex: 1, width: 2, backgroundColor: colores.linea, marginVertical: 2 },
  cuerpo: { flex: 1, marginLeft: 12, paddingTop: 3 },
  filaTitulo: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  fotos: { flexDirection: 'row', marginTop: 8 },
  foto: { width: 132, height: 92, borderRadius: 10, marginRight: 8, backgroundColor: colores.gris },
  firma: { backgroundColor: colores.blanco, borderWidth: 1, borderColor: colores.borde },
  leyenda: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  mini: { width: 15, height: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
});
