// Acceso a datos del panel. Hoy responde con los datos de prueba (src/datos/baseDatos.js).
// Cuando Vaneza publique los endpoints, cada función se cambia por su fetch real:
// las pantallas no se enteran, porque solo usan estas funciones a través de TanStack Query.
import db, { calcularAlertas, eventosDe, nombreRepartidor, ultimoEvento } from '../datos/baseDatos';
import { calcularIndicadores } from '../reportes/indicadores';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';

const esperar = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const error = (mensaje, codigo) => Object.assign(new Error(mensaje), { codigo });

// POST /auth/admin
export async function iniciarSesion(correo, contrasena) {
  await esperar(600);
  const admin = db.administradores.find((a) => a.correo === correo.trim().toLowerCase());
  if (!admin || contrasena.length < 6) throw error('Correo o contraseña incorrectos.', 'CREDENCIALES_INVALIDAS');
  return { token: 'jwt-simulado-admin', admin };
}

const resumenPaquete = (p) => {
  const ult = ultimoEvento(p.guia);
  return { ...p, repartidor: nombreRepartidor(p.repartidorId), ultimoEvento: ult };
};

// GET /paquetes?busqueda=&estado=&repartidor=&desde=&hasta=&pagina=
export async function listarPaquetes({ busqueda = '', estado = 'todos', repartidorId = 'todos', desde = null, pagina = 1, porPagina = 20 } = {}) {
  await esperar();
  const q = busqueda.trim().toLowerCase();
  let lista = db.paquetes.map(resumenPaquete);
  if (q) lista = lista.filter((p) => p.guia.toLowerCase().includes(q) || p.destinatario.toLowerCase().includes(q));
  if (estado !== 'todos') lista = lista.filter((p) => p.estado === estado);
  if (repartidorId !== 'todos') lista = lista.filter((p) => p.repartidorId === repartidorId);
  if (desde) lista = lista.filter((p) => new Date(p.ultimoEvento?.fecha ?? p.creado) >= desde);
  // Lo más reciente primero; los que aún no tienen eventos (por recoger) al final
  lista.sort((a, b) => new Date(b.ultimoEvento?.fecha ?? 0) - new Date(a.ultimoEvento?.fecha ?? 0));
  const total = lista.length;
  return { total, pagina, paginas: Math.max(1, Math.ceil(total / porPagina)), paquetes: lista.slice((pagina - 1) * porPagina, pagina * porPagina) };
}

// GET /paquetes/:guia  (historial, recorrido y evidencia)
export async function obtenerPaquete(guia) {
  await esperar();
  const p = db.paquetes.find((x) => x.guia === guia.toUpperCase());
  if (!p) throw error(`No existe la guía ${guia}.`, 'NO_ENCONTRADO');
  const eventos = eventosDe(p.guia).map((e) => ({ ...e, repartidor: nombreRepartidor(e.repartidorId), destino: e.datos.a ? nombreRepartidor(e.datos.a) : null }));
  const entrega = eventos.filter((e) => e.tipo === 'entrega').pop() ?? null;
  const alertas = calcularAlertas().filter((a) => a.guia === p.guia);
  return { ...resumenPaquete(p), eventos, entrega, alertas };
}

// GET /alertas
export async function listarAlertas() {
  await esperar();
  return calcularAlertas().map((a) => ({ ...a, repartidor: nombreRepartidor(a.repartidorId) }));
}

// POST /alertas/:id/revisar
export async function marcarAlertaRevisada(id, revisada = true) {
  await esperar(150);
  if (revisada) db.alertasRevisadas.add(id); else db.alertasRevisadas.delete(id);
  return { ok: true };
}

// GET /repartidores
export async function listarRepartidores() {
  await esperar();
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  return db.repartidores.map((r) => {
    const asignados = db.paquetes.filter((p) => p.repartidorId === r.id && ['en_ruta', 'en_bodega', 'en_transferencia', 'por_recoger'].includes(p.estado));
    const entregadosHoy = db.eventos.filter((e) => e.tipo === 'entrega' && e.repartidorId === r.id && new Date(e.fecha) >= hoy).length;
    return { ...r, asignados: asignados.map(resumenPaquete), entregadosHoy };
  });
}

// POST /repartidores  |  PUT /repartidores/:id
export async function guardarRepartidor(datos) {
  await esperar(400);
  if (datos.id && db.repartidores.some((r) => r.id === datos.id)) {
    const r = db.repartidores.find((x) => x.id === datos.id);
    Object.assign(r, { nombre: datos.nombre, zona: datos.zona, telefono: datos.telefono, activo: datos.activo });
    return { ...r };
  }
  if (db.repartidores.some((r) => r.id === datos.numero)) throw error(`El número ${datos.numero} ya está en uso.`, 'DUPLICADO');
  const nuevo = { id: datos.numero, nombre: datos.nombre, zona: datos.zona, telefono: datos.telefono, activo: true };
  db.repartidores.push(nuevo);
  return { ...nuevo };
}

export function siguienteNumeroRepartidor() {
  const max = Math.max(...db.repartidores.map((r) => Number(r.id.slice(2))));
  return `R-${String(max + 1).padStart(4, '0')}`;
}

// GET /reportes?desde=&hasta=
export async function obtenerReportes(rango) {
  await esperar(350);
  return calcularIndicadores(db, rango);
}

// GET /ajustes  |  PUT /ajustes
export async function obtenerAjustes() {
  await esperar();
  return { ...db.ajustes, bodegas: db.bodegas.map((b) => ({ ...b })) };
}
export async function guardarAjustes({ horasSinEventos }) {
  await esperar(300);
  db.ajustes.horasSinEventos = horasSinEventos;
  return { ...db.ajustes };
}
export async function guardarBodega(b) {
  await esperar(300);
  if (b.id) {
    Object.assign(db.bodegas.find((x) => x.id === b.id), b);
  } else {
    db.bodegas.push({ ...b, id: `BOD-${String(db.bodegas.length + 1).padStart(2, '0')}`, activa: true });
  }
  return { ok: true };
}

// POST /paquetes/:guia/enlace  -> enlace de solo lectura con vencimiento (endpoint de Vaneza)
export async function crearEnlace(guia, dias = 7) {
  await esperar(300);
  const token = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
  const venceEn = new Date(Date.now() + dias * 24 * 3600 * 1000).toISOString();
  db.enlaces.set(token, { guia, venceEn });
  return { token, venceEn };
}

// GET /publico/evidencia/:token  (sin sesión, P8)
export async function obtenerEvidenciaPublica(token) {
  await esperar(400);
  // Enlace de demostración para abrir P8 sin generar uno antes
  const enlace = token === 'demo' ? { guia: 'DLV-48190', venceEn: new Date(Date.now() + 7 * 864e5).toISOString() } : db.enlaces.get(token);
  if (!enlace) throw error('Este enlace no existe. Pídele a quien te lo mandó que genere uno nuevo.', 'NO_ENCONTRADO');
  if (new Date(enlace.venceEn) < new Date()) throw error('Este enlace ya venció. Pide uno nuevo a Deliviz.', 'VENCIDO');
  const p = await obtenerPaquete(enlace.guia);
  // Solo lo que el cliente necesita ver: sin teléfono ni datos internos
  return {
    guia: p.guia, destinatario: p.destinatario, direccion: `${p.direccion}, ${p.colonia}, ${p.ciudad}`, estado: p.estado,
    entrega: p.entrega, venceEn: enlace.venceEn,
    eventos: p.eventos.map(({ tipo, fecha, datos, foto }) => ({ tipo, fecha, foto, datos: { estadoPaquete: datos.estadoPaquete, motivo: datos.motivo } })),
  };
}
