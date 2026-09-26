import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, ChartColumn, LogOut, Package, Search, Settings, TriangleAlert, Users } from 'lucide-react-native';
import { useAlertas } from '../api/consultas';
import Texto from '../components/Texto';
import { colores, fuentes, panel } from '../theme';
import { hora, iniciales } from '../utils/formato';
import { useSesion } from './Sesion';

import AjustesPantalla from '../pantallas/AjustesPantalla';
import AlertasPantalla from '../pantallas/AlertasPantalla';
import PaquetePantalla from '../pantallas/PaquetePantalla';
import PaquetesPantalla from '../pantallas/PaquetesPantalla';
import RepartidoresPantalla from '../pantallas/RepartidoresPantalla';
import ReportesPantalla from '../pantallas/ReportesPantalla';

const Stack = createNativeStackNavigator();

const MENU = [
  { ruta: 'Paquetes', texto: 'Paquetes', icono: Package, activoEn: ['Paquetes', 'Paquete'] },
  { ruta: 'Alertas', texto: 'Alertas', icono: TriangleAlert, activoEn: ['Alertas'] },
  { ruta: 'Repartidores', texto: 'Repartidores', icono: Users, activoEn: ['Repartidores'] },
  { ruta: 'Reportes', texto: 'Reportes', icono: ChartColumn, activoEn: ['Reportes'] },
  { ruta: 'Ajustes', texto: 'Ajustes', icono: Settings, activoEn: ['Ajustes'] },
];

// Marco del panel: menú lateral + barra superior + contenido (P2 a P7).
export default function MarcoPanel({ navigation }) {
  const [activa, setActiva] = useState('Paquetes');
  const [guiaActual, setGuiaActual] = useState('');
  const { width } = useWindowDimensions();
  const angosto = width < panel.quiebreAngosto;
  const { data: alertas } = useAlertas();
  const pendientes = alertas?.filter((a) => !a.revisada).length ?? 0;

  const ir = (ruta, params) => navigation.navigate('Panel', { screen: ruta, params });

  return (
    <SafeAreaView style={[styles.raiz, angosto && { flexDirection: 'column' }]} edges={['top', 'left', 'right']}>
      {angosto ? (
        <MenuSuperior activa={activa} ir={ir} pendientes={pendientes} />
      ) : (
        <MenuLateral activa={activa} ir={ir} pendientes={pendientes} />
      )}
      <View style={styles.columna}>
        <BarraSuperior ir={ir} guiaActual={guiaActual} angosto={angosto} pendientes={pendientes} />
        <Stack.Navigator
          screenOptions={{ headerShown: false, animation: 'none', contentStyle: { backgroundColor: colores.fondo } }}
          screenListeners={{
            state: (e) => {
              const s = e.data.state;
              const r = s.routes[s.index];
              setActiva(r.name);
              setGuiaActual(r.name === 'Paquete' ? r.params?.guia ?? '' : '');
            },
          }}
        >
          <Stack.Screen name="Paquetes" component={PaquetesPantalla} options={{ title: 'Paquetes · Deliviz' }} />
          <Stack.Screen name="Paquete" component={PaquetePantalla} options={({ route }) => ({ title: `${route.params?.guia} · Deliviz` })} />
          <Stack.Screen name="Alertas" component={AlertasPantalla} options={{ title: 'Alertas · Deliviz' }} />
          <Stack.Screen name="Repartidores" component={RepartidoresPantalla} options={{ title: 'Repartidores · Deliviz' }} />
          <Stack.Screen name="Reportes" component={ReportesPantalla} options={{ title: 'Reportes · Deliviz' }} />
          <Stack.Screen name="Ajustes" component={AjustesPantalla} options={{ title: 'Ajustes · Deliviz' }} />
        </Stack.Navigator>
      </View>
    </SafeAreaView>
  );
}

function MenuLateral({ activa, ir, pendientes }) {
  const { sesion, salir } = useSesion();
  return (
    <View style={styles.lateral}>
      <View style={styles.marca}>
        <Image source={require('../../assets/logo-simbolo.png')} style={{ width: 34, height: 23 }} resizeMode="contain" />
        <Texto peso="extrabold" tam={21} style={{ marginLeft: 8 }}>
          Deli<Texto peso="extrabold" tam={21} color={colores.primario}>viz</Texto>
        </Texto>
      </View>
      <View style={{ paddingHorizontal: 14 }}>
        {MENU.map((m) => {
          const sel = m.activoEn.includes(activa);
          const Icono = m.icono;
          return (
            <Pressable key={m.ruta} onPress={() => ir(m.ruta)} style={({ hovered }) => [styles.item, sel && styles.itemSel, hovered && !sel && { backgroundColor: colores.fondo }]} accessibilityRole="link" accessibilityState={{ selected: sel }}>
              <Icono size={18} color={sel ? colores.azulTexto : colores.textoSec} strokeWidth={2} />
              <Texto peso={sel ? 'bold' : 'semibold'} tam={14.5} color={sel ? colores.azulTexto : '#34425E'} style={{ marginLeft: 12, flex: 1 }}>{m.texto}</Texto>
              {m.ruta === 'Alertas' && pendientes > 0 ? (
                <View style={styles.contador}><Texto peso="bold" tam={11} color={colores.rojo} alto={14}>{pendientes}</Texto></View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      <View style={{ flex: 1 }} />
      <View style={styles.usuario}>
        <View style={styles.avatar}><Texto peso="bold" tam={13} color="#fff">{iniciales(sesion.admin.nombre)}</Texto></View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Texto peso="bold" tam={13.5}>{sesion.admin.nombre}</Texto>
          <Texto tam={12} color={colores.textoSec}>{sesion.admin.rol}</Texto>
        </View>
        <Pressable onPress={salir} hitSlop={8} style={({ hovered }) => [styles.salir, hovered && { backgroundColor: colores.gris }]} accessibilityLabel="Cerrar sesión">
          <LogOut size={16} color={colores.textoSec} strokeWidth={2.1} />
        </Pressable>
      </View>
    </View>
  );
}

function MenuSuperior({ activa, ir, pendientes }) {
  return (
    <View style={styles.superiorMovil}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 6 }}>
        {MENU.map((m) => {
          const sel = m.activoEn.includes(activa);
          const Icono = m.icono;
          return (
            <Pressable key={m.ruta} onPress={() => ir(m.ruta)} style={[styles.itemMovil, sel && styles.itemSel]}>
              <Icono size={16} color={sel ? colores.azulTexto : colores.textoSec} strokeWidth={2} />
              <Texto peso={sel ? 'bold' : 'semibold'} tam={13} color={sel ? colores.azulTexto : '#34425E'} style={{ marginLeft: 7 }}>{m.texto}{m.ruta === 'Alertas' && pendientes ? ` (${pendientes})` : ''}</Texto>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function BarraSuperior({ ir, guiaActual, angosto, pendientes }) {
  const [texto, setTexto] = useState(guiaActual);
  const [ahora, setAhora] = useState(new Date());
  const [foco, setFoco] = useState(false);
  const [guiaPrevia, setGuiaPrevia] = useState(guiaActual);
  if (guiaActual !== guiaPrevia) { setGuiaPrevia(guiaActual); setTexto(guiaActual); }

  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const buscar = () => {
    const q = texto.trim();
    if (!q) return;
    if (/^DLV-\d{5}$/i.test(q)) ir('Paquete', { guia: q.toUpperCase() });
    else ir('Paquetes', { busqueda: q, t: Date.now() });
  };

  return (
    <View style={[styles.barra, angosto && { paddingHorizontal: 14 }]}>
      <View style={[styles.buscador, foco && { borderColor: colores.primario }]}>
        <Search size={16} color={colores.textoSec} strokeWidth={2.1} />
        <TextInput
          value={texto}
          onChangeText={setTexto}
          onSubmitEditing={buscar}
          onFocus={() => setFoco(true)}
          onBlur={() => setFoco(false)}
          placeholder="Buscar por número de guía o destinatario"
          placeholderTextColor={colores.textoTer}
          autoCapitalize="characters"
          returnKeyType="search"
          style={styles.inputBuscar}
        />
      </View>
      <View style={{ flex: 1 }} />
      <Pressable onPress={() => ir('Alertas')} style={({ hovered }) => [styles.campana, hovered && { backgroundColor: colores.gris }]} accessibilityLabel={`Alertas, ${pendientes} pendientes`}>
        <Bell size={19} color={colores.tinta} strokeWidth={2} />
        {pendientes ? <View style={styles.punto} /> : null}
      </Pressable>
      {!angosto ? <Texto peso="medium" tam={13.5} color={colores.textoSec} style={{ marginLeft: 10 }}>Hoy, {hora(ahora)}</Texto> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, flexDirection: 'row', backgroundColor: colores.fondo },
  lateral: { width: panel.anchoMenu, backgroundColor: colores.blanco, borderRightWidth: 1, borderRightColor: colores.borde, paddingBottom: 16 },
  marca: { flexDirection: 'row', alignItems: 'center', height: panel.altoBarra, paddingHorizontal: 22, marginBottom: 10 },
  item: { flexDirection: 'row', alignItems: 'center', height: 42, borderRadius: 10, paddingHorizontal: 12, marginBottom: 4 },
  itemSel: { backgroundColor: colores.primarioSuave },
  contador: { minWidth: 22, height: 20, borderRadius: 10, paddingHorizontal: 6, backgroundColor: colores.rojoSuave, alignItems: 'center', justifyContent: 'center' },
  usuario: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: colores.borde },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colores.tinta, alignItems: 'center', justifyContent: 'center' },
  salir: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  columna: { flex: 1 },
  barra: { height: panel.altoBarra, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 26, backgroundColor: colores.blanco, borderBottomWidth: 1, borderBottomColor: colores.borde },
  buscador: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, width: 460, height: 40, borderRadius: 10, backgroundColor: colores.fondo, borderWidth: 1, borderColor: colores.borde, paddingHorizontal: 12 },
  inputBuscar: { flex: 1, marginLeft: 9, height: '100%', fontFamily: fuentes.medium, fontSize: 14, color: colores.tinta, outlineStyle: 'none' },
  campana: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  punto: { position: 'absolute', top: 8, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: colores.rojo, borderWidth: 1.5, borderColor: colores.blanco },
  superiorMovil: { backgroundColor: colores.blanco, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colores.borde },
  itemMovil: { flexDirection: 'row', alignItems: 'center', height: 36, borderRadius: 9, paddingHorizontal: 12 },
});
