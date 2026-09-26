// GPS real con expo-location. Reemplaza la versión falsa de datosApp.js.
// Un solo "watch" para toda la app: las pantallas leen la última ubicación con useUbicacion()
// y el contexto la toma con ubicacionActual() al registrar cada evento.
import { useSyncExternalStore } from 'react';
import * as Location from 'expo-location';
import { distanciaMetros } from '../utils/formato';

export interface Ubicacion {
  lat: number;
  lng: number;
  precision: number | null;
  fecha: string;
  /** Texto corto para mostrar ("Ubicación GPS, ±8 m"). */
  lugar: string;
}

type Permiso = 'pendiente' | 'concedido' | 'denegado';

let estado: { ubicacion: Ubicacion | null; permiso: Permiso } = { ubicacion: null, permiso: 'pendiente' };
const oyentes = new Set<() => void>();
let suscripcion: Location.LocationSubscription | null = null;
let iniciando: Promise<void> | null = null;

function publicar(parcial: Partial<typeof estado>) {
  estado = { ...estado, ...parcial };
  oyentes.forEach((fn) => fn());
}

function desdeObjeto(o: Location.LocationObject): Ubicacion {
  const precision = o.coords.accuracy != null ? Math.round(o.coords.accuracy) : null;
  return {
    lat: o.coords.latitude,
    lng: o.coords.longitude,
    precision,
    fecha: new Date(o.timestamp).toISOString(),
    lugar: precision != null ? `Ubicación GPS, ±${precision} m` : 'Ubicación GPS',
  };
}

/** Pide permiso y empieza a seguir la ubicación. Es seguro llamarla varias veces. */
export function iniciarUbicacion(): Promise<void> {
  if (suscripcion) return Promise.resolve();
  if (iniciando) return iniciando;
  iniciando = (async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        publicar({ permiso: 'denegado' });
        return;
      }
      publicar({ permiso: 'concedido' });
      const ultima = await Location.getLastKnownPositionAsync().catch(() => null);
      if (ultima) publicar({ ubicacion: desdeObjeto(ultima) });
      suscripcion = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 5 },
        (o) => publicar({ ubicacion: desdeObjeto(o) }),
      );
    } catch (e) {
      console.warn('[ubicacion] No se pudo iniciar el GPS', e);
    } finally {
      iniciando = null;
    }
  })();
  return iniciando;
}

export function detenerUbicacion() {
  suscripcion?.remove();
  suscripcion = null;
}

/** Última ubicación conocida (o null si no hay GPS o no hay permiso). */
export const ubicacionActual = () => estado.ubicacion;

const suscribir = (fn: () => void) => {
  oyentes.add(fn);
  return () => {
    oyentes.delete(fn);
  };
};

export function useUbicacion() {
  const actual = useSyncExternalStore(suscribir, () => estado);
  const distanciaA = (destino?: { lat?: number | null; lng?: number | null } | null) =>
    actual.ubicacion && destino?.lat != null && destino?.lng != null
      ? distanciaMetros(actual.ubicacion, { lat: destino.lat, lng: destino.lng })
      : null;
  return { ubicacion: actual.ubicacion, listo: !!actual.ubicacion, permiso: actual.permiso, distanciaA };
}
