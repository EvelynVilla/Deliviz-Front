// Modelo que usan las pantallas y cómo se construye a partir de las respuestas de la API.
// Los nombres de campo son los que ya usaban las pantallas en JS de Sayuri (guia, destinatario,
// eventos, estadoFisico…), así esas pantallas siguen funcionando sin reescribirse.
import type { ImageSourcePropType } from 'react-native';
import type {
  Condicion,
  DatosDestinatario,
  EstadoPaqueteApi,
  EventoHistorial,
  Motivo,
  Origen,
  PaqueteAsignadoConDatos,
  RelacionReceptor,
  TipoEvento,
} from './api/tipos';

/** Estados de la app = estados del contrato + dos que solo existen en el teléfono. */
export type EstadoApp = EstadoPaqueteApi | 'por_recoger' | 'en_transferencia';

export type TipoEventoApp = TipoEvento | 'transferencia_enviada';

export interface EventoApp {
  id: string;
  tipo: TipoEventoApp;
  fecha: string;
  lugar?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  responsable?: string;
  foto?: ImageSourcePropType | null;
  firma?: ImageSourcePropType | null;
  /** true mientras la foto no ha llegado al contenedor "definitivo". */
  fotoPendiente?: boolean;
  /** true si el evento todavía está en la cola del teléfono. */
  enCola?: boolean;
  estadoPaquete?: Condicion | null; // condición en llegada a bodega
  problema?: string; // tipo de incidente elegido en la pantalla 10
  descripcion?: string | null;
  comentario?: string | null;
  motivo?: string | null; // motivo de transferencia (texto) o de excepción (enum)
  motivoExcepcion?: Motivo | null;
  nombreReceptor?: string | null;
  relacionReceptor?: RelacionReceptor | null;
  destino?: string;
  de?: string;
}

export interface Paquete {
  guia: string;
  id?: string;
  estado: EstadoApp;
  origen?: Origen | string | null;
  destinatario: string | null;
  telefono: string | null;
  direccion: string | null;
  colonia: string | null;
  ciudad: string | null;
  lat: number | null;
  lng: number | null;
  ventana: string | null;
  indicaciones: string | null;
  descripcion: string | null;
  peso: number | null;
  tamano?: string;
  requiere?: string;
  orden: number;
  eventos: EventoApp[];
  estadoFisico?: Condicion;
  incidente?: string;
  transferenciaA?: string;
  entregadoEn?: string;
  ultimaActividad?: string | null;
}

export const RELACIONES: { valor: RelacionReceptor; texto: string }[] = [
  { valor: 'titular', texto: 'Titular' },
  { valor: 'familiar', texto: 'Familiar' },
  { valor: 'vecino', texto: 'Vecino' },
  { valor: 'recepcion', texto: 'Recepción del edificio' },
  { valor: 'otro', texto: 'Otro' },
];

export const MOTIVOS_EXCEPCION: Record<Motivo, string> = {
  nadie_recibio: 'Nadie recibió',
  direccion_incorrecta: 'Dirección incorrecta',
  rechazado: 'Rechazó el paquete',
  otro: 'Otro motivo',
};

export const textoRelacion = (r?: RelacionReceptor | null) => RELACIONES.find((x) => x.valor === r)?.texto ?? '';

/** Dirección en una línea, sin comas sobrantes cuando faltan datos. */
export const direccionCompleta = (p: Pick<Paquete, 'direccion' | 'colonia' | 'ciudad'>, conCiudad = false) =>
  [p.direccion, p.colonia, conCiudad ? p.ciudad : null].filter(Boolean).join(', ');

export const nombreDestinatario = (p: Pick<Paquete, 'destinatario'>) => p.destinatario ?? 'Destinatario sin registrar';

export function paqueteVacio(guia: string, estado: EstadoApp = 'en_bodega'): Paquete {
  return {
    guia,
    estado,
    destinatario: null,
    telefono: null,
    direccion: null,
    colonia: null,
    ciudad: null,
    lat: null,
    lng: null,
    ventana: null,
    indicaciones: null,
    descripcion: null,
    peso: null,
    orden: Date.now(),
    eventos: [],
  };
}

/** Copia al paquete los datos del destinatario que vengan en la respuesta (si vienen). */
export function aplicarDatos(p: Paquete, d: DatosDestinatario): Paquete {
  return {
    ...p,
    destinatario: d.destinatario ?? p.destinatario,
    telefono: d.telefono ?? p.telefono,
    direccion: d.direccion ?? p.direccion,
    colonia: d.colonia ?? p.colonia,
    ciudad: d.ciudad ?? p.ciudad,
    lat: d.latitud ?? p.lat,
    lng: d.longitud ?? p.lng,
    ventana: d.ventana ?? p.ventana,
    indicaciones: d.indicaciones ?? p.indicaciones,
    descripcion: d.descripcion ?? p.descripcion,
    peso: d.peso ?? p.peso,
  };
}

/** GET /repartidor/paquetes → Paquete. Conserva lo que el teléfono ya sabía (eventos, orden). */
export function paqueteDesdeAsignado(dto: PaqueteAsignadoConDatos, previo?: Paquete): Paquete {
  const base = previo ?? paqueteVacio(dto.numeroGuia, 'en_ruta');
  return aplicarDatos(
    {
      ...base,
      id: dto.id,
      estado: dto.estado,
      origen: dto.origen ?? base.origen,
      requiere: 'Foto y firma',
      ultimaActividad: dto.ultimaActividad,
    },
    dto,
  );
}

/** Evento del historial de la API → EventoApp para la línea de tiempo. */
export function eventoDesdeHistorial(e: EventoHistorial, local?: EventoApp): EventoApp {
  const foto = e.fotos.find((f) => f.tipo === 'paquete');
  const firma = e.fotos.find((f) => f.tipo === 'firma');
  const fuente = (url: string | null | undefined, respaldo?: ImageSourcePropType | null) => (url ? { uri: url } : respaldo ?? null);
  return {
    ...local,
    id: e.id,
    tipo: e.tipo,
    fecha: e.fechaCaptura,
    latitud: e.latitud,
    longitud: e.longitud,
    lugar: local?.lugar ?? (e.latitud != null && e.longitud != null ? `${e.latitud.toFixed(4)}, ${e.longitud.toFixed(4)}` : null),
    estadoPaquete: e.condicion,
    comentario: e.comentario,
    descripcion: local?.descripcion ?? e.comentario,
    motivoExcepcion: e.motivo,
    nombreReceptor: e.nombreReceptor,
    relacionReceptor: e.relacionReceptor,
    // Si la foto sigue "pendiente" en el servidor pero el teléfono la tiene, se muestra la local.
    foto: fuente(foto?.url, local?.foto),
    firma: fuente(firma?.url, local?.firma),
    fotoPendiente: e.fotos.some((f) => f.estado === 'pendiente'),
    enCola: false,
  };
}
