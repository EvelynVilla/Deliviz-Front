// Pantalla 4 · Escanear guía
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Linking, Modal, Platform, Pressable, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeftRight, Camera, Check, TriangleAlert, Warehouse, X, Zap, ZapOff } from 'lucide-react-native';
import Boton from '../components/Boton';
import Etiqueta from '../components/Etiqueta';
import MarcoEncuadre from '../components/MarcoEncuadre';
import Texto from '../components/Texto';
import { api } from '../api';
import { useApp } from '../context/AppContext';
import { colores, fuentes, radios } from '../theme';

const normalizar = (t) => t.trim().toUpperCase().replace(/\s+/g, '');

export default function EscanearGuiaScreen({ navigation, route }) {
  const { paquetes } = useApp();
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [modo, setModo] = useState(route.params?.modo ?? 'llegada'); // 'llegada' | 'transferencia'
  const [linterna, setLinterna] = useState(false);
  const [detectado, setDetectado] = useState(null); // { guia, destinatario, ciudad, datos, nota }
  const [verificando, setVerificando] = useState(false);
  const [error, setError] = useState(null);
  const [manual, setManual] = useState(false);
  const bloqueado = useRef(false);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Valida la guía con las reglas del contrato antes de pedir la foto:
  //  - llegada_bodega: paquete nuevo (404), en_ruta o no_entregado.
  //  - transferencia: en_ruta con OTRO repartidor.
  const buscar = async (codigo) => {
    const guia = normalizar(codigo);
    if (guia.length < 4) return { error: 'Ese código no parece una guía de Deliviz.' };
    const local = paquetes.find((x) => x.guia === guia);
    const conLocal = (h) => ({
      guia,
      destinatario: h?.destinatario ?? local?.destinatario ?? null,
      ciudad: h?.ciudad ?? local?.ciudad ?? null,
      datos: h ?? null,
    });

    if (modo === 'llegada') {
      if (local?.estado === 'por_recoger') return { paquete: conLocal(null) };
      if (local?.estado === 'en_bodega') return { error: `${guia} ya tiene su llegada a bodega registrada.` };
      try {
        const h = await api.historial(guia);
        if (h.estado === 'en_bodega') return { error: `${guia} ya está en bodega.` };
        if (h.estado === 'entregado') return { error: `${guia} ya fue entregado.` };
        const nota = h.estado === 'en_ruta' ? 'Está en ruta: al registrarlo regresa a bodega.' : h.estado === 'no_entregado' ? 'No se pudo entregar: al registrarlo regresa a bodega.' : null;
        return { paquete: { ...conLocal(h), nota } };
      } catch (e) {
        if (e?.tipo === 'no_encontrado') return { paquete: { ...conLocal(null), nota: 'Paquete nuevo: se da de alta con esta llegada.' } };
        if (e?.tipo === 'red') return { paquete: { ...conLocal(null), nota: 'Sin señal: la guía se valida al subir el registro.' } };
        return { error: e?.message ?? 'No se pudo revisar la guía.' };
      }
    }

    // modo transferencia
    if (local && local.estado === 'en_ruta') return { error: `${guia} ya está en tu ruta.` };
    try {
      const h = await api.historial(guia);
      if (h.estado !== 'en_ruta') return { error: `${guia} no está en ruta con otro repartidor, no se puede transferir.` };
      return { paquete: conLocal(h) };
    } catch (e) {
      if (e?.tipo === 'no_encontrado') return { error: `La guía ${guia} no existe.` };
      if (e?.tipo === 'red') return { paquete: { ...conLocal(null), nota: 'Sin señal: la transferencia se valida al subir el registro.' } };
      return { error: e?.message ?? 'No se pudo revisar la guía.' };
    }
  };

  const aplicar = (r) => {
    if (r.paquete) {
      setError(null);
      setDetectado(r.paquete);
    } else {
      setError(r.error);
      setTimeout(() => { bloqueado.current = false; }, 2500);
    }
  };

  const alLeer = async ({ data }) => {
    if (bloqueado.current || detectado) return;
    bloqueado.current = true;
    setVerificando(true);
    try {
      aplicar(await buscar(data));
    } finally {
      setVerificando(false);
    }
  };

  const reiniciar = () => {
    setDetectado(null);
    setError(null);
    bloqueado.current = false;
  };

  const cambiarModo = (m) => {
    setModo(m);
    reiniciar();
  };

  const continuar = () =>
    modo === 'llegada'
      ? navigation.navigate('FotoLlegada', { guia: detectado.guia, datos: detectado.datos })
      : navigation.replace('RecibirTransferencia', { guia: detectado.guia, datos: detectado.datos });

  const anchoMarco = Math.min(width * 0.8, 330);
  const puedeEscanear = permiso?.granted;

  return (
    <View style={styles.fondo}>
      <StatusBar style="light" />
      {puedeEscanear ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={linterna}
          barcodeScannerSettings={{ barcodeTypes: ['code128', 'code39', 'qr', 'ean13', 'datamatrix'] }}
          onBarcodeScanned={detectado || verificando ? undefined : alLeer}
        />
      ) : null}

      {/* Barra superior */}
      <View style={[styles.barraSup, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.botonRedondo} hitSlop={6} accessibilityLabel="Cerrar">
          <X size={19} color="#fff" strokeWidth={2.4} />
        </Pressable>
        <Texto peso="bold" tam={16} color="#fff">Escanear guía</Texto>
        <Pressable onPress={() => setLinterna((l) => !l)} style={styles.botonRedondo} hitSlop={6} accessibilityLabel={linterna ? 'Apagar linterna' : 'Encender linterna'}>
          {linterna ? <Zap size={18} color="#FFD34D" fill="#FFD34D" strokeWidth={2.2} /> : <ZapOff size={18} color="#fff" strokeWidth={2.2} />}
        </Pressable>
      </View>

      <View style={[styles.contexto, { top: insets.top + 60 }]}>
        <View style={styles.modos}>
          {[['llegada', 'Llegada a bodega', Warehouse], ['transferencia', 'Recibir transferencia', ArrowLeftRight]].map(([clave, texto, Icono]) => (
            <Pressable key={clave} onPress={() => cambiarModo(clave)} style={[styles.modo, modo === clave && styles.modoActivo]} accessibilityRole="tab" accessibilityState={{ selected: modo === clave }}>
              <Icono size={13} color="#fff" strokeWidth={2.4} style={{ marginRight: 5 }} />
              <Texto peso="bold" tam={11.5} color="#fff" alto={15}>{texto}</Texto>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Marco de lectura */}
      <View style={styles.zonaMarco} pointerEvents="none">
        {puedeEscanear ? (
          <>
            <MarcoEncuadre ancho={anchoMarco} alto={anchoMarco * 0.62} color={detectado ? colores.verdeEscaneo : '#FFFFFF'} grosor={4} largo={36} radio={14} />
            <Texto peso="semibold" tam={14} color="#fff" centro style={styles.pista}>
              {detectado ? 'Guía leída' : 'Apunta al código de barras de la guía'}
            </Texto>
          </>
        ) : permiso ? (
          <View style={{ alignItems: 'center', paddingHorizontal: 36 }}>
            <Camera size={30} color="#fff" strokeWidth={2} />
            <Texto peso="bold" tam={17} color="#fff" centro style={{ marginTop: 12 }}>Activa la cámara para leer guías</Texto>
            <Texto tam={13.5} color="#C9D3E4" centro style={{ marginTop: 6 }}>También puedes escribir el número de guía a mano.</Texto>
          </View>
        ) : null}
      </View>

      {/* Hoja inferior */}
      <View style={[styles.hoja, { paddingBottom: insets.bottom + 16 }]}>
        {detectado ? (
          <>
            <View style={styles.filaHoja}>
              <Etiqueta texto="Guía detectada" tono="verde" icono={Check} />
              <Texto tam={12} color={colores.textoSec}>Paso 1 de 2</Texto>
            </View>
            <Texto peso="extrabold" tam={24} alto={30} style={{ marginTop: 8 }}>{detectado.guia}</Texto>
            <Texto tam={13.5} color={colores.textoSec}>{[detectado.destinatario ?? 'Destinatario sin registrar', detectado.ciudad].filter(Boolean).join(', ')}</Texto>
            {detectado.nota ? <Texto tam={12.5} color={colores.ambarTexto} style={{ marginTop: 6 }}>{detectado.nota}</Texto> : null}
            <Boton icono={Camera} titulo={modo === 'llegada' ? 'Continuar con la foto' : 'Recibir con foto'} onPress={continuar} style={{ marginTop: 16 }} />
            <Boton titulo="No es este paquete, escanear otro" variante="enlace" tamTexto={13.5} onPress={reiniciar} style={{ marginTop: 6 }} />
          </>
        ) : (
          <>
            <View style={styles.filaHoja}>
              {error ? <Etiqueta texto="No se pudo usar esta guía" tono="rojo" icono={TriangleAlert} /> : <Etiqueta texto={verificando ? 'Revisando guía…' : 'Buscando guía'} tono="gris" />}
              <Texto tam={12} color={colores.textoSec}>Paso 1 de 2</Texto>
            </View>
            <Texto tam={13.5} color={error ? colores.rojo : colores.textoSec} style={{ marginTop: 10 }}>
              {error ?? (modo === 'llegada' ? 'Cuando la cámara lea la guía verás aquí al destinatario para confirmarlo antes de la foto.' : 'Escanea la guía del paquete que te entrega otro repartidor. Quedarás como responsable al registrarlo con foto.')}
            </Texto>
            {!puedeEscanear && permiso?.canAskAgain ? <Boton titulo="Permitir cámara" onPress={pedirPermiso} style={{ marginTop: 14 }} /> : null}
            {!puedeEscanear && permiso && !permiso.canAskAgain ? <Boton titulo="Abrir ajustes del teléfono" onPress={() => Linking.openSettings()} style={{ marginTop: 14 }} /> : null}
            <Boton titulo="Escribir número de guía" variante="enlace" tamTexto={13.5} onPress={() => setManual(true)} style={{ marginTop: 8 }} />
          </>
        )}
      </View>

      <EntradaManual
        visible={manual}
        onCerrar={() => setManual(false)}
        onBuscar={async (codigo) => {
          const r = await buscar(codigo);
          if (r.paquete) {
            setManual(false);
            setError(null);
            bloqueado.current = true;
            setDetectado(r.paquete);
          }
          return r.error;
        }}
      />
    </View>
  );
}

function EntradaManual({ visible, onCerrar, onBuscar }) {
  const [valor, setValor] = useState('DLV-');
  const [error, setError] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const insets = useSafeAreaInsets();

  const enviar = async () => {
    setBuscando(true);
    try {
      setError((await onBuscar(valor)) ?? null);
    } finally {
      setBuscando(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCerrar}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.velo}>
        <Pressable style={{ flex: 1 }} onPress={onCerrar} />
        <View style={[styles.hojaModal, { paddingBottom: insets.bottom + 16 }]}>
          <Texto peso="bold" tam={18}>Escribir número de guía</Texto>
          <Texto tam={13} color={colores.textoSec} style={{ marginTop: 2 }}>Úsalo si la etiqueta está dañada o la cámara no la lee.</Texto>
          <TextInput
            value={valor}
            onChangeText={(t) => { setValor(t.toUpperCase()); setError(null); }}
            autoFocus
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="DLV-00000"
            placeholderTextColor={colores.textoTer}
            onSubmitEditing={enviar}
            style={[styles.campo, error && { borderColor: colores.rojo }]}
          />
          {error ? <Texto tam={12.5} color={colores.rojo} style={{ marginTop: 6 }}>{error}</Texto> : null}
          <Boton titulo="Buscar guía" onPress={enviar} cargando={buscando} deshabilitado={normalizar(valor).length < 6} style={{ marginTop: 14 }} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colores.camaraFondo },
  barraSup: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, zIndex: 2 },
  botonRedondo: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(11,18,32,0.55)', alignItems: 'center', justifyContent: 'center' },
  contexto: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 2 },
  modos: { flexDirection: 'row', backgroundColor: 'rgba(11,18,32,0.55)', borderRadius: 999, padding: 3 },
  modo: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999 },
  modoActivo: { backgroundColor: colores.primario },
  zonaMarco: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingBottom: 150 },
  pista: { marginTop: 22, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } },
  hoja: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colores.blanco, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 18, paddingTop: 18 },
  filaHoja: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  velo: { flex: 1, backgroundColor: 'rgba(11,18,32,0.45)' },
  hojaModal: { backgroundColor: colores.blanco, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20 },
  campo: {
    marginTop: 16, height: 52, borderRadius: radios.campo, borderWidth: 1.5, borderColor: colores.primario,
    paddingHorizontal: 14, fontFamily: fuentes.bold, fontSize: 18, letterSpacing: 1, color: colores.tinta,
  },
});
