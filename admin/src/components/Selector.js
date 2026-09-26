import { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { colores, radios } from '../theme';
import Texto from './Texto';

// Menú desplegable simple: opciones [{ valor, texto }].
export default function Selector({ valor, opciones, onCambiar, prefijo, ancho = 200, style }) {
  const [abierto, setAbierto] = useState(false);
  const [pos, setPos] = useState(null);
  const actual = opciones.find((o) => o.valor === valor);
  const ancla = useRef(null);

  const abrir = () => {
    ancla.current?.measureInWindow((x, y, w, h) => { setPos({ x, y: y + h + 4, w }); setAbierto(true); });
  };

  return (
    <View style={style}>
      <Pressable ref={ancla} onPress={abrir} style={({ hovered }) => [styles.boton, { width: ancho }, hovered && { borderColor: colores.hueco }]} accessibilityRole="button">
        <Texto tam={13.5} color={colores.textoSec} numberOfLines={1} style={{ flex: 1 }}>
          {prefijo ? `${prefijo}: ` : ''}<Texto peso="semibold" tam={13.5}>{actual?.texto}</Texto>
        </Texto>
        <ChevronDown size={16} color={colores.textoSec} strokeWidth={2.2} />
      </Pressable>
      <Modal visible={abierto} transparent animationType="fade" onRequestClose={() => setAbierto(false)}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setAbierto(false)} />
        {pos ? (
          <View style={[styles.menu, { left: pos.x, top: pos.y, width: Math.max(pos.w, 200) }]}>
            <ScrollView style={{ maxHeight: 320 }}>
              {opciones.map((o) => (
                <Pressable key={String(o.valor)} onPress={() => { onCambiar(o.valor); setAbierto(false); }} style={({ hovered }) => [styles.opcion, hovered && { backgroundColor: colores.fondo }]}>
                  <Texto peso={o.valor === valor ? 'bold' : 'medium'} tam={13.5} style={{ flex: 1 }}>{o.texto}</Texto>
                  {o.valor === valor ? <Check size={15} color={colores.primario} strokeWidth={2.6} /> : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  boton: { flexDirection: 'row', alignItems: 'center', height: 40, borderRadius: radios.campo, borderWidth: 1, borderColor: colores.bordeCampo, backgroundColor: colores.blanco, paddingHorizontal: 12 },
  menu: {
    position: 'absolute', backgroundColor: colores.blanco, borderRadius: 12, borderWidth: 1, borderColor: colores.borde, paddingVertical: 6,
    shadowColor: '#0D1D3E', shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  opcion: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9 },
});
