// "Base de datos" en memoria con los datos de prueba.
// Reproduce lo que harán los endpoints de Vaneza (consultas, alertas, enlaces).
// Cuando la API exista, src/api/cliente.js deja de usar este archivo.
import { generarDatos } from './generador.mjs';

const db = generarDatos();

const porGuia = new Map();
for (const e of db.eventos) {
  if (!porGuia.has(e.guia)) porGuia.set(e.guia, []);
  porGuia.get(e.guia).push(e);
}

db.enlaces = new Map(); // token -> { guia, venceEn }
db.alertasRevisadas = new Set();

export const eventosDe = (guia) => porGuia.get(guia) ?? [];
export const ultimoEvento = (guia) => { const l = eventosDe(guia); return l[l.length - 1] ?? null; };
export const repartidor = (id) => db.repartidores.find((r) => r.id === id) ?? null;
export const nombreRepartidor = (id) => repartidor(id)?.nombre ?? id;

// ----- Alertas (misma regla que programa Vaneza en la fase 3) -----
export function calcularAlertas(ahora = new Date()) {
  const alertas = [];
  const limite = db.ajustes.horasSinEventos * 60;
  // Excepciones e incidentes de las últimas 24 horas
  const hoy = new Date(ahora.getTime() - 24 * 3600 * 1000);

  for (const p of db.paquetes) {
    const ult = ultimoEvento(p.guia);
    if (!ult) continue;

    if (['en_ruta', 'en_bodega', 'en_transferencia'].includes(p.estado)) {
      const minutos = (ahora - new Date(ult.fecha)) / 60000;
      if (minutos >= limite) {
        alertas.push({ id: `sin-${p.guia}`, tipo: 'sin_eventos', guia: p.guia, fecha: ult.fecha, minutos, repartidorId: p.repartidorId });
      }
    }
    if (p.estado === 'excepcion' && ult.tipo === 'excepcion' && new Date(ult.fecha) >= hoy) {
      alertas.push({ id: `exc-${ult.id}`, tipo: 'excepcion', guia: p.guia, fecha: ult.fecha, motivo: ult.datos.motivo, repartidorId: ult.repartidorId });
    }
    const incidente = eventosDe(p.guia).filter((e) => e.tipo === 'incidente').pop();
    if (incidente && p.estado !== 'entregado' && new Date(incidente.fecha) >= hoy) {
      alertas.push({ id: `inc-${incidente.id}`, tipo: 'incidente', guia: p.guia, fecha: incidente.fecha, problema: incidente.datos.tipo, repartidorId: incidente.repartidorId });
    }
  }

  return alertas
    .map((a) => ({ ...a, revisada: db.alertasRevisadas.has(a.id) }))
    .sort((a, b) => ORDEN[a.tipo] - ORDEN[b.tipo] || new Date(b.fecha) - new Date(a.fecha));
}
const ORDEN = { sin_eventos: 0, excepcion: 1, incidente: 2 };

export default db;
