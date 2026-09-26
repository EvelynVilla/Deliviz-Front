// Implementación real contra la API .NET (ver docs/api-contrato.md).
import { File, UploadType } from 'expo-file-system';
import { ErrorApi, pedir } from './http';
import type {
  ClienteApi,
  EventoDetalle,
  EventoEntrada,
  EventoSalida,
  HistorialConDatos,
  LoginEntrada,
  LoginSalida,
  PaqueteAsignadoConDatos,
  SasEntrada,
  SasSalida,
} from './tipos';

export const apiReal: ClienteApi = {
  // POST /api/auth/login (sin autenticación)
  login: (entrada: LoginEntrada) => pedir<LoginSalida>('/api/auth/login', { metodo: 'POST', cuerpo: entrada, publico: true }),

  // POST /api/eventos -> 201 (nuevo) o 200 con yaExistia=true (reenvío del mismo id)
  registrarEvento: (evento: EventoEntrada) => pedir<EventoSalida>('/api/eventos', { metodo: 'POST', cuerpo: evento }),

  // GET /api/eventos/{id}
  obtenerEvento: (id: string) => pedir<EventoDetalle>(`/api/eventos/${encodeURIComponent(id)}`),

  // POST /api/fotos/sas -> URL temporal (15 min) para subir UN archivo al contenedor "entrante"
  pedirSas: (entrada: SasEntrada) => pedir<SasSalida>('/api/fotos/sas', { metodo: 'POST', cuerpo: entrada }),

  // PUT <uploadUrl> directo a Azure Blob (no pasa por la API .NET)
  async subirArchivo(uploadUrl, archivoUri, mime, onProgreso) {
    const archivo = new File(archivoUri);
    if (!archivo.exists) {
      throw new ErrorApi('La foto ya no está en el teléfono.', 0, 'datos');
    }
    let resultado;
    try {
      resultado = await archivo.upload(uploadUrl, {
        httpMethod: 'PUT',
        uploadType: UploadType.BINARY_CONTENT,
        headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': mime },
        mimeType: mime,
        onProgress: onProgreso ? ({ bytesSent, totalBytes }) => totalBytes > 0 && onProgreso(bytesSent / totalBytes) : undefined,
      });
    } catch {
      throw new ErrorApi('Se cortó la subida de la foto.', 0, 'red');
    }
    if (resultado.status < 200 || resultado.status >= 300) {
      // 403 suele ser un SAS vencido: la cola pedirá uno nuevo y reutilizará el mismo archivo.
      throw new ErrorApi(`Azure rechazó la subida (${resultado.status}).`, resultado.status, 'servidor');
    }
  },

  // GET /api/repartidor/paquetes -> solo los que están en_ruta con este repartidor
  paquetesAsignados: () => pedir<PaqueteAsignadoConDatos[]>('/api/repartidor/paquetes'),

  // GET /api/paquetes/{guia}/historial
  historial: (guia: string) => pedir<HistorialConDatos>(`/api/paquetes/${encodeURIComponent(guia)}/historial`),
};
