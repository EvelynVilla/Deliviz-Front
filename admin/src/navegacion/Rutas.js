import * as Linking from 'expo-linking';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EvidenciaPublicaPantalla from '../pantallas/EvidenciaPublicaPantalla';
import LoginPantalla from '../pantallas/LoginPantalla';
import { colores } from '../theme';
import MarcoPanel from './MarcoPanel';
import { useSesion } from './Sesion';

const Stack = createNativeStackNavigator();

// Direcciones del panel en el navegador:
//   /login  /paquetes  /paquetes/DLV-48190  /alertas  /repartidores  /reportes  /ajustes
//   /evidencia/:token  (P8, pública)
export const linking = {
  prefixes: [Linking.createURL('/')],
  config: {
    screens: {
      Login: 'login',
      Panel: {
        path: '',
        screens: {
          Paquetes: 'paquetes',
          Paquete: 'paquetes/:guia',
          Alertas: 'alertas',
          Repartidores: 'repartidores',
          Reportes: 'reportes',
          Ajustes: 'ajustes',
        },
      },
      EvidenciaPublica: 'evidencia/:token',
    },
  },
};

export default function Rutas() {
  const { sesion } = useSesion();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colores.fondo } }}>
      {sesion ? (
        <Stack.Screen name="Panel" component={MarcoPanel} />
      ) : (
        <Stack.Screen name="Login" component={LoginPantalla} options={{ title: 'Iniciar sesión · Deliviz' }} />
      )}
      <Stack.Screen name="EvidenciaPublica" component={EvidenciaPublicaPantalla} options={{ title: 'Evidencia de entrega · Deliviz' }} />
    </Stack.Navigator>
  );
}
