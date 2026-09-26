// Estado global de la app del repartidor.
//
// Mantiene la MISMA interfaz que usaban las pantallas en JS (sesion, paquetes, avisar,
// registrarLlegada, salirARuta…), pero ahora cada acción:
//   1. arma el evento con la forma exacta del contrato (id UUID, fechaCaptura con zona, GPS),
//   2. prepara la evidencia (foto comprimida, firma PNG) en el teléfono,
//   3. lo mete a la cola, que lo envía cuando hay señal (services/cola.ts),
//   4. actualiza la lista local al instante, sin esperar a la red.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { randomUUID } from 'expo-crypto';
import { api, ErrorApi, ponerToken, registrarAlVencerSesion, USAR_MOCK } from '../api';
import type { Condicion, EventoEntrada, LoginSalida, Motivo, Origen, RelacionReceptor, TipoEvento, DatosDestinatario } from '../api/tipos';
import { datosDemoDe, suscribirSinSenalSimulada } from '../api/mock';
import { paquetesDemo, transferenciasDemo } from '../data/mock';
import { aplicarDatos, paqueteDesdeAsignado, paqueteVacio, type EstadoApp, type EventoApp, type Paquete } from '../modelo';
import { leerJson, escribirJson } from '../services/almacen';
import * as cola from '../services/cola';
import { guardarFirma, prepararFoto, type ArchivoEvidencia } from '../services/evidencia';
import { borrarSesion, guardarSesion, leerSesion } from '../services/sesion';
import { iniciarUbicacion, ubicacionActual, type Ubicacion } from '../services/ubicacion';
import { diaLocal, isoConZona } from '../utils/fechas';

// ------------------------------------------------------------------ tipos públicos
export interface Repartidor {
  id: string;
  numero: string; // se muestra en Perfil; la API identifica por email
  email: string;
  nombre: string;
  nombreCorto: string;
  zona: string | null;
  telefono: string | null;
}

export interface Sesion {
  token: string;
  expiraEn: string;
  repartidor: Repartidor;
}

/** Foto tal como la entrega el componente CapturaFoto. */
export interface FotoCapturada {
  uri: string;
  ancho?: number;
  alto?: number;
  fecha: string;
}

export interface TransferenciaPendiente {
  id: string;
  de: { numero: string; nombre: string };
  motivo: string;
  fecha: string;
  foto: unknown;
  paquete: Paquete;
}

type Tono = 'exito' | 'alerta';

interface ValorApp {
  sesion: Sesion | null;
  restaurando: boolean;
  paquetes: Paquete[];
  transferencias: TransferenciaPendiente[];
  cargando: boolean;
  errorRuta: string | null;
  aviso: { texto: string; tono: Tono; id: number } | null;
  iniciarSesion(email: string, contrasena: string): Promise<void>;
  cerrarSesion(): void;
  cargarRuta(): Promise<void>;
  avisar(texto: string, tono?: Tono): void;
  registrarLlegada(d: { guia: string; estadoPaquete: Condicion; foto: FotoCapturada; origen?: Origen; datos?: DatosDestinatario | null }): Promise<void>;
  salirARuta(guias: string[]): Promise<void>;
  transferir(d: { guia: string; destino: { id: string; nombre: string }; motivo: string; foto: FotoCapturada }): Promise<void>;
  recibirTransferencia(d: { guia: string; foto: FotoCapturada; datos?: DatosDestinatario | null; de?: string }): Promise<void>;
  reportarProblema(d: { guia: string; tipo: string; descripcion: string; foto: FotoCapturada }): Promise<void>;
  registrarEntrega(d: {
    guia: string;
    foto: FotoCapturada;
    firmaDataUrl: string;
    nombreReceptor: string;
    relacionReceptor: RelacionReceptor;
    fechaCaptura: string;
    ubicacion: Ubicacion | null;
  }): Promise<string>;
  registrarExcepcion(d: { guia: string; motivo: Motivo; comentario: string; foto: FotoCapturada }): Promise<string>;
}

const AppContext = createContext<ValorApp | null>(null);

// ------------------------------------------------------------------ persistencia local
interface GuardadoLocal {
  dia: string;
  paquetes: Paquete[];
}
const archivoPaquetes = (usuarioId: string) => `paquetes-${usuarioId.replace(/[^\w.-]/g, '_')}.json`;

function leerPaquetesLocales(usuarioId: string): Paquete[] | null {
  const g = leerJson<GuardadoLocal | null>(archivoPaquetes(usuarioId), null);
  if (!g) return null;
  if (g.dia === diaLocal()) return g.paquetes;
  // De otro día solo sirven los que siguen en bodega (los entregados ya no se muestran).
  return g.paquetes.filter((p) => p.estado === 'en_bodega' || cola.hayPendientes(p.guia));
}

const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

function repartidorDesde(s: LoginSalida): Repartidor {
  const u = s.usuario;
  return { id: u.id, numero: u.email, email: u.email, nombre: u.nombre, nombreCorto: u.nombre.split(' ')[0] ?? u.nombre, zona: null, telefono: null };
}

/**
 * Une lo que dice la API (solo paquetes en_ruta conmigo) con lo que sabe el teléfono
 * (en bodega, entregados hoy y cambios que siguen en la cola).
 */
function fusionar(locales: Paquete[], remotos: Awaited<ReturnType<typeof api.paquetesAsignados>>): Paquete[] {
  const porGuia = new Map(locales.map((p) => [p.guia, p]));
  const resultado: Paquete[] = [];
  const vistas = new Set<string>();
  let orden = Math.max(0, ...locales.map((p) => (p.orden < 1e9 ? p.orden : 0)));

  for (const r of remotos) {
    const previo = porGuia.get(r.numeroGuia);
    let p = paqueteDesdeAsignado(r, previo);
    // Si el teléfono tiene eventos sin subir (ej. una entrega) o marcó una transferencia, manda lo local.
    if (previo && (cola.hayPendientes(r.numeroGuia) || previo.estado === 'en_transferencia')) p = { ...p, estado: previo.estado };
    if (!previo) p = { ...p, orden: ++orden };
    resultado.push(p);
    vistas.add(r.numeroGuia);
  }
  for (const p of locales) {
    if (vistas.has(p.guia)) continue;
    const conservar: EstadoApp[] = ['por_recoger', 'en_bodega', 'entregado', 'no_entregado'];
    // Un "en ruta" que ya no devuelve la API se transfirió o se reasignó: se quita de la lista.
    if (conservar.includes(p.estado) || cola.hayPendientes(p.guia)) resultado.push(p);
  }
  return resultado;
}

// ------------------------------------------------------------------ proveedor
export function AppProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [restaurando, setRestaurando] = useState(true);
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [transferencias, setTransferencias] = useState<TransferenciaPendiente[]>([]);
  const [cargando, setCargando] = useState(false);
  const [errorRuta, setErrorRuta] = useState<string | null>(null);
  const [aviso, setAviso] = useState<ValorApp['aviso']>(null);
  const temporizadorAviso = useRef<ReturnType<typeof setTimeout> | null>(null);

  const avisar = useCallback((texto: string, tono: Tono = 'exito') => {
    if (temporizadorAviso.current) clearTimeout(temporizadorAviso.current);
    setAviso({ texto, tono, id: Date.now() });
    temporizadorAviso.current = setTimeout(() => setAviso(null), 3600);
  }, []);

  const usuarioId = sesion?.repartidor.id ?? null;
  const nombreRepartidor = sesion?.repartidor.nombre ?? '';

  // Guarda la lista local en cada cambio.
  useEffect(() => {
    if (usuarioId) escribirJson(archivoPaquetes(usuarioId), { dia: diaLocal(), paquetes } satisfies GuardadoLocal);
  }, [paquetes, usuarioId]);

  const cargarRuta = useCallback(async () => {
    setCargando(true);
    try {
      const remotos = await api.paquetesAsignados();
      setPaquetes((locales) => fusionar(locales, remotos));
      setErrorRuta(null);
    } catch (e) {
      // Sin señal se sigue trabajando con la lista guardada en el teléfono.
      setErrorRuta(e instanceof ErrorApi && e.tipo === 'red' ? 'Sin conexión: mostrando la última lista guardada.' : (e as Error).message);
    } finally {
      setCargando(false);
    }
  }, []);

  const entrar = useCallback(
    async (s: LoginSalida) => {
      if (s.usuario.rol !== 'repartidor') {
        throw new ErrorApi('Esta app es para repartidores. Los administradores usan el panel web.', 403, 'prohibido');
      }
      ponerToken(s.token);
      const repartidor = repartidorDesde(s);
      cola.cargarCola();
      const locales = leerPaquetesLocales(repartidor.id) ?? (USAR_MOCK ? (copia(paquetesDemo) as unknown as Paquete[]) : []);
      setPaquetes(locales);
      setTransferencias(USAR_MOCK ? (copia(transferenciasDemo) as unknown as TransferenciaPendiente[]) : []);
      setSesion({ token: s.token, expiraEn: s.expiraEn, repartidor });
      cola.activarUsuario(repartidor.id);
      void iniciarUbicacion();
    },
    [],
  );

  // Restaurar la sesión guardada al abrir la app.
  useEffect(() => {
    (async () => {
      const guardada = await leerSesion();
      if (guardada) {
        try {
          await entrar(guardada);
        } catch {
          await borrarSesion();
        }
      }
      setRestaurando(false);
    })();
  }, [entrar]);

  // Con sesión: cargar la ruta y arrancar los reintentos automáticos de la cola.
  useEffect(() => {
    if (!usuarioId) return;
    // Se agenda en vez de llamarse directo para no encadenar renders dentro del efecto.
    void Promise.resolve().then(cargarRuta);
    const detener = cola.iniciarSincronizacionAutomatica();
    const quitarAvisos = cola.suscribirAvisos(({ tipo, item }) => {
      if (tipo === 'rechazado') {
        avisar(`${item.guia}: la API rechazó el registro. ${item.error ?? ''}`.trim(), 'alerta');
        void cargarRuta();
      }
    });
    const quitarSimulacion = suscribirSinSenalSimulada((sinSenal) => {
      if (!sinSenal) void cola.reintentarAhora();
    });
    return () => {
      detener();
      quitarAvisos();
      quitarSimulacion();
    };
  }, [usuarioId, cargarRuta, avisar]);

  const cerrarSesion = useCallback(() => {
    // La cola NO se borra: si queda evidencia sin subir, se envía al volver a entrar.
    cola.activarUsuario(null);
    ponerToken(null);
    void borrarSesion();
    setSesion(null);
    setPaquetes([]);
    setTransferencias([]);
  }, []);

  // 401 desde cualquier llamada = token vencido.
  useEffect(() => {
    registrarAlVencerSesion(() => {
      cerrarSesion();
      avisar('Tu sesión venció. Entra de nuevo: tu evidencia sigue guardada en el teléfono.', 'alerta');
    });
    return () => registrarAlVencerSesion(null);
  }, [cerrarSesion, avisar]);

  const iniciarSesion = useCallback(
    async (email: string, contrasena: string) => {
      const s = await api.login({ email: email.trim().toLowerCase(), password: contrasena });
      await entrar(s);
      await guardarSesion(s);
    },
    [entrar],
  );

  // ------------------------------------------------------------------ helpers de eventos
  const actualizarPaquete = useCallback((guia: string, cambio: (p: Paquete) => Paquete) => {
    setPaquetes((lista) => lista.map((p) => (p.guia === guia ? cambio(p) : p)));
  }, []);

  const agregarEvento = (p: Paquete, e: EventoApp): Paquete => ({ ...p, eventos: [...p.eventos, e] });

  /** Arma el EventoEntrada del contrato y lo encola con su evidencia. */
  const encolarEvento = useCallback(
    (
      tipo: TipoEvento,
      guia: string,
      extra: Partial<EventoEntrada>,
      evidencia: { paquete?: ArchivoEvidencia; firma?: ArchivoEvidencia },
      fecha: string = new Date().toISOString(),
      ubicacion: Ubicacion | null = ubicacionActual(),
    ) => {
      if (!usuarioId) throw new Error('No hay sesión');
      const evento: EventoEntrada = {
        id: randomUUID(),
        numeroGuia: guia,
        tipo,
        fechaCaptura: isoConZona(fecha),
        ...(ubicacion ? { latitud: ubicacion.lat, longitud: ubicacion.lng } : {}),
        ...extra,
      };
      const fotos: cola.FotoCola[] = [];
      if (evidencia.paquete) fotos.push({ tipo: 'paquete', ...evidencia.paquete, mime: 'image/jpeg', subida: false });
      if (evidencia.firma) fotos.push({ tipo: 'firma', ...evidencia.firma, mime: 'image/png', subida: false });
      cola.encolar({ usuarioId, evento, fotos });
      return { id: evento.id, fecha, lugar: ubicacion?.lugar ?? 'Sin GPS', latitud: ubicacion?.lat, longitud: ubicacion?.lng };
    },
    [usuarioId],
  );

  const prepararDeCaptura = (f: FotoCapturada) => prepararFoto(f.uri, f.ancho, f.alto);

  // ------------------------------------------------------------------ acciones (pantallas 4 a 16)

  // Pantallas 4, 5 y 6 · llegada_bodega: foto + condicion
  const registrarLlegada: ValorApp['registrarLlegada'] = useCallback(
    async ({ guia, estadoPaquete, foto, origen, datos }) => {
      const archivo = await prepararDeCaptura(foto);
      const base = encolarEvento('llegada_bodega', guia, { condicion: estadoPaquete, ...(origen ? { origen } : {}) }, { paquete: archivo }, foto.fecha);
      const evento: EventoApp = { ...base, tipo: 'llegada_bodega', estadoPaquete, foto: { uri: archivo.uri }, responsable: nombreRepartidor, enCola: true };
      setPaquetes((lista) => {
        const existe = lista.find((p) => p.guia === guia);
        const previo = existe ?? aplicarDatos(paqueteVacio(guia), datos ?? (USAR_MOCK ? datosDemoDe(guia) ?? {} : {}));
        const nuevo: Paquete = { ...agregarEvento(previo, evento), estado: 'en_bodega', estadoFisico: estadoPaquete };
        return existe ? lista.map((p) => (p.guia === guia ? nuevo : p)) : [...lista, nuevo];
      });
    },
    [encolarEvento, nombreRepartidor],
  );

  // Pantalla 7 · salida_ruta: sin foto. El contrato registra un evento POR guía.
  const salirARuta = useCallback(
    async (guias: string[]) => {
      const eventos = new Map(guias.map((g) => [g, encolarEvento('salida_ruta', g, {}, {})]));
      setPaquetes((lista) =>
        lista.map((p) => {
          const base = eventos.get(p.guia);
          if (!base) return p;
          return { ...agregarEvento(p, { ...base, tipo: 'salida_ruta', responsable: nombreRepartidor, enCola: true }), estado: 'en_ruta', requiere: 'Foto y firma' };
        }),
      );
    },
    [encolarEvento, nombreRepartidor],
  );

  // Pantalla 9 (quien entrega el paquete). El contrato NO tiene endpoint para esto: la
  // transferencia la registra quien RECIBE. Aquí solo se marca en el teléfono.
  const transferir: ValorApp['transferir'] = useCallback(
    async ({ guia, destino, motivo, foto }) => {
      actualizarPaquete(guia, (p) => ({
        ...agregarEvento(p, { id: randomUUID(), tipo: 'transferencia_enviada', fecha: foto.fecha, destino: destino.nombre, motivo, foto: { uri: foto.uri }, responsable: nombreRepartidor }),
        estado: 'en_transferencia',
        transferenciaA: destino.nombre,
      }));
    },
    [actualizarPaquete, nombreRepartidor],
  );

  // Pantalla 9 (quien recibe) · transferencia: foto obligatoria, la registra el nuevo responsable.
  const recibirTransferencia: ValorApp['recibirTransferencia'] = useCallback(
    async ({ guia, foto, datos, de }) => {
      const archivo = await prepararDeCaptura(foto);
      const base = encolarEvento('transferencia', guia, {}, { paquete: archivo }, foto.fecha);
      const pendiente = transferencias.find((t) => t.paquete.guia === guia);
      const evento: EventoApp = { ...base, tipo: 'transferencia', de: de ?? pendiente?.de.nombre, motivo: pendiente?.motivo, foto: { uri: archivo.uri }, responsable: nombreRepartidor, enCola: true };
      setTransferencias((l) => l.filter((t) => t.paquete.guia !== guia));
      setPaquetes((lista) => {
        const existe = lista.find((p) => p.guia === guia);
        const previo = existe ?? (pendiente ? pendiente.paquete : aplicarDatos(paqueteVacio(guia), datos ?? {}));
        const nuevo: Paquete = { ...agregarEvento(previo, evento), estado: 'en_ruta', requiere: 'Foto y firma', transferenciaA: undefined };
        return existe ? lista.map((p) => (p.guia === guia ? nuevo : p)) : [...lista, nuevo];
      });
    },
    [encolarEvento, nombreRepartidor, transferencias],
  );

  // Pantalla 10 · incidente: foto + comentario obligatorio. El tipo elegido va al inicio del comentario.
  const reportarProblema: ValorApp['reportarProblema'] = useCallback(
    async ({ guia, tipo, descripcion, foto }) => {
      const archivo = await prepararDeCaptura(foto);
      const comentario = descripcion ? `${tipo}: ${descripcion}` : tipo;
      const base = encolarEvento('incidente', guia, { comentario }, { paquete: archivo }, foto.fecha);
      actualizarPaquete(guia, (p) => ({
        ...agregarEvento(p, { ...base, tipo: 'incidente', problema: tipo, descripcion, comentario, foto: { uri: archivo.uri }, responsable: nombreRepartidor, enCola: true }),
        incidente: tipo,
      }));
    },
    [encolarEvento, actualizarPaquete, nombreRepartidor],
  );

  // Pantallas 11 a 15 · entrega: foto + firma + nombreReceptor + relacionReceptor.
  const registrarEntrega: ValorApp['registrarEntrega'] = useCallback(
    async ({ guia, foto, firmaDataUrl, nombreReceptor, relacionReceptor, fechaCaptura, ubicacion }) => {
      const [archivoFoto, archivoFirma] = await Promise.all([prepararDeCaptura(foto), Promise.resolve(guardarFirma(firmaDataUrl))]);
      // La hora y la ubicación son las del momento de la firma (pantalla 13), no las de ahora.
      const base = encolarEvento(
        'entrega',
        guia,
        { nombreReceptor: nombreReceptor.trim(), relacionReceptor },
        { paquete: archivoFoto, firma: archivoFirma },
        fechaCaptura,
        ubicacion ?? ubicacionActual(),
      );
      actualizarPaquete(guia, (p) => ({
        ...agregarEvento(p, {
          ...base,
          tipo: 'entrega',
          nombreReceptor,
          relacionReceptor,
          foto: { uri: archivoFoto.uri },
          firma: { uri: archivoFirma.uri },
          responsable: nombreRepartidor,
          enCola: true,
        }),
        estado: 'entregado',
        entregadoEn: fechaCaptura,
      }));
      return base.id;
    },
    [encolarEvento, actualizarPaquete, nombreRepartidor],
  );

  // Pantalla 16 · excepcion: foto + motivo (comentario obligatorio si el motivo es "otro"). Sin firma.
  const registrarExcepcion: ValorApp['registrarExcepcion'] = useCallback(
    async ({ guia, motivo, comentario, foto }) => {
      const archivo = await prepararDeCaptura(foto);
      const texto = comentario.trim();
      const base = encolarEvento('excepcion', guia, { motivo, ...(texto ? { comentario: texto } : {}) }, { paquete: archivo }, foto.fecha);
      actualizarPaquete(guia, (p) => ({
        ...agregarEvento(p, { ...base, tipo: 'excepcion', motivoExcepcion: motivo, comentario: texto || null, foto: { uri: archivo.uri }, responsable: nombreRepartidor, enCola: true }),
        estado: 'no_entregado',
      }));
      return base.id;
    },
    [encolarEvento, actualizarPaquete, nombreRepartidor],
  );

  const valor = useMemo<ValorApp>(
    () => ({
      sesion, restaurando, paquetes, transferencias, cargando, errorRuta, aviso,
      iniciarSesion, cerrarSesion, cargarRuta, avisar,
      registrarLlegada, salirARuta, transferir, recibirTransferencia, reportarProblema, registrarEntrega, registrarExcepcion,
    }),
    [sesion, restaurando, paquetes, transferencias, cargando, errorRuta, aviso, iniciarSesion, cerrarSesion, cargarRuta, avisar,
      registrarLlegada, salirARuta, transferir, recibirTransferencia, reportarProblema, registrarEntrega, registrarExcepcion],
  );

  return <AppContext.Provider value={valor}>{children}</AppContext.Provider>;
}

// ------------------------------------------------------------------ hooks
export function useApp(): ValorApp {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>');
  return ctx;
}

/** Hook para pantallas que solo existen con sesión (evita comprobar null en cada una). */
export function useSesion(): Sesion {
  const { sesion } = useApp();
  if (!sesion) throw new Error('Esta pantalla requiere sesión');
  return sesion;
}

export function usePaquete(guia?: string | null): Paquete | null {
  const { paquetes, transferencias } = useApp();
  if (!guia) return null;
  return paquetes.find((p) => p.guia === guia) ?? transferencias.find((t) => t.paquete.guia === guia)?.paquete ?? null;
}

export function useResumenRuta() {
  const { paquetes } = useApp();
  return useMemo(() => {
    const ordenados = [...paquetes].sort((a, b) => a.orden - b.orden);
    const porRecoger = ordenados.filter((p) => p.estado === 'por_recoger' || p.estado === 'en_bodega');
    const enRuta = ordenados.filter((p) => p.estado === 'en_ruta' || p.estado === 'en_transferencia');
    const entregados = ordenados.filter((p) => p.estado === 'entregado' || p.estado === 'no_entregado');
    const enBodega = ordenados.filter((p) => p.estado === 'en_bodega');
    const hechos = ordenados.filter((p) => p.estado === 'entregado').length;
    const totalDia = enRuta.length + entregados.length;
    const siguiente = enRuta.find((p) => p.estado === 'en_ruta') ?? null;
    return { porRecoger, enRuta, entregados, enBodega, hechos, totalDia, siguiente };
  }, [paquetes]);
}
