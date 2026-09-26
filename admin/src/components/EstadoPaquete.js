import { Check } from 'lucide-react-native';
import Etiqueta from './Etiqueta';

export const ESTADOS = {
  por_recoger: { texto: 'Por recoger', tono: 'gris' },
  en_bodega: { texto: 'En bodega', tono: 'azul' },
  en_ruta: { texto: 'En ruta', tono: 'azul' },
  en_transferencia: { texto: 'En transferencia', tono: 'ambar' },
  entregado: { texto: 'Entregado', tono: 'verde' },
  excepcion: { texto: 'No entregado', tono: 'rojo' },
};

export default function EstadoPaquete({ estado, tam = 11.5, style }) {
  const e = ESTADOS[estado] ?? { texto: estado, tono: 'gris' };
  return <Etiqueta texto={e.texto} tono={e.tono} icono={estado === 'entregado' ? Check : undefined} tam={tam} style={style} />;
}
