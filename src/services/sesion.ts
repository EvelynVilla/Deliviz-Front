// Guarda el token en el almacenamiento seguro del teléfono (Keychain / Keystore)
// para que la cola pueda seguir subiendo evidencia después de cerrar y abrir la app.
import * as SecureStore from 'expo-secure-store';
import type { LoginSalida } from '../api/tipos';

const CLAVE = 'deliviz.sesion';

export async function guardarSesion(s: LoginSalida): Promise<void> {
  try {
    await SecureStore.setItemAsync(CLAVE, JSON.stringify(s));
  } catch (e) {
    console.warn('[sesion] No se pudo guardar la sesión', e);
  }
}

/** Devuelve la sesión guardada si todavía no expira. */
export async function leerSesion(): Promise<LoginSalida | null> {
  try {
    const texto = await SecureStore.getItemAsync(CLAVE);
    if (!texto) return null;
    const s = JSON.parse(texto) as LoginSalida;
    // Un minuto de margen para no mandar un token a punto de vencer.
    if (!s.token || new Date(s.expiraEn).getTime() - 60_000 < Date.now()) {
      await borrarSesion();
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export async function borrarSesion(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(CLAVE);
  } catch {
    // nada que hacer
  }
}
