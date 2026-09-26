// P8 · Vista pública de evidencia: lo que ve el cliente al abrir el enlace compartido (sin sesión)
import { Image, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Camera, Check, ShieldCheck, X } from 'lucide-react-native';
import { useEvidenciaPublica } from '../api/consultas';
import { Cargando } from '../components/Estados';
import Etiqueta from '../components/Etiqueta';
import Firma from '../components/Firma';
import Texto from '../components/Texto';
import { fuenteFoto } from '../datos/fotos';
import { colores } from '../theme';
import { fechaHoraCompleta, fechaLarga, hora } from '../utils/formato';

const TITULOS = { llegada_bodega: 'Llegó a bodega', salida_ruta: 'Salió a ruta', transferencia: 'Cambió de repartidor', incidente: 'Se registró un detalle', excepcion: 'Intento de entrega', entrega: 'Entregado' };

export default function EvidenciaPublicaPantalla({ route }) {
  const { data, isLoading, error } = useEvidenciaPublica(route.params?.token);
  const { width } = useWindowDimensions();
  const doble = width >= 760;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colores.fondo }} contentContainerStyle={styles.contenido}>
      <View style={styles.marca}>
        <Image source={require('../../assets/logo-simbolo.png')} style={{ width: 34, height: 23 }} resizeMode="contain" />
        <Texto peso="extrabold" tam={20} style={{ marginLeft: 8 }}>Deli<Texto peso="extrabold" tam={20} color={colores.primario}>viz</Texto></Texto>
      </View>

      {isLoading ? <Cargando alto={300} /> : error ? (
        <View style={styles.tarjeta}>
          <Texto peso="bold" tam={20}>No podemos mostrar esta evidencia</Texto>
          <Texto tam={14} color={colores.textoSec} style={{ marginTop: 6 }}>{error.message}</Texto>
        </View>
      ) : (
        <>
          <View style={styles.tarjeta}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.circulo, { backgroundColor: data.entrega ? colores.verde : colores.rojo }]}>
                {data.entrega ? <Check size={24} color="#fff" strokeWidth={3} /> : <X size={24} color="#fff" strokeWidth={3} />}
              </View>
              <View style={{ marginLeft: 14, flex: 1 }}>
                <Texto peso="extrabold" tam={22} alto={28}>{data.entrega ? 'Tu paquete fue entregado' : 'No pudimos entregar tu paquete'}</Texto>
                <Texto tam={14} color={colores.textoSec}>Guía {data.guia}, {data.destinatario}</Texto>
              </View>
            </View>

            {data.entrega ? (
              <>
                <View style={[{ gap: 12, marginTop: 20 }, doble && { flexDirection: 'row' }]}>
                  <Image source={fuenteFoto(data.entrega.foto)} style={[styles.foto, doble && { flex: 1 }]} accessibilityLabel="Foto del paquete en el lugar de entrega" />
                  <View style={[styles.firma, doble && { flex: 1 }]}>
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Firma indice={data.entrega.datos.firma} ancho={200} alto={80} /></View>
                    <Texto tam={12} color={colores.textoTer}>Firma de quien recibió</Texto>
                  </View>
                </View>
                <View style={{ marginTop: 16 }}>
                  <Dato k="Recibió" v={`${data.entrega.datos.recibio}, ${data.entrega.datos.relacion}`} />
                  <Dato k="Fecha y hora" v={fechaHoraCompleta(data.entrega.fecha)} />
                  <Dato k="Lugar" v={data.direccion} />
                </View>
                <View style={styles.sello}>
                  <ShieldCheck size={16} color={colores.verdeTexto} strokeWidth={2.2} />
                  <Texto tam={12.5} color={colores.verdeTexto} style={{ marginLeft: 8, flex: 1 }}>
                    La foto, la hora y la ubicación se registraron en el momento de la entrega y no se pueden editar.
                  </Texto>
                </View>
              </>
            ) : (
              <Texto tam={14} color={colores.textoSec} style={{ marginTop: 14 }}>
                Motivo: {data.eventos.filter((e) => e.tipo === 'excepcion').pop()?.datos.motivo}. Nos comunicaremos contigo para acordar un nuevo intento.
              </Texto>
            )}
          </View>

          <View style={styles.tarjeta}>
            <Texto peso="bold" tam={16} style={{ marginBottom: 12 }}>Recorrido de tu paquete</Texto>
            {data.eventos.map((e, i) => (
              <View key={i} style={{ flexDirection: 'row' }}>
                <View style={{ alignItems: 'center', width: 26 }}>
                  <View style={[styles.punto, e.tipo === 'entrega' && { backgroundColor: colores.verde, borderColor: colores.verde }, e.foto && e.tipo !== 'entrega' && { backgroundColor: colores.primario, borderColor: colores.primario }]}>
                    {e.foto ? (e.tipo === 'entrega' ? <Check size={11} color="#fff" strokeWidth={3} /> : <Camera size={10} color="#fff" strokeWidth={2.5} />) : null}
                  </View>
                  {i < data.eventos.length - 1 ? <View style={styles.linea} /> : null}
                </View>
                <View style={{ flex: 1, marginLeft: 10, paddingBottom: 16 }}>
                  <Texto peso="semibold" tam={14}>{TITULOS[e.tipo] ?? e.tipo}</Texto>
                  <Texto tam={12.5} color={colores.textoSec}>{fechaLarga(e.fecha)}, {hora(e.fecha)}</Texto>
                </View>
              </View>
            ))}
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <Etiqueta texto={`Enlace válido hasta el ${fechaLarga(data.venceEn)}`} tono="gris" />
          </View>
          <Texto tam={12} color={colores.textoTer} centro style={{ marginTop: 10 }}>Deliviz, entregas que generan confianza</Texto>
        </>
      )}
    </ScrollView>
  );
}

const Dato = ({ k, v }) => (
  <View style={{ flexDirection: 'row', paddingVertical: 5 }}>
    <Texto tam={13.5} color={colores.textoSec} style={{ width: 110 }}>{k}</Texto>
    <Texto peso="bold" tam={13.5} style={{ flex: 1 }}>{v}</Texto>
  </View>
);

const styles = StyleSheet.create({
  contenido: { padding: 18, paddingBottom: 40, width: '100%', maxWidth: 760, alignSelf: 'center' },
  marca: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 18 },
  tarjeta: { backgroundColor: colores.blanco, borderRadius: 18, borderWidth: 1, borderColor: colores.borde, padding: 22, marginBottom: 14 },
  circulo: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  foto: { height: 200, borderRadius: 14, backgroundColor: colores.gris },
  firma: { height: 200, borderRadius: 14, borderWidth: 1, borderColor: colores.borde, padding: 14 },
  sello: { flexDirection: 'row', alignItems: 'center', backgroundColor: colores.verdeSuave, borderRadius: 10, padding: 12, marginTop: 14 },
  punto: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colores.hueco, backgroundColor: colores.blanco, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  linea: { flex: 1, width: 2, backgroundColor: colores.linea, marginVertical: 2 },
});
