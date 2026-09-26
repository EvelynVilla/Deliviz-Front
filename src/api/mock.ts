// API simulada con las MISMAS formas y reglas del contrato, para probar la app sin backend.
// Se activa con EXPO_PUBLIC_USAR_MOCK=true (o sin EXPO_PUBLIC_API_URL).
// Aplica la tabla "Qué exige cada evento" y responde 400/404/409 igual que la API real,
// así los errores de negocio se pueden probar desde el teléfono.

import { paquetesDemo, transferenciasDemo, usuarioDemo } from '../data/mock';
import { ErrorApi } from './http';
import type {
  ClienteApi,
  DatosDestinatario,
  EstadoPaqueteApi,
  EventoEntrada,
  EventoHistorial,
  EventoSalida,
  FotoHistorial,
  Origen,
  PaqueteAsignadoConDatos,
  TipoEvento,
  TipoFoto,
} from './tipos';

const esperar = (ms = 350) => new Promise<void>((r) => setTimeout(r, ms));

// ---- Interruptor "sin señal" (Perfil > Simular sin señal) para probar la pantalla 17 ----
let sinSenal = false;
const oyentes = new Set<(v: boolean) => void>();
export function simularSinSenal(valor: boolean) {
  sinSenal = valor;
  oyentes.forEach((fn) => fn(valor));
}
export function suscribirSinSenalSimulada(fn: (v: boolean) => void) {
  oyentes.add(fn);
  return () => {
    oyentes.delete(fn);
  };
}
export const estaSimulandoSinSenal = () => sinSenal;

async function red(ms?: number) {
  await esperar(ms);
  if (sinSenal) throw new ErrorApi('No hay conexión con el servidor.', 0, 'red');
}

const error = (status: number, detalle: string) =>
  new ErrorApi(detalle, status, status === 404 ? 'no_encontrado' : status === 409 ? 'conflicto' : status === 403 ? 'prohibido' : 'datos');

// ---- "Base de datos" en memoria ----
interface PaqueteServidor {
  id: string;
  estado: EstadoPaqueteApi;
  origen: Origen | null;
  asignadoA: string | null;
  eventos: EventoHistorial[];
  datos: DatosDestinatario;
}

const YO = '__usuario_actual__';
let usuarioActual = YO;
const paquetes = new Map<string, PaqueteServidor>();
const eventos = new Map<string, { guia: string; salida: EventoSalida }>();
const fotos = new Map<string, { eventoId: string; foto: FotoHistorial }>();

type Demo = {
  guia: string;
  estado: string;
  destinatario?: string;
  telefono?: string;
  direccion?: string;
  colonia?: string;
  ciudad?: string;
  lat?: number;
  lng?: number;
  ventana?: string;
  indicaciones?: string;
  tamano?: string;
  peso?: number;
  origen?: string;
};

const datosDe = (p: Demo): DatosDestinatario => ({
  destinatario: p.destinatario,
  telefono: p.telefono,
  direccion: p.direccion,
  colonia: p.colonia,
  ciudad: p.ciudad,
  latitud: p.lat,
  longitud: p.lng,
  ventana: p.ventana,
  indicaciones: p.indicaciones,
  descripcion: p.tamano ? `1 paquete, ${p.tamano.toLowerCase()}` : undefined,
  peso: p.peso,
});

const uuid = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

function sembrar() {
  paquetes.clear();
  for (const p of paquetesDemo as Demo[]) {
    // Los "por recoger" no existen todavía en el servidor: se crean con su llegada a bodega.
    if (p.estado === 'por_recoger') continue;
    paquetes.set(p.guia, {
      id: uuid(),
      estado: p.estado === 'entregado' ? 'entregado' : 'en_ruta',
      origen: 'nacional',
      asignadoA: YO,
      eventos: [],
      datos: datosDe(p),
    });
  }
  // Paquete que trae Ana Torres (R-0161) y que se puede recibir por transferencia.
  for (const t of transferenciasDemo as { paquete: Demo; de: { numero: string } }[]) {
    paquetes.set(t.paquete.guia, { id: uuid(), estado: 'en_ruta', origen: 'nacional', asignadoA: t.de.numero, eventos: [], datos: datosDe(t.paquete) });
  }
}
sembrar();

/** Datos de prueba del destinatario para una guía (lo usa el AppContext en modo simulado). */
export function datosDemoDe(guia: string): DatosDestinatario | null {
  const p = (paquetesDemo as Demo[]).find((x) => x.guia === guia);
  return p ? datosDe(p) : null;
}

// ---- Reglas del contrato ("Qué exige cada evento") ----
function validar(e: EventoEntrada, p: PaqueteServidor | undefined) {
  const requerido = (campo: keyof EventoEntrada) => {
    const v = e[campo];
    if (v === undefined || v === null || (typeof v === 'string' && !v.trim())) throw error(400, `El campo ${campo} es obligatorio para ${e.tipo}.`);
  };
  if (e.tipo !== 'llegada_bodega' && !p) throw error(404, `No existe el paquete ${e.numeroGuia}.`);
  const mio = p?.asignadoA === usuarioActual;

  const reglas: Record<TipoEvento, () => EstadoPaqueteApi> = {
    llegada_bodega: () => {
      requerido('condicion');
      if (p && !['en_ruta', 'no_entregado'].includes(p.estado)) throw error(409, 'El paquete ya está en bodega o ya fue entregado.');
      return 'en_bodega';
    },
    salida_ruta: () => {
      if (!['en_bodega', 'no_entregado'].includes(p!.estado)) throw error(409, 'El paquete debe estar en bodega.');
      return 'en_ruta';
    },
    transferencia: () => {
      if (p!.estado !== 'en_ruta') throw error(409, 'El paquete debe estar en ruta.');
      if (mio) throw error(409, 'El paquete ya está a tu nombre.');
      return 'en_ruta';
    },
    incidente: () => {
      requerido('comentario');
      if (p!.estado === 'entregado') throw error(409, 'El paquete ya fue entregado.');
      return p!.estado;
    },
    entrega: () => {
      requerido('nombreReceptor');
      requerido('relacionReceptor');
      if (p!.estado !== 'en_ruta') throw error(409, 'El paquete debe estar en ruta.');
      if (!mio) throw error(403, 'El paquete pertenece a otro repartidor.');
      return 'entregado';
    },
    excepcion: () => {
      requerido('motivo');
      if (e.motivo === 'otro') requerido('comentario');
      if (p!.estado !== 'en_ruta') throw error(409, 'El paquete debe estar en ruta.');
      if (!mio) throw error(403, 'El paquete pertenece a otro repartidor.');
      return 'no_entregado';
    },
  };
  return reglas[e.tipo]();
}

const FOTOS_REQUERIDAS: Record<TipoEvento, TipoFoto[]> = {
  llegada_bodega: ['paquete'],
  salida_ruta: [],
  transferencia: ['paquete'],
  incidente: ['paquete'],
  entrega: ['paquete', 'firma'],
  excepcion: ['paquete'],
};

export const apiMock: ClienteApi = {
  async login({ email, password }) {
    await esperar(600);
    const correo = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(correo) || password.length < 6) throw new ErrorApi('Correo o contraseña incorrectos.', 401, 'sesion');
    usuarioActual = usuarioDemo.numero;
    // Reasigna al usuario que entra los paquetes sembrados "para mí".
    paquetes.forEach((p) => {
      if (p.asignadoA === YO) p.asignadoA = usuarioActual;
    });
    return {
      token: 'jwt-simulado',
      expiraEn: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
      usuario: {
        id: usuarioActual,
        nombre: correo.startsWith('admin') ? 'Vane' : usuarioDemo.nombre,
        email: correo,
        rol: correo.startsWith('admin') ? 'administrador' : 'repartidor',
      },
    };
  },

  async registrarEvento(e) {
    await red(450);
    const previo = eventos.get(e.id);
    if (previo) return { ...previo.salida, yaExistia: true };

    let p = paquetes.get(e.numeroGuia);
    const estadoNuevo = validar(e, p);
    if (!p) {
      p = { id: uuid(), estado: 'en_bodega', origen: e.origen ?? null, asignadoA: usuarioActual, eventos: [], datos: datosDemoDe(e.numeroGuia) ?? {} };
      paquetes.set(e.numeroGuia, p);
    }
    p.estado = estadoNuevo;
    if (['salida_ruta', 'transferencia', 'llegada_bodega'].includes(e.tipo)) p.asignadoA = usuarioActual;
    if (e.origen) p.origen = e.origen;

    const ahora = new Date().toISOString();
    p.eventos.push({
      id: e.id,
      tipo: e.tipo,
      latitud: e.latitud ?? null,
      longitud: e.longitud ?? null,
      fechaCaptura: new Date(e.fechaCaptura).toISOString(),
      fechaRecepcion: ahora,
      condicion: e.condicion ?? null,
      motivo: e.motivo ?? null,
      comentario: e.comentario ?? null,
      nombreReceptor: e.nombreReceptor ?? null,
      relacionReceptor: e.relacionReceptor ?? null,
      fotos: [],
    });

    const requeridas = FOTOS_REQUERIDAS[e.tipo];
    const salida: EventoSalida = {
      id: e.id,
      numeroGuia: e.numeroGuia,
      tipo: e.tipo,
      estadoPaquete: estadoNuevo,
      requiereFotoPaquete: requeridas.includes('paquete'),
      requiereFirma: requeridas.includes('firma'),
      fechaCaptura: new Date(e.fechaCaptura).toISOString(),
      fechaRecepcion: ahora,
      yaExistia: false,
    };
    eventos.set(e.id, { guia: e.numeroGuia, salida });
    return salida;
  },

  async obtenerEvento(id) {
    await red();
    const ev = eventos.get(id);
    if (!ev) throw error(404, 'No existe el evento.');
    const lista = [...fotos.values()].filter((f) => f.eventoId === id).map((f) => f.foto);
    const requeridas = FOTOS_REQUERIDAS[ev.salida.tipo];
    const completa = requeridas.every((t) => lista.some((f) => f.tipo === t && f.estado === 'procesada'));
    return { ...ev.salida, evidenciaCompleta: completa, fotos: lista.map(({ id: fid, tipo, estado }) => ({ id: fid, tipo, estado })) };
  },

  async pedirSas({ eventoId, tipo }) {
    await red(250);
    const ev = eventos.get(eventoId);
    if (!ev) throw error(404, 'No existe el evento.');
    // Si ya había una foto de este tipo para el evento, se reemplaza (reintento).
    for (const [k, f] of fotos) if (f.eventoId === eventoId && f.foto.tipo === tipo) fotos.delete(k);
    const fotoId = uuid();
    const foto: FotoHistorial = { id: fotoId, tipo, estado: 'pendiente', url: null };
    fotos.set(fotoId, { eventoId, foto });
    const p = paquetes.get(ev.guia);
    p?.eventos.find((x) => x.id === eventoId)?.fotos.push(foto);
    const ext = tipo === 'firma' ? 'png' : 'jpg';
    return {
      fotoId,
      blobName: `${eventoId}/${tipo}-${fotoId}.${ext}`,
      uploadUrl: `mock://entrante/${fotoId}`,
      expiraEn: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  },

  async subirArchivo(uploadUrl, archivoUri, _mime, onProgreso) {
    const fotoId = uploadUrl.split('/').pop() ?? '';
    for (let i = 1; i <= 5; i++) {
      await red(220);
      onProgreso?.(i / 5);
    }
    const f = fotos.get(fotoId);
    if (!f) throw error(404, 'No existe la foto.');
    // En la API real la Azure Function de Carlos la pasa a "definitivo"; aquí es inmediato
    // y la URL de lectura es el propio archivo local.
    f.foto.estado = 'procesada';
    f.foto.url = archivoUri;
  },

  async paquetesAsignados() {
    await red(500);
    const lista: PaqueteAsignadoConDatos[] = [];
    paquetes.forEach((p, guia) => {
      if (p.estado !== 'en_ruta' || p.asignadoA !== usuarioActual) return;
      const ultimo = p.eventos[p.eventos.length - 1];
      lista.push({
        id: p.id,
        numeroGuia: guia,
        estado: p.estado,
        origen: p.origen,
        ultimoEvento: ultimo?.tipo ?? 'salida_ruta',
        ultimaActividad: ultimo?.fechaRecepcion ?? new Date().toISOString(),
        ...p.datos,
      });
    });
    return lista;
  },

  async historial(guia) {
    await red(400);
    const p = paquetes.get(guia.toUpperCase());
    if (!p) throw error(404, `No existe la guía ${guia}.`);
    return { id: p.id, numeroGuia: guia.toUpperCase(), estado: p.estado, origen: p.origen, urlsDisponibles: true, eventos: p.eventos, ...p.datos };
  },
};
