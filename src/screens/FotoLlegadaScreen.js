// Pantalla 5 · Foto de llegada
import CapturaFoto from '../components/CapturaFoto';
import { useUbicacion } from '../services/ubicacion';

export default function FotoLlegadaScreen({ route, navigation }) {
  const { guia, datos } = route.params;
  const { ubicacion, listo } = useUbicacion();

  return (
    <CapturaFoto
      contexto={`Llegada a bodega, ${guia}`}
      instruccion="Encuadra el paquete completo y deja la guía a la vista."
      textoGps={listo ? `GPS listo, ${ubicacion.lugar ?? 'ubicación activa'}` : 'Buscando GPS…'}
      gpsListo={listo}
      onCerrar={() => navigation.goBack()}
      onCapturar={(foto) => navigation.navigate('EstadoPaquete', { guia, foto, datos, lugar: ubicacion?.lugar ?? 'Sin GPS' })}
    />
  );
}
