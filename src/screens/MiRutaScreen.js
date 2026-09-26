// Pantalla 2 · Mi ruta
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeftRight, Bell, ChevronRight, CloudUpload, Map as IconoMapa, ScanLine, Truck, WifiOff } from 'lucide-react-native';
import BarraAvance from '../components/BarraAvance';
import Boton from '../components/Boton';
import { Pantalla, Pie } from '../components/Estructura';
import Pestanas from '../components/Pestanas';
import TarjetaPaquete from '../components/TarjetaPaquete';
import Texto from '../components/Texto';
import { useApp, useResumenRuta } from '../context/AppContext';
import { useCola } from '../services/cola';
import { colores, espacio } from '../theme';
import { fechaLarga, iniciales } from '../utils/formato';

export default function MiRutaScreen({ navigation, route }) {
  const { sesion, transferencias, cargando, cargarRuta, errorRuta } = useApp();
  const { items, sinSenal } = useCola();
  const pendientes = items.filter((i) => i.usuarioId === sesion.repartidor.id && i.estado !== 'subida');
  const r = useResumenRuta();
  const [pestana, setPestana] = useState('en_ruta');
  const repartidor = sesion.repartidor;

  // Otras pantallas pueden pedir que se abra una pestaña (ej. después de registrar una llegada).
  const [ultimaPeticion, setUltimaPeticion] = useState(null);
  if (route.params?.t && route.params.t !== ultimaPeticion) {
    setUltimaPeticion(route.params.t);
    setPestana(route.params.pestana);
  }

  const opciones = [
    { clave: 'por_recoger', titulo: 'Por recoger', cuenta: r.porRecoger.length },
    { clave: 'en_ruta', titulo: 'En ruta', cuenta: r.enRuta.length },
    { clave: 'entregados', titulo: 'Entregados', cuenta: r.entregados.length },
  ];

  const lista = useMemo(
    () => ({ por_recoger: r.porRecoger, en_ruta: r.enRuta, entregados: r.entregados })[pestana],
    [pestana, r],
  );

  const abrir = (p) => navigation.navigate('DetallePaquete', { guia: p.guia });

  const encabezadoLista = (
    <View>
      {pendientes.length ? (
        <Pressable onPress={() => navigation.navigate('PendientesSubir')} style={({ pressed }) => [styles.banner, pressed && { opacity: 0.85 }]}>
          <View style={styles.bannerIcono}>{sinSenal ? <WifiOff size={16} color={colores.ambar} strokeWidth={2.3} /> : <CloudUpload size={16} color={colores.ambar} strokeWidth={2.3} />}</View>
          <View style={{ flex: 1, marginLeft: 11 }}>
            <Texto peso="bold" tam={13.5} color={colores.ambarTexto}>{sinSenal ? 'Sin señal' : 'Subiendo evidencia'}</Texto>
            <Texto tam={12} color={colores.ambarTexto}>
              {pendientes.length} {pendientes.length === 1 ? 'registro pendiente' : 'registros pendientes'} de subir{pendientes.some((i) => i.estado === 'rechazado') ? ', hay rechazos por revisar' : ''}
            </Texto>
          </View>
          <ChevronRight size={18} color={colores.ambarTexto} strokeWidth={2.2} />
        </Pressable>
      ) : null}
      {errorRuta ? <Texto tam={12} color={colores.textoSec} centro style={{ marginBottom: 10 }}>{errorRuta}</Texto> : null}
      {transferencias.map((t) => (
        <Pressable key={t.id} onPress={() => navigation.navigate('RecibirTransferencia', { guia: t.paquete.guia, de: t.de.nombre })} style={({ pressed }) => [styles.banner, pressed && { opacity: 0.85 }]}>
          <View style={styles.bannerIcono}><ArrowLeftRight size={16} color={colores.ambar} strokeWidth={2.3} /></View>
          <View style={{ flex: 1, marginLeft: 11 }}>
            <Texto peso="bold" tam={13.5} color={colores.ambarTexto}>Transferencia por recibir</Texto>
            <Texto tam={12} color={colores.ambarTexto}>{t.de.nombre} te pasa {t.paquete.guia}. Toma la foto para recibirlo.</Texto>
          </View>
          <ChevronRight size={18} color={colores.ambarTexto} strokeWidth={2.2} />
        </Pressable>
      ))}
      {pestana === 'en_ruta' && r.siguiente ? (
        <Pressable onPress={() => navigation.navigate('RutaEnCurso')} style={({ pressed }) => [styles.verMapa, pressed && { backgroundColor: colores.primarioSuave }]}>
          <IconoMapa size={15} color={colores.azulTexto} strokeWidth={2.3} style={{ marginRight: 7 }} />
          <Texto peso="semibold" tam={13} color={colores.azulTexto}>Ver ruta en el mapa</Texto>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <Pantalla>
      <StatusBar style="dark" />
      <View style={styles.cabecera}>
        <View style={styles.filaSaludo}>
          <View style={{ flex: 1 }}>
            <Texto tam={12.5} color={colores.textoSec}>{fechaLarga()}</Texto>
            <Texto peso="extrabold" tam={24} alto={30}>Hola, {repartidor.nombreCorto}</Texto>
          </View>
          <Pressable style={styles.campana} accessibilityLabel="Avisos" onPress={() => transferencias[0] && navigation.navigate('RecibirTransferencia', { guia: transferencias[0].paquete.guia, de: transferencias[0].de.nombre })}>
            <Bell size={18} color={colores.tinta} strokeWidth={2.1} />
            {transferencias.length ? <View style={styles.puntoAviso} /> : null}
          </Pressable>
          <Pressable style={styles.avatar} onPress={() => navigation.navigate('Perfil')} accessibilityLabel="Mi perfil">
            <Texto peso="bold" tam={14} color={colores.blanco}>{iniciales(repartidor.nombre)}</Texto>
          </Pressable>
        </View>

        <View style={styles.filaAvance}>
          <Texto tam={12.5} color={colores.textoSec}>
            <Texto peso="bold" tam={12.5}>{r.hechos} de {r.totalDia}</Texto> entregados
          </Texto>
          <Texto tam={12.5} color={colores.textoSec}>{repartidor.zona ?? repartidor.email}</Texto>
        </View>
        <BarraAvance valor={r.hechos} total={r.totalDia} />
      </View>

      <View style={{ paddingHorizontal: 6 }}>
        <Pestanas opciones={opciones} activa={pestana} onCambiar={setPestana} />
      </View>

      <FlatList
        data={lista}
        keyExtractor={(p) => p.guia}
        ListHeaderComponent={encabezadoLista}
        renderItem={({ item }) => <TarjetaPaquete paquete={item} destacada={pestana === 'en_ruta' && item.guia === r.siguiente?.guia} onPress={() => abrir(item)} />}
        contentContainerStyle={styles.lista}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargarRuta} tintColor={colores.primario} />}
        ListEmptyComponent={<Vacio pestana={pestana} onEscanear={() => navigation.navigate('EscanearGuia')} />}
        showsVerticalScrollIndicator={false}
      />

      {pestana === 'por_recoger' && r.enBodega.length > 0 ? (
        <Pie style={styles.pieLista}>
          <Boton icono={Truck} titulo={`Salir a ruta con ${r.enBodega.length} ${r.enBodega.length === 1 ? 'paquete' : 'paquetes'}`} onPress={() => navigation.navigate('SalidaRuta')} />
        </Pie>
      ) : null}
    </Pantalla>
  );
}

function Vacio({ pestana, onEscanear }) {
  const textos = {
    por_recoger: ['No tienes paquetes en bodega', 'Cuando llegues a bodega, escanea cada guía para registrar su llegada con foto.'],
    en_ruta: ['No llevas paquetes en ruta', 'Registra la llegada a bodega y sal a ruta para verlos aquí.'],
    entregados: ['Todavía no hay entregas hoy', 'Cada entrega cerrada con foto y firma, o registrada como no entregada, aparece aquí.'],
  }[pestana];
  return (
    <View style={styles.vacio}>
      <Texto peso="bold" tam={15} centro>{textos[0]}</Texto>
      <Texto tam={13} color={colores.textoSec} centro style={{ marginTop: 4, marginBottom: 14 }}>{textos[1]}</Texto>
      {pestana !== 'entregados' ? <Boton titulo="Escanear guía" icono={ScanLine} variante="secundario" alto={44} tamTexto={14} onPress={onEscanear} style={{ alignSelf: 'center' }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cabecera: { paddingHorizontal: espacio.pantalla, paddingTop: 8, paddingBottom: 4 },
  filaSaludo: { flexDirection: 'row', alignItems: 'center' },
  campana: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: colores.blanco, borderWidth: 1, borderColor: colores.borde,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  puntoAviso: { position: 'absolute', top: 9, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: colores.rojo, borderWidth: 1.5, borderColor: colores.blanco },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colores.tinta, alignItems: 'center', justifyContent: 'center' },
  filaAvance: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, marginBottom: 8 },
  lista: { paddingHorizontal: espacio.pantalla, paddingTop: 14, paddingBottom: 24 },
  banner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colores.ambarSuave, borderRadius: 14,
    borderWidth: 1, borderColor: '#F6DDB5', paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10,
  },
  bannerIcono: { width: 32, height: 32, borderRadius: 9, backgroundColor: colores.ambarIcono, alignItems: 'center', justifyContent: 'center' },
  verMapa: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 38, borderRadius: 10,
    borderWidth: 1, borderColor: colores.primarioBorde, marginBottom: 10, backgroundColor: colores.blanco,
  },
  vacio: { paddingTop: 40, paddingHorizontal: 20 },
  pieLista: { borderTopWidth: 1, borderTopColor: colores.borde },
});
