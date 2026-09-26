import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  Figtree_800ExtraBold,
} from '@expo-google-fonts/figtree';
import AvisoFlotante from './src/components/AvisoFlotante';
import { AppProvider } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';
import { colores } from './src/theme';

const tema = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colores.fondo, primary: colores.primario, text: colores.tinta, border: colores.borde, card: colores.blanco },
};

export default function App() {
  const [fuentesListas] = useFonts({ Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold, Figtree_800ExtraBold });

  if (!fuentesListas) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.blanco }}>
        <ActivityIndicator color={colores.primario} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer theme={tema}>
          <StatusBar style="dark" />
          <AppNavigator />
        </NavigationContainer>
        <AvisoFlotante />
      </AppProvider>
    </SafeAreaProvider>
  );
}
