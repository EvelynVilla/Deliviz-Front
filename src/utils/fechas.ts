const dos = (n: number) => String(Math.abs(n)).padStart(2, '0');

/**
 * ISO 8601 con la zona horaria local del teléfono, como pide el contrato.
 * Ej. 2026-09-22T12:30:00-06:00 (no "Z", para que quede registrada la hora local de captura).
 */
export function isoConZona(fecha: Date | string = new Date()): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
  const offsetMin = -d.getTimezoneOffset();
  const signo = offsetMin >= 0 ? '+' : '-';
  const zona = `${signo}${dos(Math.floor(Math.abs(offsetMin) / 60))}:${dos(Math.abs(offsetMin) % 60)}`;
  return (
    `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}` +
    `T${dos(d.getHours())}:${dos(d.getMinutes())}:${dos(d.getSeconds())}${zona}`
  );
}

/** "2026-09-25" en hora local, para saber si los datos guardados son de hoy. */
export function diaLocal(d = new Date()): string {
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

/** "1.4 MB" / "860 KB" */
export function tamanoLegible(bytes: number): string {
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
