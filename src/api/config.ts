// Configuración de la conexión con la API .NET.
//
// Se controla con variables de entorno de Expo (archivo .env en la raíz de mobile/):
//   EXPO_PUBLIC_API_URL    URL base SIN /api al final. Ej. http://192.168.1.50:5080
//   EXPO_PUBLIC_USAR_MOCK  "true" para usar la API simulada, "false" para la real.
//
// Si no hay EXPO_PUBLIC_API_URL, la app arranca con la API simulada para que se pueda
// probar sin backend. Recuerda: en un teléfono físico "localhost" es el propio teléfono;
// usa la IP de tu computadora en la red local (y en el emulador de Android, 10.0.2.2).

const urlEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
const mockEnv = process.env.EXPO_PUBLIC_USAR_MOCK?.trim().toLowerCase();

export const API_URL = (urlEnv || 'http://localhost:5080').replace(/\/+$/, '').replace(/\/api$/, '');

export const USAR_MOCK = mockEnv ? mockEnv === 'true' : !urlEnv;

/** Tiempo máximo de espera para las llamadas JSON a la API. */
export const TIMEOUT_MS = 15000;
