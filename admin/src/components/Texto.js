import { Text } from 'react-native';
import { colores, fuentes } from '../theme';

// Texto con la tipografía de los mockups (Figtree). Usa `peso` en lugar de fontWeight,
// porque en Android cada grosor es una familia distinta.
export default function Texto({ peso = 'regular', tam = 14, color = colores.tinta, alto, centro, style, children, ...resto }) {
  return (
    <Text
      style={[
        { fontFamily: fuentes[peso], fontSize: tam, color, lineHeight: alto ?? Math.round(tam * 1.35) },
        centro && { textAlign: 'center' },
        style,
      ]}
      {...resto}
    >
      {children}
    </Text>
  );
}
