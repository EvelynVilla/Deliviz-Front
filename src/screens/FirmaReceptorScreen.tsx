// Pantalla 13 · Firma del receptor (paso 2 de 3)
// Nombre de quien recibe, relación con el destinatario (enum relacionReceptor del contrato)
// y firma en pantalla. La hora y la ubicación se fijan AL FIRMAR y ya no se editan.
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import SignatureScreen, { type SignatureViewRef } from 'react-native-signature-canvas';
import { StatusBar } from 'expo-status-bar';
import { Check, Lock, Trash2 } from 'lucide-react-native';
import Boton from '../components/Boton';
import Encabezado from '../components/Encabezado';
import { Pantalla, Pie } from '../components/Estructura';
import Texto from '../components/Texto';
import { useApp, usePaquete } from '../context/AppContext';
import type { RelacionReceptor } from '../api/tipos';
import { RELACIONES } from '../modelo';
import type { PantallaProps } from '../navigation/types';
import { ubicacionActual } from '../services/ubicacion';
import { colores, espacio, fuentes, radios } from '../theme';

// Oculta los botones propios del lienzo: "Borrar" y "Continuar" son de la pantalla.
const ESTILO_LIENZO = `
  .m-signature-pad { box-shadow: none; border: none; margin: 0; }
  .m-signature-pad--body { border: none; }
  .m-signature-pad--footer { display: none; margin: 0; }
  body, html { background-color: #FFFFFF; }
`;

export default function FirmaReceptorScreen({ route, navigation }: PantallaProps<'FirmaReceptor'>) {
  const { guia, foto } = route.params;
  const p = usePaquete(guia);
  const { avisar } = useApp();
  const lienzo = useRef<SignatureViewRef>(null);
  const [nombre, setNombre] = useState('');
  const [relacion, setRelacion] = useState<RelacionReceptor | null>(null);
  const [hayTrazo, setHayTrazo] = useState(false);
  const [dibujando, setDibujando] = useState(false);
  const [foco, setFoco] = useState(false);

  const elegirRelacion = (r: RelacionReceptor) => {
    setRelacion(r);
    // Si recibe el titular, se propone el nombre del destinatario.
    if (r === 'titular' && !nombre.trim() && p?.destinatario) setNombre(p.destinatario);
  };

  const borrar = () => {
    lienzo.current?.clearSignature();
    setHayTrazo(false);
  };

  const faltante = nombre.trim().length < 3 ? 'Escribe el nombre de quien recibe' : !relacion ? 'Elige la relación con el destinatario' : !hayTrazo ? 'Falta la firma' : null;

  // readSignature() es asíncrono: la firma llega en onOK y desde ahí se navega.
  const continuar = () => lienzo.current?.readSignature();

  const alFirmar = (dataUrl: string) => {
    if (!relacion) return;
    navigation.navigate('ConfirmarEntrega', {
      guia,
      foto,
      firmaDataUrl: dataUrl,
      nombreReceptor: nombre.trim(),
      relacionReceptor: relacion,
      fechaCaptura: new Date().toISOString(),
      ubicacion: ubicacionActual(),
    });
  };

  return (
    <Pantalla>
      <StatusBar style="dark" />
      <Encabezado titulo="Firma del receptor" subtitulo="Paso 2 de 3" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.contenido} scrollEnabled={!dibujando} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Texto peso="semibold" tam={13} color="#34425E" style={styles.etiqueta}>Nombre de quien recibe</Texto>
          <TextInput
            value={nombre}
            onChangeText={setNombre}
            onFocus={() => setFoco(true)}
            onBlur={() => setFoco(false)}
            placeholder="Nombre completo"
            placeholderTextColor={colores.textoTer}
            autoCapitalize="words"
            maxLength={120}
            style={[styles.campo, foco && styles.campoFoco]}
          />

          <Texto peso="semibold" tam={13} color="#34425E" style={[styles.etiqueta, { marginTop: 16 }]}>Relación con el destinatario</Texto>
          <View style={styles.chips}>
            {RELACIONES.map((r) => {
              const sel = relacion === r.valor;
              return (
                <Pressable key={r.valor} onPress={() => elegirRelacion(r.valor)} accessibilityRole="radio" accessibilityState={{ selected: sel }} style={[styles.chip, sel && styles.chipSel]}>
                  {sel ? <Check size={14} color={colores.azulTexto} strokeWidth={2.6} style={{ marginRight: 5 }} /> : null}
                  <Texto peso={sel ? 'semibold' : 'medium'} tam={14} color={sel ? colores.azulTexto : colores.tinta}>{r.texto}</Texto>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.filaFirma}>
            <Texto peso="semibold" tam={13} color="#34425E">Firma</Texto>
            <Pressable onPress={borrar} hitSlop={10} style={{ flexDirection: 'row', alignItems: 'center' }} accessibilityRole="button">
              <Trash2 size={13} color={colores.azulTexto} strokeWidth={2.3} style={{ marginRight: 4 }} />
              <Texto peso="bold" tam={13} color={colores.azulTexto}>Borrar</Texto>
            </Pressable>
          </View>
          <View style={styles.lienzo}>
            <SignatureScreen
              ref={lienzo}
              onOK={alFirmar}
              onEmpty={() => avisar('Falta la firma del receptor.', 'alerta')}
              onBegin={() => setDibujando(true)}
              onEnd={() => {
                setDibujando(false);
                setHayTrazo(true);
              }}
              webStyle={ESTILO_LIENZO}
              imageType="image/png"
              penColor={colores.tinta}
              backgroundColor="#FFFFFF"
              trimWhitespace
              autoClear={false}
              descriptionText=""
            />
            {!hayTrazo ? (
              <View pointerEvents="none" style={styles.guiaFirma}>
                <Texto tam={12} color={colores.textoTer}>Firma aquí con el dedo o un lápiz óptico</Texto>
              </View>
            ) : null}
          </View>

          <View style={styles.nota}>
            <Lock size={13} color={colores.textoSec} strokeWidth={2.2} style={{ marginRight: 7, marginTop: 2 }} />
            <Texto tam={12.5} color={colores.textoSec} style={{ flex: 1 }}>La hora y la ubicación se guardan al firmar y no se pueden editar.</Texto>
          </View>
        </ScrollView>
        <Pie>
          <Boton titulo={faltante ?? 'Continuar'} onPress={continuar} deshabilitado={!!faltante} />
        </Pie>
      </KeyboardAvoidingView>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingHorizontal: espacio.pantalla, paddingBottom: 24 },
  etiqueta: { marginBottom: 7 },
  campo: {
    height: 50, borderRadius: radios.campo, borderWidth: 1, borderColor: colores.bordeCampo, backgroundColor: colores.blanco,
    paddingHorizontal: 14, fontFamily: fuentes.medium, fontSize: 15.5, color: colores.tinta,
  },
  campoFoco: { borderColor: colores.primario, borderWidth: 1.5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, height: 38, borderRadius: 999, marginRight: 8, marginBottom: 8,
    backgroundColor: colores.blanco, borderWidth: 1, borderColor: colores.borde,
  },
  chipSel: { backgroundColor: colores.primarioSuave, borderColor: colores.primario },
  filaFirma: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, marginBottom: 7 },
  lienzo: { height: 200, borderRadius: radios.tarjeta, borderWidth: 1, borderColor: colores.borde, backgroundColor: colores.blanco, overflow: 'hidden' },
  guiaFirma: { position: 'absolute', left: 16, right: 16, bottom: 14, borderTopWidth: 1, borderStyle: 'dashed', borderTopColor: colores.linea, paddingTop: 6 },
  nota: { flexDirection: 'row', backgroundColor: colores.gris, borderRadius: 12, padding: 12, marginTop: 12 },
});
