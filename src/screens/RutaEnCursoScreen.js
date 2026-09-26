// Pantalla 8 · Ruta en curso (mapa y siguiente parada)
import { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeftRight, ChevronLeft, LocateFixed, Navigation, Package, TriangleAlert, Truck } from 'lucide-react-native';
import Aviso from '../components/Aviso';
import Boton from '../components/Boton';
import Etiqueta from '../components/Etiqueta';
import estiloMapa from '../components/estiloMapa';
import Texto from '../components/Texto';
import { useResumenRuta } from '../context/AppContext';
import { useUbicacion } from '../services/ubicacion';
import { colores, sombraSuave } from '../theme';
import { tiempoYDistancia } from '../utils/formato';
import { direccionCompleta, nombreDestinatario } from '../modelo';

export default function RutaEnCursoScreen({ navigation }) {
  const { enRuta, siguiente } = useResumenRuta();
  const { ubicacion, distanciaA } = useUbicacion();
  const mapa = useRef(null);
  const insets = useSafeAreaInsets();
  const [altoHoja, setAltoHoja] = useState(320);
  const [pintarMarcadores, setPintarMarcadores] = useState(true);

  // Los marcadores personalizados se dibujan una vez y luego se congelan (mejor rendimiento en Android).
  useEffect(() => {
    const t = setTimeout(() => setPintarMarcadores(false), 1200);
    return () => clearTimeout(t);
  }, [siguiente?.guia]);

  const conCoords = (p) => p?.lat != null && p?.lng != null;
  const otrasParadas = enRuta.filter((p) => p.estado === 'en_ruta' && p.guia !== siguiente?.guia && conCoords(p));
  const siguienteEnMapa = conCoords(siguiente) ? siguiente : null;

  // Trazo simple en "L" entre tu ubicación y la parada. La ruta real por calles
  // se obtiene al tocar "Navegar" (Google Maps).
  const trazo = useMemo(() => {
    if (!ubicacion || !siguienteEnMapa) return [];
    const a = { latitude: ubicacion.lat, longitude: ubicacion.lng };
    const b = { latitude: siguienteEnMapa.lat, longitude: siguienteEnMapa.lng };
    return [a, { latitude: b.latitude, longitude: a.longitude }, b];
  }, [ubicacion, siguienteEnMapa]);

  const centrar = () => {
    if (!mapa.current) return;
    const puntos = [
      ...(ubicacion ? [{ latitude: ubicacion.lat, longitude: ubicacion.lng }] : []),
      ...(siguienteEnMapa ? [{ latitude: siguienteEnMapa.lat, longitude: siguienteEnMapa.lng }] : []),
    ];
    if (puntos.length) {
      mapa.current.fitToCoordinates(puntos, { edgePadding: { top: insets.top + 110, right: 60, bottom: 60, left: 60 }, animated: true });
    }
  };

  useEffect(() => {
    const t = setTimeout(centrar, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ubicacion, siguiente?.guia, altoHoja]);

  const navegar = () => {
    const destino = siguienteEnMapa ? `${siguiente.lat},${siguiente.lng}` : encodeURIComponent(direccionCompleta(siguiente, true));
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destino}&travelmode=driving`;
    Linking.openURL(url);
  };

  const distancia = siguiente ? distanciaA(siguiente) : null;

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <StatusBar style="dark" />
      <MapView
        ref={mapa}
        style={StyleSheet.absoluteFill}
        customMapStyle={estiloMapa}
        mapPadding={{ top: 0, right: 0, bottom: altoHoja - 20, left: 0 }}
        showsPointsOfInterest={false}
        showsCompass={false}
        toolbarEnabled={false}
        initialRegion={{ latitude: 21.8818, longitude: -102.2916, latitudeDelta: 0.06, longitudeDelta: 0.06 }}
      >
        {trazo.length ? <Polyline coordinates={trazo} strokeColor={colores.primario} strokeWidth={5} lineJoin="round" lineCap="round" /> : null}

        {otrasParadas.map((p) => (
          <Marker key={p.guia} coordinate={{ latitude: p.lat, longitude: p.lng }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={pintarMarcadores} title={p.destinatario}>
            <View style={styles.parada} />
          </Marker>
        ))}

        {siguienteEnMapa ? (
          <Marker coordinate={{ latitude: siguienteEnMapa.lat, longitude: siguienteEnMapa.lng }} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={pintarMarcadores}>
            <View style={{ alignItems: 'center' }}>
              <View style={styles.pin}><Package size={18} color="#fff" strokeWidth={2.2} /></View>
              <View style={styles.pinPunta} />
            </View>
          </Marker>
        ) : null}

        {ubicacion ? (
          <Marker coordinate={{ latitude: ubicacion.lat, longitude: ubicacion.lng }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={pintarMarcadores}>
            <View style={styles.halo}><View style={styles.yo} /></View>
          </Marker>
        ) : null}
      </MapView>

      {/* Controles superiores */}
      <View style={[styles.superior, { top: insets.top + 8 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={() => navigation.goBack()} style={[styles.circulo, { marginRight: 8 }]} accessibilityLabel="Regresar">
            <ChevronLeft size={20} color={colores.tinta} strokeWidth={2.4} />
          </Pressable>
          <View style={styles.pastilla}>
            <Truck size={15} color={colores.primario} strokeWidth={2.2} style={{ marginRight: 7 }} />
            <Texto peso="bold" tam={13}>En ruta, {enRuta.filter((p) => p.estado === 'en_ruta').length} paquetes</Texto>
          </View>
        </View>
        <Pressable onPress={centrar} style={styles.circulo} accessibilityLabel="Centrar mapa">
          <LocateFixed size={19} color={colores.tinta} strokeWidth={2.2} />
        </Pressable>
      </View>

      {/* Hoja inferior */}
      <View style={[styles.hoja, { paddingBottom: insets.bottom + 12 }]} onLayout={(e) => setAltoHoja(e.nativeEvent.layout.height)}>
        <View style={styles.asa} />
        {siguiente ? (
          <>
            <View style={styles.filaSup}>
              <Etiqueta texto="Siguiente parada" tono="azul" />
              {distancia != null ? <Texto peso="bold" tam={13}>{tiempoYDistancia(distancia)}</Texto> : null}
            </View>
            <Texto peso="extrabold" tam={20} alto={26} style={{ marginTop: 8 }}>{nombreDestinatario(siguiente)}</Texto>
            <Texto tam={13} color={colores.textoSec}>{direccionCompleta(siguiente) || siguiente.guia}</Texto>

            <View style={[styles.fila, { marginTop: 14 }]}>
              <Boton icono={Navigation} titulo="Navegar" variante="secundario" style={{ flex: 1, marginRight: 10 }} onPress={navegar} deshabilitado={!siguienteEnMapa && !direccionCompleta(siguiente)} />
              <Boton titulo="Llegué" style={{ flex: 1 }} onPress={() => navigation.navigate('LlegadaDomicilio', { guia: siguiente.guia })} />
            </View>

            <Aviso tono="azul" titulo="Sin fotos mientras vas en camino." style={{ marginTop: 12 }}>
              Solo se piden si cambias de repartidor o pasa algo con el paquete.
            </Aviso>

            <View style={[styles.fila, { marginTop: 10 }]}>
              <Boton icono={ArrowLeftRight} titulo="Transferir" variante="secundario" alto={44} tamTexto={13.5} style={{ flex: 1, marginRight: 10 }} onPress={() => navigation.navigate('Transferir', { guia: siguiente.guia })} />
              <Boton icono={TriangleAlert} titulo="Reportar problema" variante="secundario" alto={44} tamTexto={13.5} style={{ flex: 1 }} onPress={() => navigation.navigate('ReportarProblema', { guia: siguiente.guia })} />
            </View>
          </>
        ) : (
          <View style={{ paddingVertical: 10 }}>
            <Texto peso="bold" tam={17}>No te quedan paradas en ruta</Texto>
            <Texto tam={13} color={colores.textoSec} style={{ marginTop: 3, marginBottom: 14 }}>Revisa tus entregas del día o regresa a bodega.</Texto>
            <Boton titulo="Ver mi ruta" onPress={() => navigation.navigate('Main', { screen: 'Ruta' })} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  superior: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pastilla: { flexDirection: 'row', alignItems: 'center', backgroundColor: colores.blanco, borderRadius: 999, paddingHorizontal: 14, height: 40, ...sombraSuave },
  circulo: { width: 42, height: 42, borderRadius: 21, backgroundColor: colores.blanco, alignItems: 'center', justifyContent: 'center', ...sombraSuave },
  hoja: {
    position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colores.blanco,
    borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 18, paddingTop: 8,
    shadowColor: '#0D1D3E', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: -4 }, elevation: 12,
  },
  asa: { alignSelf: 'center', width: 38, height: 5, borderRadius: 3, backgroundColor: colores.pista, marginBottom: 12 },
  filaSup: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fila: { flexDirection: 'row' },
  parada: { width: 16, height: 16, borderRadius: 8, borderWidth: 3, borderColor: colores.tinta, backgroundColor: colores.blanco },
  pin: { width: 40, height: 40, borderRadius: 20, backgroundColor: colores.tinta, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colores.tinta },
  pinPunta: {
    width: 0, height: 0, marginTop: -3, borderLeftWidth: 9, borderRightWidth: 9, borderTopWidth: 13,
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: colores.tinta,
  },
  halo: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(27,129,249,0.2)', alignItems: 'center', justifyContent: 'center' },
  yo: { width: 16, height: 16, borderRadius: 8, backgroundColor: colores.primario, borderWidth: 3, borderColor: '#fff', ...(Platform.OS === 'ios' ? sombraSuave : {}) },
});
