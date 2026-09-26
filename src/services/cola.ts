// Cola de subida (pantalla 17: "Sin señal no se pierde nada").
//
// Cada acción del repartidor se guarda PRIMERO en el teléfono y después se envía, siguiendo
// el orden que pide el contrato para cada evento:
//   1. POST /api/eventos           (el id lo genera la app; reenviarlo no duplica)
//   2. POST /api/fotos/sas         (una vez por foto que exige el evento: paquete y/o firma)
//   3. PUT <uploadUrl> a Azure     (x-ms-blob-type: BlockBlob; si falla, se pide otro SAS)
//
// Si no hay señal, el elemento queda "en espera" y se reintenta solo: al volver la red,
// al regresar la app a primer plano y cada 30 s. Los errores de negocio (400/403/409) no se
// arreglan reintentando: el elemento queda "rechazado" con el mensaje de la API.
import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import * as Network from 'expo-network';
import { api } from '../api';
import { ErrorApi } from '../api/http';
import type { EstadoPaqueteApi, EventoEntrada, TipoEvento, TipoFoto } from '../api/tipos';
import { leerJson, escribirJson } from './almacen';
import { borrarArchivos } from './evidencia';

export interface FotoCola {
  tipo: TipoFoto;
  uri: string;
  bytes: number;
  mime: 'image/jpeg' | 'image/png';
  subida: boolean;
}

export type EstadoItem = 'en_espera' | 'subiendo' | 'subida' | 'rechazado';

export interface ItemCola {
  id: string; // = id del evento
  usuarioId: string;
  guia: string;
  tipo: TipoEvento;
  evento: EventoEntrada;
  fotos: FotoCola[];
  estado: EstadoItem;
  eventoRegistrado: boolean;
  /** 0 a 1: evento registrado + fotos subidas. */
  progreso: number;
  intentos: number;
  error?: string;
  creado: string;
  subidoEn?: string;
  estadoServidor?: EstadoPaqueteApi;
}

export type NuevoItem = Pick<ItemCola, 'usuarioId' | 'evento' | 'fotos'>;

interface EstadoCola {
  items: ItemCola[];
  sincronizando: boolean;
  sinSenal: boolean;
}

type Aviso = { tipo: 'subida' | 'rechazado'; item: ItemCola };

const ARCHIVO = 'cola.json';
const HORAS_HISTORIAL = 24;

let estado: EstadoCola = { items: [], sincronizando: false, sinSenal: false };
let cargada = false;
let usuarioActivo: string | null = null;
let corriendo: Promise<void> | null = null;
const oyentes = new Set<() => void>();
const oyentesAvisos = new Set<(a: Aviso) => void>();

function publicar(parcial: Partial<EstadoCola>, persistir = true) {
  estado = { ...estado, ...parcial };
  if (persistir) escribirJson(ARCHIVO, estado.items);
  oyentes.forEach((fn) => fn());
}

function actualizarItem(id: string, cambio: Partial<ItemCola>) {
  publicar({ items: estado.items.map((i) => (i.id === id ? { ...i, ...cambio } : i)) });
}

const progresoDe = (i: Pick<ItemCola, 'eventoRegistrado' | 'fotos'>, parcialFoto = 0) =>
  ((i.eventoRegistrado ? 1 : 0) + i.fotos.filter((f) => f.subida).length + parcialFoto) / (1 + i.fotos.length);

// ---------------------------------------------------------------- carga / limpieza
export function cargarCola() {
  if (cargada) return;
  cargada = true;
  const guardados = leerJson<ItemCola[]>(ARCHIVO, []);
  const limite = Date.now() - HORAS_HISTORIAL * 3600 * 1000;
  const vigentes: ItemCola[] = [];
  const archivosViejos: string[] = [];
  for (const i of guardados) {
    // Lo ya subido se muestra un día en la pantalla 17 y luego se borra (con sus archivos).
    if (i.estado === 'subida' && new Date(i.subidoEn ?? i.creado).getTime() < limite) {
      archivosViejos.push(...i.fotos.map((f) => f.uri));
      continue;
    }
    // Si la app se cerró a media subida, se retoma desde donde iba.
    vigentes.push(i.estado === 'subiendo' ? { ...i, estado: 'en_espera' } : i);
  }
  borrarArchivos(archivosViejos);
  publicar({ items: vigentes });
}

// ---------------------------------------------------------------- API pública
export function encolar(nuevo: NuevoItem): ItemCola {
  const item: ItemCola = {
    ...nuevo,
    id: nuevo.evento.id,
    guia: nuevo.evento.numeroGuia,
    tipo: nuevo.evento.tipo,
    estado: 'en_espera',
    eventoRegistrado: false,
    progreso: 0,
    intentos: 0,
    creado: new Date().toISOString(),
  };
  publicar({ items: [...estado.items, item] });
  void sincronizar();
  return item;
}

/** Fija el usuario cuya cola se envía (null al cerrar sesión: la cola se conserva). */
export function activarUsuario(usuarioId: string | null) {
  usuarioActivo = usuarioId;
  if (usuarioId) void sincronizar();
}

export function descartar(id: string) {
  const item = estado.items.find((i) => i.id === id);
  if (!item || item.estado === 'subiendo') return;
  borrarArchivos(item.fotos.map((f) => f.uri));
  publicar({ items: estado.items.filter((i) => i.id !== id) });
}

export function reintentarAhora() {
  return sincronizar(true);
}

export function suscribirAvisos(fn: (a: Aviso) => void) {
  oyentesAvisos.add(fn);
  return () => {
    oyentesAvisos.delete(fn);
  };
}

export const hayPendientes = (guia?: string) =>
  estado.items.some((i) => (i.estado === 'en_espera' || i.estado === 'subiendo') && (!guia || i.guia === guia));

export const itemsPendientes = () => estado.items.filter((i) => i.estado === 'en_espera' || i.estado === 'subiendo');

// ---------------------------------------------------------------- sincronización
export function sincronizar(forzar = false): Promise<void> {
  if (corriendo) return corriendo;
  if (!usuarioActivo) return Promise.resolve();
  corriendo = (async () => {
    publicar({ sincronizando: true, ...(forzar ? { sinSenal: false } : {}) }, false);
    try {
      // En orden de creación: una salida a ruta no puede llegar antes que su llegada a bodega.
      // Cada item se intenta una vez por pasada; lo que se encole mientras tanto entra en la misma.
      const intentados = new Set<string>();
      const guiasDetenidas = new Set<string>(); // si un evento falla, los siguientes de esa guía esperan
      for (;;) {
        const siguiente = estado.items.find(
          (i) => i.usuarioId === usuarioActivo && i.estado === 'en_espera' && !intentados.has(i.id) && !guiasDetenidas.has(i.guia),
        );
        if (!siguiente) break;
        intentados.add(siguiente.id);
        const resultado = await enviarItem(siguiente.id);
        if (resultado === 'sin_red' || resultado === 'sesion') break;
        if (resultado === 'reintentar') guiasDetenidas.add(siguiente.guia);
      }
    } finally {
      corriendo = null;
      publicar({ sincronizando: false }, false);
    }
  })();
  return corriendo;
}

type Resultado = 'ok' | 'rechazado' | 'sin_red' | 'sesion' | 'reintentar';

async function enviarItem(id: string): Promise<Resultado> {
  const actual = () => estado.items.find((i) => i.id === id)!;
  actualizarItem(id, { estado: 'subiendo', intentos: actual().intentos + 1, error: undefined });

  try {
    // 1. Registrar el evento (idempotente por id).
    if (!actual().eventoRegistrado) {
      const salida = await api.registrarEvento(actual().evento);
      const cambio = { eventoRegistrado: true, estadoServidor: salida.estadoPaquete };
      actualizarItem(id, { ...cambio, progreso: progresoDe({ ...actual(), ...cambio }) });
    }

    // 2 y 3. Un SAS por foto y PUT del archivo a Azure Blob.
    for (const foto of actual().fotos) {
      if (foto.subida) continue;
      const sas = await api.pedirSas({ eventoId: id, tipo: foto.tipo });
      await api.subirArchivo(sas.uploadUrl, foto.uri, foto.mime, (f) =>
        actualizarItem(id, { progreso: progresoDe(actual(), f) }),
      );
      const fotos = actual().fotos.map((x) => (x.tipo === foto.tipo ? { ...x, subida: true } : x));
      actualizarItem(id, { fotos, progreso: progresoDe({ ...actual(), fotos }) });
    }

    actualizarItem(id, { estado: 'subida', progreso: 1, subidoEn: new Date().toISOString() });
    if (estado.sinSenal) publicar({ sinSenal: false }, false);
    oyentesAvisos.forEach((fn) => fn({ tipo: 'subida', item: actual() }));
    return 'ok';
  } catch (e) {
    const err = e instanceof ErrorApi ? e : new ErrorApi(String(e), 0, 'servidor');
    if (err.tipo === 'red') {
      actualizarItem(id, { estado: 'en_espera', error: undefined });
      publicar({ sinSenal: true }, false);
      return 'sin_red';
    }
    if (err.tipo === 'sesion') {
      actualizarItem(id, { estado: 'en_espera', error: 'Entra de nuevo para terminar de subir.' });
      return 'sesion';
    }
    // 404 al pedir SAS = el servidor no tiene el evento: se vuelve a registrar en el siguiente intento.
    if (err.tipo === 'no_encontrado' && actual().eventoRegistrado) {
      actualizarItem(id, { estado: 'en_espera', eventoRegistrado: false, error: err.message });
      return 'reintentar';
    }
    if (err.esDefinitivo || err.tipo === 'no_encontrado') {
      actualizarItem(id, { estado: 'rechazado', error: err.message });
      oyentesAvisos.forEach((fn) => fn({ tipo: 'rechazado', item: actual() }));
      return 'rechazado';
    }
    // 5xx o SAS vencido: se reintenta más tarde con un SAS nuevo y el mismo archivo.
    actualizarItem(id, { estado: 'en_espera', error: err.message });
    return 'reintentar';
  }
}

// ---------------------------------------------------------------- disparadores automáticos
/** Reintenta al volver la red, al volver la app a primer plano y cada 30 s si hay pendientes. */
export function iniciarSincronizacionAutomatica(): () => void {
  const limpiezas: (() => void)[] = [];

  try {
    const sub = Network.addNetworkStateListener((s) => {
      if (s.isConnected === false || s.isInternetReachable === false) {
        publicar({ sinSenal: true }, false);
      } else if (s.isConnected) {
        void sincronizar(true);
      }
    });
    limpiezas.push(() => sub.remove());
  } catch (e) {
    console.warn('[cola] Sin detector de red; se reintentará por tiempo', e);
  }

  const app = AppState.addEventListener('change', (s) => {
    if (s === 'active') void sincronizar();
  });
  limpiezas.push(() => app.remove());

  const intervalo = setInterval(() => {
    if (hayPendientes()) void sincronizar();
  }, 30_000);
  limpiezas.push(() => clearInterval(intervalo));

  return () => limpiezas.forEach((fn) => fn());
}

// ---------------------------------------------------------------- hook
const suscribir = (fn: () => void) => {
  oyentes.add(fn);
  return () => {
    oyentes.delete(fn);
  };
};

export function useCola() {
  return useSyncExternalStore(suscribir, () => estado);
}

export const useItemCola = (id?: string | null) => {
  const c = useCola();
  return id ? c.items.find((i) => i.id === id) ?? null : null;
};
