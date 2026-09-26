// Navegación principal (React Navigation 7). Une en un solo flujo las pantallas en JS
// (1 a 10, de Sayuri) y las pantallas en TSX (11 a 17 y recibir transferencia).
//
//   Login → Mi ruta (JS) → Detalle (JS) → Llegada al domicilio (TSX) → Foto de entrega (TSX)
//         → Firma (TSX) → Confirmar (TSX) → Entrega completada (TSX) → Ruta en curso (JS) …
import { ActivityIndicator, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { History, Route, ScanLine, User } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { colores, fuentes } from '../theme';
import type { RootStackParamList, TabsParamList } from './types';

// ---- Pantallas en JavaScript (Sayuri) ----
import DetallePaqueteScreen from '../screens/DetallePaqueteScreen';
import EscanearGuiaScreen from '../screens/EscanearGuiaScreen';
import EstadoPaqueteScreen from '../screens/EstadoPaqueteScreen';
import FotoLlegadaScreen from '../screens/FotoLlegadaScreen';
import HistorialScreen from '../screens/HistorialScreen';
import LoginScreen from '../screens/LoginScreen';
import MiRutaScreen from '../screens/MiRutaScreen';
import PerfilScreen from '../screens/PerfilScreen';
import ReportarProblemaScreen from '../screens/ReportarProblemaScreen';
import RutaEnCursoScreen from '../screens/RutaEnCursoScreen';
import SalidaRutaScreen from '../screens/SalidaRutaScreen';
import TransferirScreen from '../screens/TransferirScreen';

// ---- Pantallas en TypeScript ----
import ConfirmarEntregaScreen from '../screens/ConfirmarEntregaScreen';
import EntregaCompletadaScreen from '../screens/EntregaCompletadaScreen';
import FirmaReceptorScreen from '../screens/FirmaReceptorScreen';
import FotoEntregaScreen from '../screens/FotoEntregaScreen';
import LlegadaDomicilioScreen from '../screens/LlegadaDomicilioScreen';
import NoPudeEntregarScreen from '../screens/NoPudeEntregarScreen';
import PendientesSubirScreen from '../screens/PendientesSubirScreen';
import RecibirTransferenciaScreen from '../screens/RecibirTransferenciaScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabsParamList>();

// La pestaña "Escanear" no tiene pantalla propia: abre el escáner a pantalla completa.
const Vacio = () => <View />;

function PestanasPrincipales() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colores.primario,
        tabBarInactiveTintColor: '#7D8AA3',
        tabBarLabelStyle: { fontFamily: fuentes.semibold, fontSize: 11, lineHeight: 14 },
        tabBarIconStyle: { marginBottom: 1 },
        tabBarStyle: {
          backgroundColor: colores.blanco,
          borderTopColor: colores.borde,
          height: 64 + Math.max(insets.bottom, 8),
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      }}
    >
      <Tabs.Screen name="Ruta" component={MiRutaScreen} options={{ tabBarIcon: ({ color }) => <Route size={22} color={color} strokeWidth={2} /> }} />
      <Tabs.Screen
        name="Escanear"
        component={Vacio}
        options={{ tabBarIcon: ({ color }) => <ScanLine size={22} color={color} strokeWidth={2} /> }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.getParent()?.navigate('EscanearGuia');
          },
        })}
      />
      <Tabs.Screen name="Historial" component={HistorialScreen} options={{ tabBarIcon: ({ color }) => <History size={22} color={color} strokeWidth={2} /> }} />
      <Tabs.Screen name="Perfil" component={PerfilScreen} options={{ tabBarIcon: ({ color }) => <User size={22} color={color} strokeWidth={2} /> }} />
    </Tabs.Navigator>
  );
}

export default function AppNavigator() {
  const { sesion, restaurando } = useApp();

  if (restaurando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.blanco }}>
        <ActivityIndicator color={colores.primario} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colores.fondo } }}>
      {!sesion ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={PestanasPrincipales} />
          <Stack.Screen name="DetallePaquete" component={DetallePaqueteScreen} />

          {/* Llegada a bodega: 4 → 5 → 6 (y escáner para recibir transferencias) */}
          <Stack.Group screenOptions={{ contentStyle: { backgroundColor: colores.camaraFondo } }}>
            <Stack.Screen name="EscanearGuia" component={EscanearGuiaScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="FotoLlegada" component={FotoLlegadaScreen} options={{ animation: 'fade' }} />
          </Stack.Group>
          <Stack.Screen name="EstadoPaquete" component={EstadoPaqueteScreen} />

          {/* 7 a 10 */}
          <Stack.Screen name="SalidaRuta" component={SalidaRutaScreen} />
          <Stack.Screen name="RutaEnCurso" component={RutaEnCursoScreen} />
          <Stack.Screen name="Transferir" component={TransferirScreen} />
          <Stack.Screen name="RecibirTransferencia" component={RecibirTransferenciaScreen} />
          <Stack.Screen name="ReportarProblema" component={ReportarProblemaScreen} />

          {/* Entrega al cliente: 11 → 12 → 13 → 14 → 15, o 11 → 16 */}
          <Stack.Screen name="LlegadaDomicilio" component={LlegadaDomicilioScreen} />
          <Stack.Group screenOptions={{ contentStyle: { backgroundColor: colores.camaraFondo } }}>
            <Stack.Screen name="FotoEntrega" component={FotoEntregaScreen} options={{ animation: 'fade' }} />
          </Stack.Group>
          <Stack.Screen name="FirmaReceptor" component={FirmaReceptorScreen} />
          <Stack.Screen name="ConfirmarEntrega" component={ConfirmarEntregaScreen} />
          <Stack.Screen name="EntregaCompletada" component={EntregaCompletadaScreen} options={{ gestureEnabled: false, animation: 'fade' }} />
          <Stack.Screen name="NoPudeEntregar" component={NoPudeEntregarScreen} />

          {/* 17 */}
          <Stack.Screen name="PendientesSubir" component={PendientesSubirScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
