// Tipos del contrato de la API de Deliviz (Fase 1-3, responsable: Vaneza).
// Fuente: docs/api-contrato.md. Si el contrato cambia, este es el primer archivo a tocar:
// TypeScript marcará todos los lugares de la app que dependen del campo que cambió.

// ---- Enums (valores en snake_case) ----
export type TipoEvento = 'llegada_bodega' | 'salida_ruta' | 'transferencia' | 'incidente' | 'entrega' | 'excepcion';
export type EstadoPaqueteApi = 'en_bodega' | 'en_ruta' | 'entregado' | 'no_entregado';
export type Origen = 'nacional' | 'internacional';
export type Condicion = 'bien' | 'danado' | 'incompleto';
export type Motivo = 'nadie_recibio' | 'direccion_incorrecta' | 'rechazado' | 'otro';
export type RelacionReceptor = 'titular' | 'familiar' | 'vecino' | 'recepcion' | 'otro';
export type TipoFoto = 'paquete' | 'firma';
export type EstadoFoto = 'pendiente' | 'procesada';
export type Rol = 'repartidor' | 'administrador';

// ---- Errores (ProblemDetails) ----
export interface ProblemDetails {
  status: number;
  title?: string;
  detail?: string;
  type?: string;
  errors?: Record<string, string[]>;
}

// ---- POST /api/auth/login ----
export interface LoginEntrada {
  email: string;
  password: string;
}
export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
}
export interface LoginSalida {
  token: string;
  expiraEn: string;
  usuario: Usuario;
}

// ---- POST /api/eventos ----
// El id lo genera la app (UUID v4). Reenviar el mismo id no duplica el evento.
export interface EventoEntrada {
  id: string;
  numeroGuia: string;
  tipo: TipoEvento;
  latitud?: number;
  longitud?: number;
  /** ISO 8601 con zona horaria, ej. 2026-09-22T12:30:00-06:00 */
  fechaCaptura: string;
  // Campos según el tipo (ver tabla "Qué exige cada evento")
  condicion?: Condicion;
  origen?: Origen;
  comentario?: string;
  nombreReceptor?: string;
  relacionReceptor?: RelacionReceptor;
  motivo?: Motivo;
}
export interface EventoSalida {
  id: string;
  numeroGuia: string;
  tipo: TipoEvento;
  estadoPaquete: EstadoPaqueteApi;
  requiereFotoPaquete: boolean;
  requiereFirma: boolean;
  fechaCaptura: string;
  fechaRecepcion: string;
  yaExistia: boolean;
}

// ---- GET /api/eventos/{id} ----
export interface FotoResumen {
  id: string;
  tipo: TipoFoto;
  estado: EstadoFoto;
}
export interface EventoDetalle {
  id: string;
  numeroGuia: string;
  tipo: TipoEvento;
  estadoPaquete: EstadoPaqueteApi;
  fechaCaptura: string;
  fechaRecepcion: string;
  evidenciaCompleta: boolean;
  fotos: FotoResumen[];
}

// ---- POST /api/fotos/sas ----
export interface SasEntrada {
  eventoId: string;
  tipo: TipoFoto;
}
export interface SasSalida {
  fotoId: string;
  blobName: string;
  uploadUrl: string;
  expiraEn: string;
}

// ---- GET /api/repartidor/paquetes ----
export interface PaqueteAsignado {
  id: string;
  numeroGuia: string;
  estado: EstadoPaqueteApi;
  origen: Origen | null;
  ultimoEvento: TipoEvento | null;
  ultimaActividad: string | null;
}

// ---- GET /api/paquetes/{guia}/historial ----
export interface FotoHistorial extends FotoResumen {
  /** Solo viene cuando estado = 'procesada'. URL de lectura temporal (15 min). */
  url: string | null;
}
export interface EventoHistorial {
  id: string;
  tipo: TipoEvento;
  latitud: number | null;
  longitud: number | null;
  fechaCaptura: string;
  fechaRecepcion: string;
  condicion: Condicion | null;
  motivo: Motivo | null;
  comentario: string | null;
  nombreReceptor: string | null;
  relacionReceptor: RelacionReceptor | null;
  fotos: FotoHistorial[];
}
export interface Historial {
  id: string;
  numeroGuia: string;
  estado: EstadoPaqueteApi;
  origen: Origen | null;
  urlsDisponibles: boolean;
  eventos: EventoHistorial[];
}

/**
 * Datos del destinatario que la app necesita para las pantallas 2, 3, 8 y 11
 * pero que el contrato actual NO devuelve. Todos son opcionales: si el backend
 * los agrega con estos nombres (camelCase) en /repartidor/paquetes o en /historial,
 * la app los muestra sin más cambios. Ver "Huecos del contrato" en el README.
 */
export interface DatosDestinatario {
  destinatario?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  colonia?: string | null;
  ciudad?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  ventana?: string | null;
  indicaciones?: string | null;
  descripcion?: string | null;
  peso?: number | null;
}
export type PaqueteAsignadoConDatos = PaqueteAsignado & DatosDestinatario;
export type HistorialConDatos = Historial & DatosDestinatario;

/** Interfaz común de la API real y la simulada: las pantallas no saben cuál usan. */
export interface ClienteApi {
  login(entrada: LoginEntrada): Promise<LoginSalida>;
  registrarEvento(evento: EventoEntrada): Promise<EventoSalida>;
  obtenerEvento(id: string): Promise<EventoDetalle>;
  pedirSas(entrada: SasEntrada): Promise<SasSalida>;
  /** PUT del archivo local a la URL SAS de Azure Blob. */
  subirArchivo(uploadUrl: string, archivoUri: string, mime: string, onProgreso?: (fraccion: number) => void): Promise<void>;
  paquetesAsignados(): Promise<PaqueteAsignadoConDatos[]>;
  historial(guia: string): Promise<HistorialConDatos>;
}
