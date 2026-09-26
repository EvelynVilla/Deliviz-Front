// Pantalla 12 · Foto de entrega (paso 1 de 3)
// Solo cámara (sin galería), con guía de encuadre y GPS. Después de tomarla se revisa
// y se puede repetir antes de pasar a la firma.
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, RotateCcw } from 'lucide-react-native';
import Boton from '../components/Boton';
import CapturaFoto from '../components/CapturaFoto';
import Etiqueta from '../components/Etiqueta';
import Texto from '../components/Texto';
import { usePaquete, type FotoCapturada } from '../context/AppContext';
import type { PantallaProps } from '../navigation/types';
import { useUbicacion } from '../services/ubicacion';
import { colores } from '../theme';
import { hora } from '../utils/formato';
import { textoDistancia } from './LlegadaDomicilioScreen';

export default function FotoEntregaScreen({ route, navigation }: PantallaProps<'FotoEntrega'>) {
  const { guia } = route.params;
  const p = usePaquete(guia);
  const { listo, distanciaA } = useUbicacion();
  const [foto, setFoto] = useState<FotoCapturada | null>(null);
  const insets = useSafeAreaInsets();

  const distancia = p ? distanciaA(p) : null;
  const textoGps = !listo ? 'Buscando GPS…' : distancia != null ? `GPS a ${textoDistancia(distancia)} del domicilio` : 'GPS listo, ubicación activa';

  if (!foto) {
    return (
      <CapturaFoto
        titulo="Paso 1 de 3"
        contexto={`Entrega, ${guia}`}
        instruccion="Que se vea el paquete y el lugar donde lo dejas: puerta, recepción o mostrador."
        textoGps={textoGps}
        gpsListo={listo}
        onCerrar={() => navigation.goBack()}
        onCapturar={setFoto}
      />
    );
  }

  return (
    <View style={styles.fondo}>
      <StatusBar style="light" />
      <Image source={{ uri: foto.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={[styles.superior, { paddingTop: insets.top + 12 }]}>
        <Texto peso="bold" tam={12} color="#fff">Paso 1 de 3</Texto>
        <Etiqueta texto={`Entrega, ${guia} · ${hora(foto.fecha)}`} tono="oscuro" tam={11.5} style={{ alignSelf: 'center', marginTop: 8, paddingHorizontal: 10, paddingVertical: 5 }} />
      </View>
      <View style={[styles.inferior, { paddingBottom: insets.bottom + 16 }]}>
        <Texto peso="semibold" tam={14} color="#fff" centro style={{ marginBottom: 14 }}>
          ¿Se ve bien el paquete y el lugar donde lo dejas?
        </Texto>
        <View style={{ flexDirection: 'row' }}>
          <Boton titulo="Repetir foto" icono={RotateCcw} variante="secundario" style={{ flex: 1, marginRight: 10 }} onPress={() => setFoto(null)} />
          <Boton titulo="Usar esta foto" icono={Check} style={{ flex: 1 }} onPress={() => navigation.navigate('FirmaReceptor', { guia, foto })} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colores.camaraFondo },
  superior: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', paddingBottom: 14, backgroundColor: 'rgba(11,18,32,0.45)' },
  inferior: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 18, paddingTop: 16, backgroundColor: 'rgba(11,18,32,0.7)' },
});
