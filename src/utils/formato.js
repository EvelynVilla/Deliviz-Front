const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const dos = (n) => String(n).padStart(2, '0');

// "Domingo 20 de septiembre"
export function fechaLarga(d = new Date()) {
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

// "08:12"
export function hora(d) {
  const f = new Date(d);
  return `${dos(f.getHours())}:${dos(f.getMinutes())}`;
}

// "20 sep 2026, 08:12:37"
export function fechaHoraCompleta(d) {
  const f = new Date(d);
  return `${f.getDate()} ${MESES_CORTOS[f.getMonth()]} ${f.getFullYear()}, ${dos(f.getHours())}:${dos(f.getMinutes())}:${dos(f.getSeconds())}`;
}

export function iniciales(nombre = '') {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

// Distancia en metros entre dos coordenadas (fórmula de haversine).
export function distanciaMetros(a, b) {
  const R = 6371000;
  const rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// "8 min, 2.4 km". Estimación simple a 18 km/h promedio en ciudad.
export function tiempoYDistancia(metros) {
  const km = metros / 1000;
  const min = Math.max(1, Math.round((km / 18) * 60));
  const dist = km < 1 ? `${Math.round(metros)} m` : `${km.toFixed(1)} km`;
  return `${min} min, ${dist}`;
}
