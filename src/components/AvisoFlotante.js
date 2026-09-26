import { useEffect, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleCheck, TriangleAlert } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { colores } from '../theme';
import Texto from './Texto';

// Confirmación breve después de registrar algo ("Llegada registrada", "Reporte enviado").
export default function AvisoFlotante() {
  const { aviso } = useApp();
  const insets = useSafeAreaInsets();
  const [y] = useState(() => new Animated.Value(-120));

  useEffect(() => {
    Animated.spring(y, { toValue: aviso ? 0 : -120, useNativeDriver: true, friction: 9 }).start();
  }, [aviso, y]);

  const Icono = aviso?.tono === 'alerta' ? TriangleAlert : CircleCheck;
  return (
    <Animated.View pointerEvents="none" style={[styles.base, { top: insets.top + 8, transform: [{ translateY: y }] }]}>
      <Icono size={17} color={aviso?.tono === 'alerta' ? '#FFC45C' : '#5BE39B'} strokeWidth={2.4} style={{ marginRight: 9 }} />
      <Texto peso="semibold" tam={13.5} color={colores.blanco} style={{ flexShrink: 1 }}>{aviso?.texto}</Texto>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    position: 'absolute', left: 18, right: 18, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colores.tinta, borderRadius: 14, paddingHorizontal: 15, paddingVertical: 12,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
});
