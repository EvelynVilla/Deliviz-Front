// Persistencia local en JSON (carpeta de documentos de la app, sobrevive a reinicios).
// Guarda la cola de subida y los paquetes que el repartidor registró hoy, porque la API
// solo devuelve los que están "en_ruta" y la app necesita recordar el resto.
import { Directory, File, Paths } from 'expo-file-system';

const carpeta = () => {
  const dir = new Directory(Paths.document, 'deliviz');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
};

export function leerJson<T>(nombre: string, porDefecto: T): T {
  try {
    const archivo = new File(carpeta(), nombre);
    if (!archivo.exists) return porDefecto;
    return JSON.parse(archivo.textSync()) as T;
  } catch (e) {
    console.warn(`[almacen] No se pudo leer ${nombre}`, e);
    return porDefecto;
  }
}

export function escribirJson(nombre: string, datos: unknown): void {
  try {
    const archivo = new File(carpeta(), nombre);
    if (!archivo.exists) archivo.create({ intermediates: true });
    archivo.write(JSON.stringify(datos));
  } catch (e) {
    console.warn(`[almacen] No se pudo guardar ${nombre}`, e);
  }
}

export function borrarJson(nombre: string): void {
  try {
    const archivo = new File(carpeta(), nombre);
    if (archivo.exists) archivo.delete();
  } catch {
    // nada que hacer
  }
}
