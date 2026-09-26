// Pantalla 15 · Entrega completada
// Confirma el cierre, muestra el avance REAL de la subida de evidencia (cola) y la siguiente parada.
// Nota: el mockup muestra "Cliente avisado por SMS", pero el contrato no tiene ese servicio;
// la tarjeta se agrega cuando exista el endpoint.
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Check, CircleAlert, CloudOff, CloudUpload, MapPin } from 'lucide-react-native';
import BarraAvance from '../components/BarraAvance';
import Boton from '../components/Boton';
import { Contenido, Pantalla, Pie } from '../components/Estructura';
import Texto from '../components/Texto';
import { useResumenRuta } from '../context/AppContext';
import { direccionCompleta, nombreDestinatario } from '../modelo';
import type { PantallaProps } from '../navigation/types';
import { useCola, useItemCola } from '../services/cola';
import { colores, radios } from '../theme';
import { tamanoLegible } from '../utils/fechas';
import { hora } from '../utils/formato';

export default function EntregaCompletadaScreen({ route, navigation }: PantallaProps<'EntregaCompletada'>) {
  const { guia, eventoId, nombreReceptor, fechaCaptura } = route.params;
  const { hechos, totalDia, siguiente } = useResumenRuta();
  const item = useItemCola(eventoId);
  const { sinSenal } = useCola();

  const fotoPaquete = item?.fotos.find((f) => f.tipo === 'paquete');
  const detalleEvidencia = `Foto de ${tamanoLegible(fotoPaquete?.bytes ?? 0)} y firma`;

  const subida = (() => {
    if (!item || item.estado === 'subida') return { titulo: 'Evidencia subida', color: colores.verde, icono: Check, texto: detalleEvidencia, pct: 1 };
    if (item.estado === 'rechazado') return { titulo: 'La API rechazó la entrega', color: colores.rojo, icono: CircleAlert, texto: item.error ?? 'Revisa Pendientes de subir.', pct: item.progreso };
    if (sinSenal && item.estado === 'en_espera') return { titulo: 'Sin señal, guardada en el teléfono', color: colores.ambar, icono: CloudOff, texto: 'Se sube sola al volver la conexión', pct: item.progreso };
    return { titulo: 'Subiendo evidencia', color: colores.primario, icono: CloudUpload, texto: detalleEvidencia, pct: item.progreso };
  })();

  const irA = (ruta: 'RutaEnCurso' | 'DetallePaquete' | 'PendientesSubir') =>
    navigation.reset({
      index: 1,
      routes: [{ name: 'Main' }, ruta === 'DetallePaquete' ? { name: ruta, params: { guia } } : { name: ruta }],
    });

  const Icono = subida.icono;

  return (
    <Pantalla fondo={colores.blanco}>
      <StatusBar style="dark" />
      <Contenido style={{ paddingTop: 36 }}>
        <View style={styles.halo}>
          <View style={styles.circulo}><Check size={34} color="#fff" strokeWidth={3} /></View>
        </View>
        <Texto peso="extrabold" tam={22} alto={28} centro style={{ marginTop: 18 }}>Entrega registrada</Texto>
        <Texto tam={13.5} color={colores.textoSec} centro style={{ marginTop: 4, marginHorizontal: 20 }}>
          {guia} quedó entregado a {nombreReceptor} a las {hora(fechaCaptura)}.
        </Texto>

        <View style={[styles.tarjeta, { marginTop: 24 }]}>
          <View style={styles.fila}>
            <View style={[styles.icono, { backgroundColor: colores.primarioSuave }]}><Icono size={17} color={subida.color} strokeWidth={2.2} /></View>
            <View style={{ flex: 1, marginLeft: 11 }}>
              <Texto peso="bold" tam={14}>{subida.titulo}</Texto>
              <Texto tam={12} color={colores.textoSec} numberOfLines={2}>{subida.texto}</Texto>
            </View>
            {item && item.estado !== 'subida' && item.estado !== 'rechazado' ? (
              <Texto peso="bold" tam={13} color={colores.azulTexto}>{Math.round(subida.pct * 100)}%</Texto>
            ) : null}
          </View>
          <View style={{ marginTop: 10 }}><BarraAvance valor={subida.pct} total={1} alto={5} /></View>
          {item && item.estado !== 'subida' ? (
            <Boton titulo="Ver pendientes de subir" variante="enlace" tamTexto={13} onPress={() => irA('PendientesSubir')} style={{ marginTop: 4 }} />
          ) : null}
        </View>

        <View style={styles.filaAvance}>
          <Texto tam={12.5} color={colores.textoSec}><Texto peso="bold" tam={12.5}>{hechos} de {totalDia}</Texto> entregados</Texto>
          <Texto tam={12.5} color={colores.textoSec}>{Math.max(totalDia - hechos, 0)} pendientes</Texto>
        </View>
        <BarraAvance valor={hechos} total={totalDia} />

        {siguiente ? (
          <View style={[styles.tarjeta, styles.fila, { marginTop: 16 }]}>
            <View style={[styles.icono, { backgroundColor: colores.primarioSuave }]}><MapPin size={17} color={colores.primario} strokeWidth={2.2} /></View>
            <View style={{ flex: 1, marginLeft: 11 }}>
              <Texto tam={12} color={colores.textoSec}>Siguiente parada</Texto>
              <Texto peso="bold" tam={15}>{nombreDestinatario(siguiente)}</Texto>
              <Texto tam={12.5} color={colores.textoSec}>{direccionCompleta(siguiente) || siguiente.guia}</Texto>
            </View>
          </View>
        ) : null}
      </Contenido>
      <Pie style={{ backgroundColor: colores.blanco }}>
        {siguiente ? (
          <Boton titulo="Siguiente parada" onPress={() => irA('RutaEnCurso')} />
        ) : (
          <Boton titulo="Volver a mi ruta" onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })} />
        )}
        <Boton titulo="Ver comprobante" variante="secundario" alto={46} tamTexto={14.5} onPress={() => irA('DetallePaquete')} style={{ marginTop: 8 }} />
      </Pie>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  halo: { alignSelf: 'center', width: 96, height: 96, borderRadius: 48, backgroundColor: colores.verdeSuave, alignItems: 'center', justifyContent: 'center' },
  circulo: { width: 66, height: 66, borderRadius: 33, backgroundColor: colores.verde, alignItems: 'center', justifyContent: 'center' },
  tarjeta: { backgroundColor: colores.blanco, borderRadius: radios.tarjeta, borderWidth: 1, borderColor: colores.borde, padding: 13 },
  fila: { flexDirection: 'row', alignItems: 'center' },
  icono: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  filaAvance: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, marginBottom: 8 },
});
