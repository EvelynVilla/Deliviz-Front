import { useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, X, Zap, ZapOff } from 'lucide-react-native';
import { colores } from '../theme';
import Boton from './Boton';
import MarcoEncuadre from './MarcoEncuadre';
import Texto from './Texto';

/**
 * Captura de foto de evidencia. Componente común que usan Sayuri (pantallas 5, 9 y 10)
 * y Evelyn (pantallas 12 y 16).
 *
 * Reglas de los mockups:
 *  - Solo cámara, nunca galería (no hay botón para elegir archivo).
 *  - Guía de encuadre y ubicación visibles.
 *  - Una sola foto por evento: si sale borrosa, la pantalla que la usa ofrece "Repetir foto",
 *    y la nueva reemplaza a la anterior.
 *
 * @param {{ contexto: string, instruccion: string, titulo?: string, textoGps?: string, gpsListo?: boolean,
 *   onCapturar: (foto: {uri: string, ancho: number, alto: number, fecha: string}) => void, onCerrar: () => void }} props
 */
export default function CapturaFoto({ contexto, instruccion, titulo, textoGps = 'Buscando GPS…', gpsListo = false, onCapturar, onCerrar }) {
  const [permiso, pedirPermiso] = useCameraPermissions();
  const camara = useRef(null);
  const [lista, setLista] = useState(false);
  const [flash, setFlash] = useState(false);
  const [zoom2x, setZoom2x] = useState(false);
  const [tomando, setTomando] = useState(false);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const tomar = async () => {
    if (!camara.current || tomando || !lista) return;
    setTomando(true);
    try {
      const f = await camara.current.takePictureAsync({ quality: 0.7, exif: false });
      onCapturar({ uri: f.uri, ancho: f.width, alto: f.height, fecha: new Date().toISOString() });
    } finally {
      setTomando(false);
    }
  };

  if (!permiso) {
    return <View style={[styles.fondo, styles.centro]}><ActivityIndicator color="#fff" /></View>;
  }

  if (!permiso.granted) {
    return (
      <View style={[styles.fondo, styles.centro, { paddingHorizontal: 32 }]}>
        <StatusBar style="light" />
        <Pressable onPress={onCerrar} style={[styles.botonRedondo, { position: 'absolute', top: insets.top + 8, left: 16 }]} accessibilityLabel="Cerrar">
          <X size={20} color="#fff" strokeWidth={2.4} />
        </Pressable>
        <View style={styles.iconoPermiso}><Camera size={28} color={colores.blanco} strokeWidth={2} /></View>
        <Texto peso="bold" tam={19} color="#fff" centro style={{ marginTop: 18 }}>Activa la cámara</Texto>
        <Texto tam={14} color="#C9D3E4" centro style={{ marginTop: 6, marginBottom: 22 }}>
          La evidencia se toma en el momento con la cámara del teléfono. No se pueden subir fotos de la galería.
        </Texto>
        {permiso.canAskAgain ? (
          <Boton titulo="Permitir cámara" onPress={pedirPermiso} style={{ alignSelf: 'stretch' }} />
        ) : (
          <Boton titulo="Abrir ajustes del teléfono" onPress={() => Linking.openSettings()} style={{ alignSelf: 'stretch' }} />
        )}
      </View>
    );
  }

  const lado = Math.min(width * 0.68, 290);

  return (
    <View style={styles.fondo}>
      <StatusBar style="light" />
      <CameraView
        ref={camara}
        style={StyleSheet.absoluteFill}
        facing="back"
        flash={flash ? 'on' : 'off'}
        zoom={zoom2x ? 0.12 : 0}
        animateShutter
        onCameraReady={() => setLista(true)}
      />

      {/* Barra superior */}
      <View style={[styles.barraSup, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={onCerrar} style={styles.botonRedondo} hitSlop={6} accessibilityLabel="Cerrar cámara">
          <X size={19} color="#fff" strokeWidth={2.4} />
        </Pressable>
        <Texto peso="bold" tam={12} color="#fff">{titulo ?? ''}</Texto>
        <Pressable onPress={() => setFlash((f) => !f)} style={styles.botonRedondo} hitSlop={6} accessibilityLabel={flash ? 'Apagar flash' : 'Encender flash'}>
          {flash ? <Zap size={18} color="#FFD34D" fill="#FFD34D" strokeWidth={2.2} /> : <ZapOff size={18} color="#fff" strokeWidth={2.2} />}
        </Pressable>
      </View>

      {/* Indicaciones */}
      <View style={styles.indicaciones} pointerEvents="none">
        <View style={styles.chipAzul}>
          <Camera size={12} color="#fff" strokeWidth={2.4} style={{ marginRight: 5 }} />
          <Texto peso="bold" tam={11.5} color="#fff" alto={15}>Foto obligatoria</Texto>
        </View>
        <View style={styles.chipOscuro}>
          <Texto peso="semibold" tam={12} color="#fff" alto={16}>{contexto}</Texto>
        </View>
        <Texto peso="semibold" tam={14} color="#fff" centro style={styles.instruccion}>{instruccion}</Texto>
      </View>

      {/* Guía de encuadre */}
      <View style={styles.centroAbs} pointerEvents="none">
        <MarcoEncuadre ancho={lado} alto={lado} largo={34} grosor={3} radio={10} />
      </View>

      {/* Parte inferior */}
      <View style={[styles.barraInf, { paddingBottom: insets.bottom + 18 }]}>
        <View style={styles.gps}>
          <View style={[styles.puntoGps, { backgroundColor: gpsListo ? colores.verdeEscaneo : '#F5B546' }]} />
          <Texto peso="semibold" tam={12.5} color="#fff">{textoGps}</Texto>
        </View>
        <View style={styles.filaDisparo}>
          <View style={{ width: 44 }} />
          <Pressable
            onPress={tomar}
            disabled={!lista || tomando}
            accessibilityRole="button"
            accessibilityLabel="Tomar foto"
            style={({ pressed }) => [styles.disparador, pressed && { transform: [{ scale: 0.94 }] }]}
          >
            {tomando ? <ActivityIndicator color={colores.tinta} /> : <View style={styles.disparadorInterior} />}
          </Pressable>
          <Pressable onPress={() => setZoom2x((z) => !z)} style={styles.zoom} accessibilityLabel="Cambiar zoom">
            <Texto peso="bold" tam={12} color="#fff">{zoom2x ? '2×' : '1×'}</Texto>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colores.camaraFondo },
  centro: { alignItems: 'center', justifyContent: 'center' },
  barraSup: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  botonRedondo: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(11,18,32,0.55)', alignItems: 'center', justifyContent: 'center' },
  indicaciones: { position: 'absolute', top: 104, left: 24, right: 24, alignItems: 'center' },
  chipAzul: { flexDirection: 'row', alignItems: 'center', backgroundColor: colores.primario, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  chipOscuro: { marginTop: 8, backgroundColor: colores.camaraChip, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  instruccion: { marginTop: 10, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } },
  centroAbs: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  barraInf: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 16, backgroundColor: 'rgba(11,18,32,0.35)', alignItems: 'center' },
  gps: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  puntoGps: { width: 8, height: 8, borderRadius: 4, marginRight: 7 },
  filaDisparo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch', paddingHorizontal: 34 },
  disparador: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  disparadorInterior: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },
  zoom: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(11,18,32,0.6)', alignItems: 'center', justifyContent: 'center' },
  iconoPermiso: { width: 64, height: 64, borderRadius: 20, backgroundColor: colores.primario, alignItems: 'center', justifyContent: 'center' },
});
