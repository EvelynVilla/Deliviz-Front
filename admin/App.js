import { ActivityIndicator, View } from 'react-native';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts, Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold, Figtree_800ExtraBold,
} from '@expo-google-fonts/figtree';
import Rutas, { linking } from './src/navegacion/Rutas';
import { SesionProvider } from './src/navegacion/Sesion';
import { colores } from './src/theme';

const clienteConsultas = new QueryClient({ defaultOptions: { queries: { staleTime: 30000, refetchOnWindowFocus: false } } });

const tema = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colores.fondo, primary: colores.primario, text: colores.tinta, border: colores.borde, card: colores.blanco } };

export default function App() {
  const [listas] = useFonts({ Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold, Figtree_800ExtraBold });
  if (!listas) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colores.primario} /></View>;
  }
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={clienteConsultas}>
        <SesionProvider>
          <NavigationContainer theme={tema} linking={linking} documentTitle={{ formatter: (o) => o?.title ?? 'Deliviz · Panel' }}>
            <StatusBar style="dark" />
            <Rutas />
          </NavigationContainer>
        </SesionProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
