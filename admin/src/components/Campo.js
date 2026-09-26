import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { colores, fuentes, radios } from '../theme';
import Texto from './Texto';

export default function Campo({ etiqueta, error, ayuda, icono: Icono, derecha, style, estiloInput, ...props }) {
  const [foco, setFoco] = useState(false);
  return (
    <View style={style}>
      {etiqueta ? <Texto peso="semibold" tam={13} color="#34425E" style={{ marginBottom: 6 }}>{etiqueta}</Texto> : null}
      <View style={[styles.caja, foco && styles.foco, error && { borderColor: colores.rojo }]}>
        {Icono ? <Icono size={16} color={colores.textoSec} strokeWidth={2.1} style={{ marginRight: 9 }} /> : null}
        <TextInput
          placeholderTextColor={colores.textoTer}
          onFocus={(e) => { setFoco(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFoco(false); props.onBlur?.(e); }}
          style={[styles.input, estiloInput]}
          {...props}
        />
        {derecha}
      </View>
      {error ? <Texto tam={12} color={colores.rojo} style={{ marginTop: 5 }}>{error}</Texto> : ayuda ? <Texto tam={12} color={colores.textoSec} style={{ marginTop: 5 }}>{ayuda}</Texto> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  caja: { flexDirection: 'row', alignItems: 'center', height: 44, borderRadius: radios.campo, borderWidth: 1, borderColor: colores.bordeCampo, backgroundColor: colores.blanco, paddingHorizontal: 13 },
  foco: { borderColor: colores.primario, borderWidth: 1.5 },
  input: { flex: 1, height: '100%', fontFamily: fuentes.medium, fontSize: 14.5, color: colores.tinta, outlineStyle: 'none' },
});
