// Indicadores de negocio (P6). Son las mismas cuentas que hacen las consultas SQL de
// /backend/reportes/consultas.js; aquí se calculan sobre los datos de prueba para el panel.

const DIA = 24 * 60 * 60 * 1000;
const claveDia = (d) => { const f = new Date(d); return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`; };

/**
 * @param {{ paquetes: any[], eventos: any[], repartidores: any[] }} datos
 * @param {{ desde: Date, hasta: Date }} rango
 */
export function calcularIndicadores({ paquetes, eventos, repartidores }, { desde, hasta }) {
  const enRango = (e) => { const f = new Date(e.fecha); return f >= desde && f <= hasta; };
  const ev = eventos.filter(enRango);
  const entregas = ev.filter((e) => e.tipo === 'entrega');
  const excepciones = ev.filter((e) => e.tipo === 'excepcion');
  const incidentes = ev.filter((e) => e.tipo === 'incidente');

  // Todos los eventos por guía (para primer intento y tiempos)
  const porGuia = new Map();
  for (const e of eventos) {
    if (!porGuia.has(e.guia)) porGuia.set(e.guia, []);
    porGuia.get(e.guia).push(e);
  }

  // 1. Entregas por día (se incluyen los días sin entregas para que la gráfica no salte)
  const serieDias = [];
  const inicio = new Date(desde); inicio.setHours(0, 0, 0, 0);
  for (let t = inicio.getTime(); t <= hasta.getTime(); t += DIA) {
    const d = new Date(t);
    serieDias.push({ clave: claveDia(d), fecha: d, entregas: 0, excepciones: 0 });
  }
  const idxDia = new Map(serieDias.map((d, i) => [d.clave, i]));
  for (const e of entregas) { const i = idxDia.get(claveDia(e.fecha)); if (i != null) serieDias[i].entregas++; }
  for (const e of excepciones) { const i = idxDia.get(claveDia(e.fecha)); if (i != null) serieDias[i].excepciones++; }

  // 2. Por repartidor
  const porRepartidor = repartidores.map((r) => {
    const suyas = entregas.filter((e) => e.repartidorId === r.id);
    const exc = excepciones.filter((e) => e.repartidorId === r.id).length;
    const inc = incidentes.filter((e) => e.repartidorId === r.id).length;
    const primer = suyas.filter((e) => !(porGuia.get(e.guia) ?? []).some((x) => x.tipo === 'excepcion' && new Date(x.fecha) < new Date(e.fecha))).length;
    const horas = suyas.map((e) => horasDeBodegaAEntrega(porGuia.get(e.guia), e)).filter((h) => h != null);
    return {
      id: r.id, nombre: r.nombre, entregas: suyas.length, excepciones: exc, incidentes: inc,
      primerIntento: suyas.length ? primer / suyas.length : 0,
      horasPromedio: horas.length ? horas.reduce((s, h) => s + h, 0) / horas.length : null,
    };
  }).sort((a, b) => b.entregas - a.entregas);

  // 3. Porcentaje de entregas logradas al primer intento
  const primerIntento = entregas.filter((e) => !(porGuia.get(e.guia) ?? []).some((x) => x.tipo === 'excepcion' && new Date(x.fecha) < new Date(e.fecha))).length;

  // 4. Excepciones por motivo
  const motivos = contar(excepciones, (e) => e.datos.motivo);

  // 5. Incidentes por tipo
  const tiposIncidente = contar(incidentes, (e) => e.datos.tipo);

  // 6. Tiempo promedio de la llegada a bodega a la entrega
  const horas = entregas.map((e) => horasDeBodegaAEntrega(porGuia.get(e.guia), e)).filter((h) => h != null);
  const horasPromedio = horas.length ? horas.reduce((s, h) => s + h, 0) / horas.length : null;

  const paquetesEnRango = new Set(ev.map((e) => e.guia)).size;

  return {
    totales: {
      paquetes: paquetesEnRango,
      entregas: entregas.length,
      excepciones: excepciones.length,
      incidentes: incidentes.length,
      primerIntento: entregas.length ? primerIntento / entregas.length : 0,
      horasPromedio,
      entregasPorDia: serieDias.length ? entregas.length / serieDias.filter((d) => d.fecha.getDay() !== 0).length : 0,
    },
    serieDias,
    porRepartidor,
    motivos,
    tiposIncidente,
    enCurso: paquetes.filter((p) => ['en_ruta', 'en_bodega', 'en_transferencia'].includes(p.estado)).length,
  };
}

function horasDeBodegaAEntrega(lista = [], entrega) {
  const llegada = lista.find((x) => x.tipo === 'llegada_bodega');
  if (!llegada) return null;
  return (new Date(entrega.fecha) - new Date(llegada.fecha)) / 3600000;
}

function contar(lista, clave) {
  const m = new Map();
  for (const x of lista) m.set(clave(x), (m.get(clave(x)) ?? 0) + 1);
  return [...m.entries()].map(([etiqueta, valor]) => ({ etiqueta, valor })).sort((a, b) => b.valor - a.valor);
}
