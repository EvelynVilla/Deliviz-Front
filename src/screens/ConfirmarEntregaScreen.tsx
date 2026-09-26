// Pantalla 14 · Confirmar entrega (paso 3 de 3)
// Resumen con foto, firma, receptor, hora y ubicación antes de marcar el paquete como entregado.
// Al confirmar, el evento "entrega" (foto + firma) se guarda en el teléfono y entra a la cola.
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Camera, Check } from 'lucide-react-native';
import Boton from '../components/Boton';
import Encabezado from '../components/Encabezado';
import { Contenido, Pantalla, Pie } from '../components/Estructura';
import Etiqueta from '../components/Etiqueta';
import TablaDatos from '../components/TablaDatos';
import Texto from '../components/Texto';
import { useApp, usePaquete } from '../context/AppContext';
import { textoRelacion } from '../modelo';
import type { PantallaProps } from '../navigation/types';
import { colores, radios } from '../theme';
import { distanciaMetros, fechaHoraCompleta } from '../utils/formato';
import { METROS_EN_DOMICILIO, textoDistancia } from './LlegadaDomicilioScreen';

export default function ConfirmarEntregaScreen({ route, navigation }: PantallaProps<'ConfirmarEntrega'>) {
  const { guia, foto, firmaDataUrl, nombreReceptor, relacionReceptor, fechaCaptura, ubicacion } = route.params;
  const p = usePaquete(guia);
  const { registrarEntrega, avisar } = useApp();
  const [enviando, setEnviando] = useState(false);

  const textoUbicacion = (() => {
    if (!ubicacion) return 'Sin GPS al firmar';
    if (p?.lat != null && p?.lng != null) {
      const m = distanciaMetros(ubicacion, { lat: p.lat, lng: p.lng });
      return m <= METROS_EN_DOMICILIO ? `Domicilio, a ${textoDistancia(m)}` : `A ${textoDistancia(m)} del domicilio`;
    }
    return `${ubicacion.lat.toFixed(5)}, ${ubicacion.lng.toFixed(5)}`;
  })();

  const confirmar = async () => {
    setEnviando(true);
    try {
      const eventoId = await registrarEntrega({ guia, foto, firmaDataUrl, nombreReceptor, relacionReceptor, fechaCaptura, ubicacion });
      // reset: desde la pantalla 15 no se debe poder regresar a la entrega ya confirmada.
      navigation.reset({
        index: 1,
        routes: [{ name: 'Main' }, { name: 'EntregaCompletada', params: { guia, eventoId, nombreReceptor, fechaCaptura } }],
      });
    } catch (e) {
      console.warn('[entrega]', e);
      avisar('No se pudo guardar la evidencia en el teléfono. Inténtalo de nuevo.', 'alerta');
      setEnviando(false);
    }
  };

  return (
    <Pantalla>
      <StatusBar style="dark" />
      <Encabezado titulo="Confirmar entrega" subtitulo="Paso 3 de 3" />
      <Contenido>
        <View style={styles.foto}>
          <Image source={{ uri: foto.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <Etiqueta texto="Foto de entrega" tono="azulLleno" icono={Camera} style={{ margin: 10 }} />
        </View>

        <View style={styles.fila}>
          <View style={[styles.caja, { marginRight: 8 }]}>
            <Image source={{ uri: firmaDataUrl }} style={styles.firma} resizeMode="contain" />
            <Texto tam={11.5} color={colores.textoSec}>Firma del receptor</Texto>
          </View>
          <View style={[styles.caja, { justifyContent: 'center' }]}>
            <Texto tam={11.5} color={colores.textoSec}>Recibió</Texto>
            <Texto peso="bold" tam={14.5}>{nombreReceptor}</Texto>
            <Etiqueta texto={textoRelacion(relacionReceptor)} tono="gris" style={{ marginTop: 5 }} />
          </View>
        </View>

        <View style={{ marginTop: 10 }}>
          <TablaDatos
            filas={[
              ['Guía', guia],
              ['Fecha y hora', fechaHoraCompleta(fechaCaptura)],
              ['Ubicación', textoUbicacion],
            ]}
            nota="Hora y ubicación no se pueden editar."
          />
        </View>

        <View style={styles.checks}>
          {['Foto', 'Firma', 'Datos del receptor'].map((t) => <Etiqueta key={t} texto={t} tono="verde" icono={Check} style={{ marginRight: 6, marginBottom: 6 }} />)}
        </View>
        <Texto tam={12.5} color={colores.textoSec}>Revisa que todo esté completo antes de ir a la siguiente parada.</Texto>
      </Contenido>
      <Pie>
        <Boton icono={Check} titulo="Confirmar entrega" onPress={confirmar} cargando={enviando} />
        <Boton titulo="Corregir" variante="secundario" alto={46} tamTexto={14.5} deshabilitado={enviando} onPress={() => navigation.goBack()} style={{ marginTop: 8 }} />
      </Pie>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  foto: { height: 190, borderRadius: radios.tarjeta, overflow: 'hidden', backgroundColor: colores.gris },
  fila: { flexDirection: 'row', marginTop: 10 },
  caja: { flex: 1, backgroundColor: colores.blanco, borderRadius: radios.tarjeta, borderWidth: 1, borderColor: colores.borde, padding: 11, minHeight: 96 },
  firma: { height: 52, width: '100%', marginBottom: 4 },
  checks: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, marginBottom: 4 },
});
