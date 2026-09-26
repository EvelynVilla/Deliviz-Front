import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { FIRMAS } from '../datos/generador.mjs';
import { colores } from '../theme';

// Firma del receptor. En los datos de prueba es un trazo SVG; en producción es un PNG de S3.
export default function Firma({ indice = 0, ancho = 180, alto = 72, grosor = 2.6 }) {
  return (
    <View style={{ width: ancho, height: alto }}>
      <Svg width="100%" height="100%" viewBox="0 0 200 80" preserveAspectRatio="xMidYMid meet">
        <Path d={FIRMAS[indice % FIRMAS.length]} stroke={colores.tinta} strokeWidth={grosor} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}
