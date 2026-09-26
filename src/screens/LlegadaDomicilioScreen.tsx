// Pantalla 11 · Llegada al domicilio
// Datos del cliente, indicaciones, distancia GPS y los 3 pasos para cerrar la entrega.
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { StatusBar } from 'expo-status-bar';
import { Camera, MapPin, Navigation, Package, Phone } from 'lucide-react-native';
import Aviso from '../components/Aviso';
import Boton from '../components/Boton';
import Encabezado from '../components/Encabezado';
import { Contenido, Pantalla, Pie } from '../components/Estructura';
import Etiqueta from '../components/Etiqueta';
import Texto from '../components/Texto';
import { usePaquete, useResumenRuta } from '../context/AppContext';
import { direccionCompleta, nombreDestinatario } from '../modelo';
import type { PantallaProps } from '../navigation/types';
import { useUbicacion } from '../services/ubicacion';
import { colores, radios } from '../theme';

/** A partir de esta distancia se considera que el repartidor está en el domicilio. */
export const METROS_EN_DOMICILIO = 60;

export function textoDistancia(metros: number) {
  return metros < 1000 ? `${Math.round(metros)} m` : `${(metros / 1000).toFixed(1)} km`;
}

const PASOS = ['Foto del paquete', 'Firma del receptor', 'Confirmar'];

export default function LlegadaDomicilioScreen({ route, navigation }: PantallaProps<'LlegadaDomicilio'>) {
  const { guia } = route.params;
  const p = usePaquete(guia);
  const { hechos, totalDia } = useResumenRuta();
  const { listo, permiso, distanciaA } = useUbicacion();

  if (!p) {
    return (
      <Pantalla>
        <Encabezado titulo="Entrega" />
        <Contenido>
          <Aviso>La guía {guia} ya no está en tu ruta. Desliza hacia abajo en Mi ruta para actualizar.</Aviso>
        </Contenido>
      </Pantalla>
    );
  }

  const tieneCoordenadas = p.lat != null && p.lng != null;
  const distancia = distanciaA(p);
  const direccion = direccionCompleta(p, true);
  const detalles = [p.descripcion ?? (p.tamano ? `1 paquete, ${p.tamano.toLowerCase()}` : null), p.peso ? `${p.peso} kg` : null].filter(Boolean) as string[];

  const badgeGps = (() => {
    if (permiso === 'denegado') return { texto: 'Activa la ubicación para registrar la entrega', tono: 'rojo' as const };
    if (!tieneCoordenadas) return { texto: listo ? 'GPS listo, se guardará con la entrega' : 'Buscando GPS…', tono: listo ? 'verde' as const : 'gris' as const };
    if (distancia == null) return { texto: 'Buscando GPS…', tono: 'gris' as const };
    return distancia <= METROS_EN_DOMICILIO
      ? { texto: `Estás en el domicilio, a ${textoDistancia(distancia)}`, tono: 'verde' as const }
      : { texto: `Estás a ${textoDistancia(distancia)} del domicilio`, tono: 'ambar' as const };
  })();

  const abrirMapa = () =>
    Linking.openURL(
      tieneCoordenadas
        ? `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`,
    );

  const puedeEntregar = p.estado === 'en_ruta';

  return (
    <Pantalla>
      <StatusBar style="dark" />
      <Encabezado titulo="Entrega" subtitulo={`Parada ${Math.min(hechos + 1, Math.max(totalDia, 1))} de ${Math.max(totalDia, 1)}`} />
      <Contenido>
        <View style={styles.tarjeta}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Texto peso="semibold" tam={12} color={colores.textoSec}>{p.guia}</Texto>
              <Texto peso="extrabold" tam={20} alto={26}>{nombreDestinatario(p)}</Texto>
            </View>
            {p.telefono ? (
              <Pressable onPress={() => Linking.openURL(`tel:${p.telefono}`)} style={({ pressed }) => [styles.tel, pressed && { backgroundColor: colores.primarioBorde }]} accessibilityLabel={`Llamar a ${nombreDestinatario(p)}`}>
                <Phone size={17} color={colores.primario} strokeWidth={2.2} />
              </Pressable>
            ) : null}
          </View>
          {direccion ? (
            <View style={styles.fila}>
              <MapPin size={14} color={colores.textoTer} strokeWidth={2} style={{ marginTop: 2, marginRight: 7 }} />
              <Texto tam={13.5} color={colores.textoSec} style={{ flex: 1 }}>{direccion}</Texto>
            </View>
          ) : (
            <Texto tam={12.5} color={colores.textoTer} style={{ marginTop: 4 }}>La dirección no viene en los datos del paquete.</Texto>
          )}
          {detalles.length ? (
            <View style={[styles.fila, { marginTop: 10 }]}>
              {detalles.map((d) => <Etiqueta key={d} texto={d} tono="gris" icono={d.endsWith('kg') ? undefined : Package} style={{ marginRight: 6 }} />)}
            </View>
          ) : null}
        </View>

        {p.indicaciones ? <Aviso tono="ambar" titulo="Indicaciones del cliente." style={{ marginTop: 10 }}>{p.indicaciones}</Aviso> : null}

        <Etiqueta texto={badgeGps.texto} tono={badgeGps.tono} icono={Navigation} tam={11.5} style={{ marginTop: 12, paddingHorizontal: 10, paddingVertical: 5 }} />

        {tieneCoordenadas ? (
          <View style={styles.mapa}>
            <MapView
              style={StyleSheet.absoluteFill}
              liteMode
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
              toolbarEnabled={false}
              initialRegion={{ latitude: p.lat!, longitude: p.lng!, latitudeDelta: 0.004, longitudeDelta: 0.004 }}
            >
              <Marker coordinate={{ latitude: p.lat!, longitude: p.lng! }} />
            </MapView>
            <Pressable onPress={abrirMapa} style={styles.abrirMapa}>
              <Navigation size={13} color={colores.tinta} strokeWidth={2.3} style={{ marginRight: 5 }} />
              <Texto peso="bold" tam={12}>Abrir en mapa</Texto>
            </Pressable>
          </View>
        ) : direccion ? (
          <Boton titulo="Abrir en mapa" variante="secundario" icono={Navigation} alto={42} tamTexto={13.5} onPress={abrirMapa} style={{ marginTop: 10 }} />
        ) : null}

        <Texto peso="bold" tam={15} style={{ marginTop: 18, marginBottom: 10 }}>Para cerrar la entrega</Texto>
        <View style={styles.pasos}>
          {PASOS.map((paso, i) => (
            <View key={paso} style={styles.paso}>
              <View style={[styles.numero, i === 0 && styles.numeroActivo]}>
                <Texto peso="bold" tam={11.5} alto={14} color={i === 0 ? colores.blanco : colores.textoSec}>{i + 1}</Texto>
              </View>
              <Texto peso={i === 0 ? 'semibold' : 'regular'} tam={12} alto={15} color={i === 0 ? colores.tinta : colores.textoSec} style={{ flex: 1 }}>{paso}</Texto>
            </View>
          ))}
        </View>

        {!puedeEntregar ? (
          <Aviso style={{ marginTop: 14 }}>
            {p.estado === 'entregado' ? 'Este paquete ya quedó entregado.' : p.estado === 'no_entregado' ? 'Este paquete quedó como no entregado.' : 'Solo se pueden entregar paquetes que están en ruta a tu nombre.'}
          </Aviso>
        ) : null}
      </Contenido>
      {puedeEntregar ? (
        <Pie>
          <Boton icono={Camera} titulo="Tomar foto de entrega" onPress={() => navigation.navigate('FotoEntrega', { guia })} />
          <Boton titulo="No pude entregar" variante="peligro" alto={46} tamTexto={14.5} onPress={() => navigation.navigate('NoPudeEntregar', { guia })} style={{ marginTop: 8 }} />
        </Pie>
      ) : null}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  tarjeta: { backgroundColor: colores.blanco, borderRadius: radios.tarjeta, borderWidth: 1, borderColor: colores.borde, padding: 15 },
  fila: { flexDirection: 'row', marginTop: 4, flexWrap: 'wrap' },
  tel: { width: 42, height: 42, borderRadius: 11, backgroundColor: colores.primarioSuave, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  mapa: { height: 120, borderRadius: radios.tarjeta, overflow: 'hidden', marginTop: 10, backgroundColor: colores.gris },
  abrirMapa: { position: 'absolute', right: 10, bottom: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: colores.blanco, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6 },
  pasos: { flexDirection: 'row' },
  paso: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingRight: 6 },
  numero: { width: 22, height: 22, borderRadius: 11, backgroundColor: colores.gris, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  numeroActivo: { backgroundColor: colores.primario },
});
