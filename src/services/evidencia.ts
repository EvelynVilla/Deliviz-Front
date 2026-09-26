// Prepara los archivos de evidencia antes de meterlos a la cola:
//  - Fotos: se comprimen (lado mayor 1600 px, JPEG 0.7 → normalmente < 1 MB, siempre < 2 MB
//    como promete la pantalla 17) y se copian a documentos para que el sistema no las borre.
//  - Firma: llega como data URL PNG desde react-native-signature-canvas y se guarda como .png.
import { randomUUID } from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export interface ArchivoEvidencia {
  uri: string;
  bytes: number;
}

const LADO_MAX = 1600;

const carpeta = () => {
  const dir = new Directory(Paths.document, 'deliviz', 'evidencia');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
};

export async function prepararFoto(uri: string, ancho?: number, alto?: number): Promise<ArchivoEvidencia> {
  let origen = uri;
  try {
    const vertical = (alto ?? 0) > (ancho ?? 0);
    const mayor = Math.max(ancho ?? 0, alto ?? 0);
    const contexto = ImageManipulator.manipulate(uri);
    if (!mayor || mayor > LADO_MAX) contexto.resize(vertical ? { height: LADO_MAX } : { width: LADO_MAX });
    const imagen = await contexto.renderAsync();
    const resultado = await imagen.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
    origen = resultado.uri;
  } catch (e) {
    // Si falla la compresión se sube la original: es mejor que perder la evidencia.
    console.warn('[evidencia] No se pudo comprimir la foto, se usa la original', e);
  }
  const destino = new File(carpeta(), `${randomUUID()}.jpg`);
  new File(origen).copySync(destino);
  return { uri: destino.uri, bytes: destino.size ?? 0 };
}

export function guardarFirma(dataUrl: string): ArchivoEvidencia {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  const destino = new File(carpeta(), `${randomUUID()}.png`);
  destino.create();
  destino.write(base64, { encoding: 'base64' });
  return { uri: destino.uri, bytes: destino.size ?? 0 };
}

export function borrarArchivos(uris: string[]): void {
  for (const uri of uris) {
    try {
      const f = new File(uri);
      if (f.exists) f.delete();
    } catch {
      // ya no existía
    }
  }
}
