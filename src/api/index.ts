// Punto único de acceso a la API. Las pantallas y el contexto importan `api` de aquí
// y no saben si hablan con la API .NET real o con la simulada.
import { USAR_MOCK } from './config';
import { apiReal } from './deliviz';
import { apiMock } from './mock';
import type { ClienteApi } from './tipos';

export const api: ClienteApi = USAR_MOCK ? apiMock : apiReal;

export { API_URL, USAR_MOCK } from './config';
export { ErrorApi, esErrorDeRed, ponerToken, registrarAlVencerSesion } from './http';
export type * from './tipos';
