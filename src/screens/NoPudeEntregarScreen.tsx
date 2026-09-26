// Pantalla 16 · No pude entregar (evento "excepcion")
// Contrato: foto obligatoria + motivo (nadie_recibio | direccion_incorrecta | rechazado | otro).
// Si el motivo es "otro", el comentario es obligatorio. No se pide firma.
// El paquete queda "no_entregado" y sale de la lista de en ruta.
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Camera, CircleHelp, Info, MapPinOff, UserX, X } from 'lucide-react-native';
import Aviso from '../components/Aviso';
import Boton from '../components/Boton';
import CapturaFoto from '../components/CapturaFoto';
import Encabezado from '../components/Encabezado';
import { Contenido, Pantalla, Pie, TituloSeccion } from '../components/Estructura';
import Etiqueta from '../components/Etiqueta';
import { FotoGrande, TomarFotoVacio } from '../components/FotoEvidencia';
import OpcionRadio, { CuadroIcono } from '../components/OpcionRadio';
import Texto from '../components/Texto';
import { useApp, usePaquete, type FotoCapturada } from '../context/AppContext';
import type { Motivo } from '../api/tipos';
import { MOTIVOS_EXCEPCION } from '../modelo';
import type { PantallaProps } from '../navigation/types';
import { useUbicacion } from '../services/ubicacion';
import { colores, fuentes, radios } from '../theme';

const OPCIONES: { valor: Motivo; detalle: string; icono: typeof UserX }[] = [
  { valor: 'nadie_recibio', detalle: 'Toqué y llamé sin respuesta', icono: UserX },
  { valor: 'direccion_incorrecta', detalle: 'No existe o no coincide', icono: MapPinOff },
  { valor: 'rechazado', detalle: 'El cliente no lo aceptó', icono: X },
  { valor: 'otro', detalle: 'Explícalo en las notas', icono: CircleHelp },
];

export default function NoPudeEntregarScreen({ route, navigation }: PantallaProps<'NoPudeEntregar'>) {
  const { guia } = route.params;
  const p = usePaquete(guia);
  const { registrarExcepcion, avisar } = useApp();
  const { listo } = useUbicacion();
  const [motivo, setMotivo] = useState<Motivo | null>(null);
  const [foto, setFoto] = useState<FotoCapturada | null>(null);
  const [notas, setNotas] = useState('');
  const [camara, setCamara] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [foco, setFoco] = useState(false);

  const notasObligatorias = motivo === 'otro';
  const faltante = !motivo
    ? 'Elige por qué no se pudo entregar'
    : !foto
      ? 'Falta la foto del lugar'
      : notasObligatorias && notas.trim().length < 5
        ? 'Escribe qué pasó en las notas'
        : null;

  const registrar = async () => {
    if (!motivo || !foto) return;
    setEnviando(true);
    try {
      await registrarExcepcion({ guia, motivo, comentario: notas, foto });
      avisar(`${guia} quedó como no entregado. El motivo ya está en su historial.`);
      navigation.reset({ index: 0, routes: [{ name: 'Main', params: { screen: 'Ruta', params: { pestana: 'entregados', t: Date.now() } } }] });
    } catch (e) {
      console.warn('[excepcion]', e);
      avisar('No se pudo guardar la evidencia en el teléfono. Inténtalo de nuevo.', 'alerta');
      setEnviando(false);
    }
  };

  return (
    <Pantalla>
      <StatusBar style="dark" />
      <Encabezado titulo="No pude entregar" subtitulo={guia} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={10}>
        <Contenido>
          <TituloSeccion style={{ marginTop: 4 }}>¿Por qué no se pudo entregar?</TituloSeccion>
          {OPCIONES.map((o) => (
            <OpcionRadio
              key={o.valor}
              titulo={MOTIVOS_EXCEPCION[o.valor]}
              detalle={o.detalle}
              seleccionada={motivo === o.valor}
              onPress={() => setMotivo(o.valor)}
              izquierda={<CuadroIcono icono={o.icono} fondo={colores.rojoSuave} color={colores.rojo} />}
            />
          ))}

          <TituloSeccion style={{ marginTop: 10 }} derecha={<Etiqueta texto="Obligatoria" tono="azulLleno" icono={Camera} />}>Foto del lugar</TituloSeccion>
          {foto ? (
            <FotoGrande fuente={{ uri: foto.uri }} alto={180} onRepetir={() => setCamara(true)} />
          ) : (
            <TomarFotoVacio texto="Tomar foto del lugar" alto={140} onPress={() => setCamara(true)} />
          )}

          <View style={styles.filaNotas}>
            <Texto peso="semibold" tam={13} color="#34425E">Notas</Texto>
            <Texto tam={12} color={notasObligatorias ? colores.rojo : colores.textoTer}>{notasObligatorias ? 'obligatorio' : 'opcional'}</Texto>
          </View>
          <TextInput
            value={notas}
            onChangeText={setNotas}
            onFocus={() => setFoco(true)}
            onBlur={() => setFoco(false)}
            multiline
            maxLength={400}
            placeholder="Ej. Toqué dos veces y llamé al teléfono del cliente."
            placeholderTextColor={colores.textoTer}
            style={[styles.area, foco && { borderColor: colores.primario, borderWidth: 1.5 }]}
            textAlignVertical="top"
          />

          <Aviso icono={Info} style={{ marginTop: 12 }}>No se pide firma. El motivo queda en el historial del paquete.</Aviso>
        </Contenido>
        <Pie>
          <Boton titulo={faltante ?? 'Registrar excepción'} variante="oscuro" onPress={registrar} deshabilitado={!!faltante} cargando={enviando} />
        </Pie>
      </KeyboardAvoidingView>

      <Modal visible={camara} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setCamara(false)}>
        <CapturaFoto
          contexto={`No entregado, ${guia}`}
          instruccion={p?.direccion ? 'Que se vea la puerta o la fachada del domicilio.' : 'Que se vea el lugar donde intentaste entregar.'}
          textoGps={listo ? 'GPS listo, ubicación activa' : 'Buscando GPS…'}
          gpsListo={listo}
          onCerrar={() => setCamara(false)}
          onCapturar={(f) => {
            setFoto(f);
            setCamara(false);
          }}
        />
      </Modal>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  filaNotas: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, marginBottom: 7 },
  area: {
    minHeight: 84, borderRadius: radios.campo, borderWidth: 1, borderColor: colores.bordeCampo, backgroundColor: colores.blanco,
    paddingHorizontal: 13, paddingTop: 11, paddingBottom: 11, fontFamily: fuentes.medium, fontSize: 14.5, color: colores.tinta, lineHeight: 20,
  },
});
