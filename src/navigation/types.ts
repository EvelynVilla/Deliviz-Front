// Rutas de la app y los parámetros que recibe cada una.
// Las pantallas .tsx lo usan para tener navigate()/route.params tipados; las pantallas .js
// siguen funcionando igual (para ellas navigation/route son `any`).
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DatosDestinatario, RelacionReceptor } from '../api/tipos';
import type { FotoCapturada } from '../context/AppContext';
import type { Ubicacion } from '../services/ubicacion';

export type TabsParamList = {
  Ruta: { pestana?: 'por_recoger' | 'en_ruta' | 'entregados'; t?: number } | undefined;
  Escanear: undefined;
  Historial: undefined;
  Perfil: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Main: NavigatorScreenParams<TabsParamList> | undefined;

  // 1 a 10 (Sayuri, JS)
  DetallePaquete: { guia: string };
  EscanearGuia: { guiaEsperada?: string; modo?: 'llegada' | 'transferencia' } | undefined;
  FotoLlegada: { guia: string; datos?: DatosDestinatario | null };
  EstadoPaquete: { guia: string; foto: FotoCapturada; lugar: string; datos?: DatosDestinatario | null };
  SalidaRuta: undefined;
  RutaEnCurso: undefined;
  Transferir: { guia: string };
  ReportarProblema: { guia: string };

  // 9 · lado de quien recibe (TS, nuevo: así lo pide el contrato)
  RecibirTransferencia: { guia: string; datos?: DatosDestinatario | null; de?: string };

  // 11 a 17 (TS)
  LlegadaDomicilio: { guia: string };
  FotoEntrega: { guia: string };
  FirmaReceptor: { guia: string; foto: FotoCapturada };
  ConfirmarEntrega: {
    guia: string;
    foto: FotoCapturada;
    firmaDataUrl: string;
    nombreReceptor: string;
    relacionReceptor: RelacionReceptor;
    fechaCaptura: string;
    ubicacion: Ubicacion | null;
  };
  EntregaCompletada: { guia: string; eventoId: string; nombreReceptor: string; fechaCaptura: string };
  NoPudeEntregar: { guia: string };
  PendientesSubir: undefined;
};

export type PantallaProps<R extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, R>;

// Permite usar useNavigation() sin genéricos en las pantallas TS.
declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
