// Pantalla 10 · Reportar problema
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Camera, CircleHelp, Droplets, Tag, TriangleAlert } from 'lucide-react-native';
import Aviso from '../components/Aviso';
import Boton from '../components/Boton';
import CapturaFoto from '../components/CapturaFoto';
import Chip from '../components/Chip';
import Encabezado from '../components/Encabezado';
import { Contenido, Pantalla, Pie, TituloSeccion } from '../components/Estructura';
import Etiqueta from '../components/Etiqueta';
import { FotoGrande, TomarFotoVacio } from '../components/FotoEvidencia';
import TarjetaGuia from '../components/TarjetaGuia';
import Texto from '../components/Texto';
import { useApp, usePaquete } from '../context/AppContext';
import { useUbicacion } from '../services/ubicacion';
import { colores, fuentes, radios } from '../theme';

const TIPOS = [
  { texto: 'Paquete dañado', icono: TriangleAlert },
  { texto: 'Etiqueta ilegible', icono: Tag },
  { texto: 'Mojado o derramado', icono: Droplets },
  { texto: 'Otro', icono: CircleHelp },
];

export default function ReportarProblemaScreen({ route, navigation }) {
  const p = usePaquete(route.params.guia);
  const { reportarProblema, avisar } = useApp();
  const { ubicacion, listo } = useUbicacion();
  const [tipo, setTipo] = useState(null);
  const [foto, setFoto] = useState(null);
  const [descripcion, setDescripcion] = useState('');
  const [camara, setCamara] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [foco, setFoco] = useState(false);

  if (!p) return null;

  const requiereTexto = tipo === 'Otro';
  const faltante = !tipo ? 'Elige qué pasó' : !foto ? 'Falta la foto del problema' : requiereTexto && descripcion.trim().length < 5 ? 'Cuéntanos qué pasó' : null;

  const enviar = async () => {
    setEnviando(true);
    // Evento incidente del contrato: foto + comentario obligatorio (el tipo elegido va al inicio).
    await reportarProblema({ guia: p.guia, tipo, descripcion: descripcion.trim(), foto });
    avisar('Reporte enviado. El administrador ya fue avisado.');
    navigation.goBack();
  };

  return (
    <Pantalla>
      <StatusBar style="dark" />
      <Encabezado titulo="Reportar problema" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={10}>
        <Contenido>
          <TarjetaGuia paquete={p} />

          <TituloSeccion>¿Qué pasó con el paquete?</TituloSeccion>
          <View style={styles.chips}>
            {TIPOS.map((t) => <Chip key={t.texto} texto={t.texto} icono={t.icono} seleccionado={tipo === t.texto} onPress={() => setTipo(t.texto)} />)}
          </View>

          <TituloSeccion style={{ marginTop: 10 }} derecha={<Etiqueta texto="Obligatoria" tono="azulLleno" icono={Camera} />}>Foto del problema</TituloSeccion>
          {foto ? (
            <FotoGrande fuente={{ uri: foto.uri }} alto={190} onRepetir={() => setCamara(true)} />
          ) : (
            <TomarFotoVacio texto="Tomar foto del problema" alto={150} onPress={() => setCamara(true)} />
          )}

          <Texto tam={13} color={colores.textoSec} style={{ marginTop: 16, marginBottom: 7 }}>
            Cuéntanos qué pasó{requiereTexto ? '' : ' (opcional)'}
          </Texto>
          <TextInput
            value={descripcion}
            onChangeText={setDescripcion}
            onFocus={() => setFoco(true)}
            onBlur={() => setFoco(false)}
            multiline
            maxLength={400}
            placeholder="Ej. Se golpeó una esquina al acomodar la carga en la unidad."
            placeholderTextColor={colores.textoTer}
            style={[styles.area, foco && { borderColor: colores.primario, borderWidth: 1.5 }]}
            textAlignVertical="top"
          />

          <Aviso style={{ marginTop: 12 }}>Queda en el historial del paquete y avisa al administrador.</Aviso>
        </Contenido>
        <Pie>
          <Boton titulo={faltante ?? 'Enviar reporte'} onPress={enviar} deshabilitado={!!faltante} cargando={enviando} />
        </Pie>
      </KeyboardAvoidingView>

      <Modal visible={camara} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setCamara(false)}>
        <CapturaFoto
          contexto={`Problema, ${p.guia}`}
          instruccion="Que se vea bien el daño y la guía del paquete."
          textoGps={listo ? 'GPS listo, ubicación activa' : 'Buscando GPS…'}
          gpsListo={listo && !!ubicacion}
          onCerrar={() => setCamara(false)}
          onCapturar={(f) => { setFoto(f); setCamara(false); }}
        />
      </Modal>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  area: {
    minHeight: 84, borderRadius: radios.campo, borderWidth: 1, borderColor: colores.bordeCampo, backgroundColor: colores.blanco,
    paddingHorizontal: 13, paddingTop: 11, paddingBottom: 11, fontFamily: fuentes.medium, fontSize: 14.5, color: colores.tinta, lineHeight: 20,
  },
});
