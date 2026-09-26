// P3 · Vista de paquete (pantalla 18 del mockup): línea de tiempo, recorrido, evidencia y alertas
import { useState } from 'react';
import { Image, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { Check, Copy, ExternalLink, FileText, ShieldCheck, TriangleAlert, Upload } from 'lucide-react-native';
import { useAlertas, useCrearEnlace, usePaquete } from '../api/consultas';
import Aviso from '../components/Aviso';
import Boton from '../components/Boton';
import Chip from '../components/Chip';
import Dialogo from '../components/Dialogo';
import { Cargando, ErrorVista, Vacio } from '../components/Estados';
import EstadoPaquete from '../components/EstadoPaquete';
import Etiqueta from '../components/Etiqueta';
import Firma from '../components/Firma';
import LineaTiempo, { describir } from '../components/LineaTiempo';
import ListaAlertas from '../components/ListaAlertas';
import MapaRecorrido from '../components/MapaRecorrido';
import Pagina from '../components/Pagina';
import Tarjeta from '../components/Tarjeta';
import Texto from '../components/Texto';
import { fuenteFoto } from '../datos/fotos';
import { colores } from '../theme';
import { exportarEvidenciaPdf } from '../utils/pdfEvidencia';
import { coordenadas, fechaHoraCompleta, fechaLarga } from '../utils/formato';

export default function PaquetePantalla({ route, navigation }) {
  const guia = route.params?.guia ?? '';
  const { data: p, isLoading, error } = usePaquete(guia);
  const { data: alertas } = useAlertas();
  const { width } = useWindowDimensions();
  const ancho = width >= 1240;
  const [foto, setFoto] = useState(null);
  const [compartir, setCompartir] = useState(false);
  const [exportando, setExportando] = useState(false);

  if (isLoading) return <Cargando alto={400} />;
  if (error) return <ErrorVista mensaje={error.message} onReintentar={() => navigation.navigate('Paquetes')} />;

  const puntos = [];
  for (const e of p.eventos) {
    const prev = puntos[puntos.length - 1];
    if (prev && Math.abs(prev.lat - e.lat) < 1e-5 && Math.abs(prev.lng - e.lng) < 1e-5) continue;
    puntos.push({ lat: e.lat, lng: e.lng, final: e.tipo === 'entrega' ? 'entrega' : e.tipo === 'excepcion' ? 'excepcion' : null });
  }

  const activas = (alertas ?? []).filter((a) => !a.revisada);
  const propias = activas.filter((a) => a.guia === p.guia);
  const resumen = [...propias, ...activas.filter((a) => a.guia !== p.guia)].slice(0, 3);

  const exportar = async () => {
    setExportando(true);
    try { await exportarEvidenciaPdf(p); } finally { setExportando(false); }
  };

  const historial = (
    <Tarjeta titulo="Historial del paquete" style={ancho ? { flex: 0.82 } : null}>
      <LineaTiempo eventos={p.eventos} onFoto={setFoto} direccion={p.direccion} />
      {p.eventos.length === 0 ? <Vacio titulo="Sin eventos todavía" texto="El primer registro es la llegada a bodega, con foto obligatoria." /> : null}
    </Tarjeta>
  );

  const derecha = (
    <View style={[{ gap: 16 }, ancho && { flex: 1.25 }]}>
      {puntos.length ? <MapaRecorrido puntos={puntos} alto={ancho ? 232 : 220} /> : null}
      <View style={[{ gap: 16 }, width >= 760 && { flexDirection: 'row' }]}>
        <Evidencia p={p} onFoto={setFoto} />
        <Tarjeta
          titulo="Alertas activas"
          derecha={activas.length ? <View style={styles.contador}><Texto peso="bold" tam={11.5} color={colores.rojo} alto={14}>{activas.length}</Texto></View> : null}
          style={{ flex: 0.95 }}
        >
          {propias.length ? <Aviso tono="ambar" icono={TriangleAlert} style={{ marginBottom: 6 }}>Este paquete tiene {propias.length === 1 ? 'una alerta' : `${propias.length} alertas`} sin revisar.</Aviso> : null}
          {resumen.length ? (
            <ListaAlertas alertas={resumen} onAbrir={(a) => navigation.navigate('Paquete', { guia: a.guia })} />
          ) : <Texto tam={13} color={colores.textoSec}>No hay alertas activas. Todo va en orden.</Texto>}
          <Boton titulo="Ver todas las alertas" variante="enlace" tamTexto={13.5} onPress={() => navigation.navigate('Alertas')} style={{ alignSelf: 'flex-start', marginTop: 10 }} />
        </Tarjeta>
      </View>
    </View>
  );

  return (
    <Pagina
      titulo={p.guia}
      extraTitulo={<EstadoPaquete estado={p.estado} tam={12} />}
      subtitulo={`${p.destinatario}, ${p.direccion}, ${p.colonia}, ${p.ciudad}`}
      acciones={
        <>
          <Boton icono={Upload} titulo="Compartir enlace" variante="secundario" onPress={() => setCompartir(true)} deshabilitado={!p.entrega && p.estado !== 'excepcion'} />
          <Boton icono={FileText} titulo="Exportar evidencia (PDF)" onPress={exportar} cargando={exportando} />
        </>
      }
    >
      <View style={[{ gap: 16 }, ancho && { flexDirection: 'row', alignItems: 'flex-start' }]}>
        {historial}
        {derecha}
      </View>

      <Dialogo visible={!!foto} titulo={foto ? describir(foto).titulo : ''} subtitulo={foto ? `${fechaHoraCompleta(foto.fecha)}, GPS ${coordenadas(foto.lat, foto.lng)}` : ''} onCerrar={() => setFoto(null)} ancho={720}>
        {foto ? <Image source={fuenteFoto(foto.foto)} style={styles.fotoGrande} resizeMode="contain" /> : null}
      </Dialogo>

      <DialogoCompartir visible={compartir} guia={p.guia} onCerrar={() => setCompartir(false)} navigation={navigation} />
    </Pagina>
  );
}

function Evidencia({ p, onFoto }) {
  const e = p.entrega;
  const excepcion = p.eventos.filter((x) => x.tipo === 'excepcion').pop();

  if (!e) {
    return (
      <Tarjeta titulo={excepcion ? 'No se pudo entregar' : 'Evidencia de entrega'} derecha={excepcion ? <Etiqueta texto="Excepción" tono="rojo" /> : <Etiqueta texto="Pendiente" tono="gris" />} style={{ flex: 1.3 }}>
        {excepcion ? (
          <>
            <Pressable onPress={() => onFoto(excepcion)}><Image source={fuenteFoto(excepcion.foto)} style={styles.fotoEvidencia} /></Pressable>
            <Datos filas={[
              ['Motivo', excepcion.datos.motivo],
              ['Notas', excepcion.datos.notas ?? 'Sin notas'],
              ['Fecha y hora', fechaHoraCompleta(excepcion.fecha)],
              ['Ubicación', coordenadas(excepcion.lat, excepcion.lng)],
              ['Repartidor', excepcion.repartidor],
            ]} />
          </>
        ) : (
          <Vacio titulo="Todavía no se entrega" texto="Cuando el repartidor cierre la entrega verás aquí la foto, la firma, quién recibió y dónde." />
        )}
      </Tarjeta>
    );
  }

  const verificada = e.datos.distanciaM <= 50;
  return (
    <Tarjeta
      titulo="Evidencia de entrega"
      derecha={verificada ? <Etiqueta texto="Verificada" tono="verde" icono={ShieldCheck} /> : <Etiqueta texto="Revisar ubicación" tono="ambar" icono={TriangleAlert} />}
      style={{ flex: 1.3 }}
    >
      <View style={styles.evidencia}>
        <Pressable onPress={() => onFoto(e)} style={{ flex: 1 }} accessibilityLabel="Ver foto de entrega">
          <Image source={fuenteFoto(e.foto)} style={styles.fotoEvidencia} />
        </Pressable>
        <View style={styles.cajaFirma}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Firma indice={e.datos.firma} ancho={170} alto={70} /></View>
          <View style={styles.lineaFirma} />
          <Texto tam={11.5} color={colores.textoTer}>Firma del receptor</Texto>
        </View>
      </View>
      <Datos filas={[
        ['Recibió', `${e.datos.recibio}, ${e.datos.relacion}`],
        ['Fecha y hora', fechaHoraCompleta(e.fecha)],
        ['Ubicación', `${coordenadas(e.lat, e.lng)} (a ${e.datos.distanciaM} m)`],
        ['Repartidor', e.repartidor],
      ]} />
    </Tarjeta>
  );
}

function Datos({ filas }) {
  return (
    <View style={{ marginTop: 12 }}>
      {filas.map(([k, v]) => (
        <View key={k} style={styles.dato}>
          <Texto tam={13} color={colores.textoSec} style={{ width: 96 }}>{k}</Texto>
          <Texto peso="bold" tam={13} style={{ flex: 1 }}>{v}</Texto>
        </View>
      ))}
    </View>
  );
}

const VIGENCIAS = [[1, '1 día'], [7, '7 días'], [30, '30 días']];

function DialogoCompartir({ visible, guia, onCerrar, navigation }) {
  const [dias, setDias] = useState(7);
  const [copiado, setCopiado] = useState(false);
  const crear = useCrearEnlace();
  const enlace = crear.data;
  const url = enlace ? Linking.createURL(`/evidencia/${enlace.token}`) : '';

  const cerrar = () => { crear.reset(); setCopiado(false); onCerrar(); };
  const copiar = async () => { await Clipboard.setStringAsync(url); setCopiado(true); setTimeout(() => setCopiado(false), 2000); };

  return (
    <Dialogo
      visible={visible}
      titulo="Compartir evidencia"
      subtitulo={`Enlace de solo lectura para mostrarle la entrega de ${guia} al cliente. No pide iniciar sesión.`}
      onCerrar={cerrar}
      pie={enlace ? (
        <>
          <Boton icono={ExternalLink} titulo="Ver como cliente" variante="secundario" onPress={() => { cerrar(); navigation.getParent()?.navigate('EvidenciaPublica', { token: enlace.token }); }} />
          <Boton icono={copiado ? Check : Copy} titulo={copiado ? 'Copiado' : 'Copiar enlace'} onPress={copiar} />
        </>
      ) : (
        <Boton titulo="Crear enlace" onPress={() => crear.mutate({ guia, dias })} cargando={crear.isPending} />
      )}
    >
      {!enlace ? (
        <>
          <Texto peso="semibold" tam={13} color="#34425E" style={{ marginBottom: 8 }}>¿Cuánto tiempo sirve el enlace?</Texto>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {VIGENCIAS.map(([d, t]) => <Chip key={d} texto={t} seleccionado={dias === d} onPress={() => setDias(d)} />)}
          </View>
          <Aviso style={{ marginTop: 8 }}>El cliente verá la foto, la firma, quién recibió y la hora. No verá teléfonos ni datos del repartidor.</Aviso>
        </>
      ) : (
        <>
          <View style={styles.enlace}>
            <Texto peso="semibold" tam={13.5} color={colores.azulTexto} numberOfLines={1} selectable>{url}</Texto>
          </View>
          <Texto tam={12.5} color={colores.textoSec} style={{ marginTop: 8 }}>Vence el {fechaLarga(enlace.venceEn)}.</Texto>
        </>
      )}
    </Dialogo>
  );
}

const styles = StyleSheet.create({
  contador: { minWidth: 24, height: 22, borderRadius: 11, paddingHorizontal: 7, backgroundColor: colores.rojoSuave, alignItems: 'center', justifyContent: 'center' },
  evidencia: { flexDirection: 'row', gap: 12 },
  fotoEvidencia: { width: '100%', height: 150, borderRadius: 12, backgroundColor: colores.gris },
  cajaFirma: { flex: 1, height: 150, borderRadius: 12, borderWidth: 1, borderColor: colores.borde, padding: 12, justifyContent: 'flex-end' },
  lineaFirma: { height: 1, borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: colores.pista, marginBottom: 6 },
  dato: { flexDirection: 'row', paddingVertical: 4 },
  fotoGrande: { width: '100%', height: 440, borderRadius: 12, backgroundColor: colores.gris, marginBottom: 16 },
  enlace: { borderWidth: 1, borderColor: colores.primarioBorde, backgroundColor: colores.primarioSuave, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11 },
});
