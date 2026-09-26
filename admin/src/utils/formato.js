const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DIAS_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

const dos = (n) => String(n).padStart(2, '0');

export const hora = (d) => { const f = new Date(d); return `${dos(f.getHours())}:${dos(f.getMinutes())}`; };

// "20 sep 2026, 13:05:18"
export const fechaHoraCompleta = (d) => {
  const f = new Date(d);
  return `${f.getDate()} ${MESES_CORTOS[f.getMonth()]} ${f.getFullYear()}, ${dos(f.getHours())}:${dos(f.getMinutes())}:${dos(f.getSeconds())}`;
};

// "20 sep"
export const fechaCorta = (d) => { const f = new Date(d); return `${f.getDate()} ${MESES_CORTOS[f.getMonth()]}`; };

// "20 de septiembre de 2026"
export const fechaLarga = (d) => { const f = new Date(d); return `${f.getDate()} de ${MESES[f.getMonth()]} de ${f.getFullYear()}`; };

export const diaSemanaCorto = (d) => DIAS_CORTOS[new Date(d).getDay()];

export const esHoy = (d) => new Date(d).toDateString() === new Date().toDateString();

// "Hoy, 13:05" | "Ayer, 18:20" | "12 sep, 10:02"
export const cuando = (d) => {
  const f = new Date(d);
  const ayer = new Date(); ayer.setDate(ayer.getDate() - 1);
  if (esHoy(f)) return `Hoy, ${hora(f)}`;
  if (f.toDateString() === ayer.toDateString()) return `Ayer, ${hora(f)}`;
  return `${fechaCorta(f)}, ${hora(f)}`;
};

// 380 -> "6 h 20 min"
export const duracion = (minutos) => {
  const m = Math.round(minutos);
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r} min`;
  return r ? `${h} h ${r} min` : `${h} h`;
};

export const iniciales = (nombre = '') => {
  const partes = nombre.split(' ').filter(Boolean);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return partes.slice(0, 2).map((p) => p[0].toUpperCase()).join('');
};

export const coordenadas = (lat, lng) => `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

export const porcentaje = (x, dec = 1) => `${(x * 100).toFixed(dec)}%`;

export const inicioDelDia = (d) => { const f = new Date(d); f.setHours(0, 0, 0, 0); return f; };
