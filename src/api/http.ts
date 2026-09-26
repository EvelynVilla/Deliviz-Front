// Cliente HTTP mínimo sobre fetch: agrega el token, aplica timeout y convierte
// las respuestas de error (ProblemDetails de .NET) en ErrorApi con un mensaje claro.

import { API_URL, TIMEOUT_MS } from './config';
import type { ProblemDetails } from './tipos';

export type TipoError = 'red' | 'sesion' | 'prohibido' | 'no_encontrado' | 'conflicto' | 'datos' | 'servidor';

export class ErrorApi extends Error {
  readonly status: number;
  readonly tipo: TipoError;
  readonly problema?: ProblemDetails;

  constructor(mensaje: string, status: number, tipo: TipoError, problema?: ProblemDetails) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.status = status;
    this.tipo = tipo;
    this.problema = problema;
  }

  /** Errores que no se arreglan reintentando (400, 403, 404 de negocio, 409). */
  get esDefinitivo(): boolean {
    return this.tipo === 'datos' || this.tipo === 'prohibido' || this.tipo === 'conflicto';
  }
}

export const esErrorDeRed = (e: unknown): boolean => e instanceof ErrorApi && e.tipo === 'red';

// ---- Token de la sesión ----
let token: string | null = null;
let alVencerSesion: (() => void) | null = null;

export function ponerToken(nuevo: string | null) {
  token = nuevo;
}

/** El AppContext se registra aquí para cerrar sesión cuando la API responde 401. */
export function registrarAlVencerSesion(fn: (() => void) | null) {
  alVencerSesion = fn;
}

const MENSAJES: Record<number, string> = {
  400: 'Faltan datos o tienen un formato incorrecto.',
  401: 'Tu sesión venció o las credenciales son incorrectas.',
  403: 'Este paquete está a nombre de otro repartidor.',
  404: 'No se encontró lo que buscabas.',
  409: 'Esta acción no es válida con el estado actual del paquete.',
};

function tipoPorStatus(status: number): TipoError {
  if (status === 401) return 'sesion';
  if (status === 403) return 'prohibido';
  if (status === 404) return 'no_encontrado';
  if (status === 409) return 'conflicto';
  if (status >= 400 && status < 500) return 'datos';
  return 'servidor';
}

interface Opciones {
  metodo?: 'GET' | 'POST' | 'PUT';
  cuerpo?: unknown;
  /** El login no manda token ni debe disparar el cierre de sesión en 401. */
  publico?: boolean;
}

export async function pedir<T>(ruta: string, { metodo = 'GET', cuerpo, publico = false }: Opciones = {}): Promise<T> {
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), TIMEOUT_MS);

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (cuerpo !== undefined) headers['Content-Type'] = 'application/json';
  if (!publico && token) headers.Authorization = `Bearer ${token}`;

  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
      signal: control.signal,
    });
  } catch {
    // Sin señal, servidor apagado, IP equivocada o timeout: todo cuenta como "sin conexión".
    throw new ErrorApi('No hay conexión con el servidor.', 0, 'red');
  } finally {
    clearTimeout(temporizador);
  }

  const texto = await respuesta.text();
  const json = texto ? intentarJson(texto) : undefined;

  if (!respuesta.ok) {
    const problema = (json && typeof json === 'object' ? json : undefined) as ProblemDetails | undefined;
    const detalle = problema?.detail ?? primerErrorDeValidacion(problema) ?? problema?.title;
    const mensaje = detalle ?? MENSAJES[respuesta.status] ?? `Error del servidor (${respuesta.status}).`;
    const error = new ErrorApi(mensaje, respuesta.status, tipoPorStatus(respuesta.status), problema);
    if (error.tipo === 'sesion' && !publico) alVencerSesion?.();
    throw error;
  }

  return json as T;
}

function intentarJson(texto: string): unknown {
  try {
    return JSON.parse(texto);
  } catch {
    return undefined;
  }
}

// ASP.NET manda los errores de validación del modelo en `errors: { campo: [mensajes] }`.
function primerErrorDeValidacion(p?: ProblemDetails): string | undefined {
  if (!p?.errors) return undefined;
  const [campo, mensajes] = Object.entries(p.errors)[0] ?? [];
  return campo && mensajes?.length ? `${campo}: ${mensajes[0]}` : undefined;
}
