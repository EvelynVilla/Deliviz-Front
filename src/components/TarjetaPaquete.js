import { Pressable, StyleSheet, View } from 'react-native';
import { Camera, CircleCheck, CircleX, Clock, MapPin } from 'lucide-react-native';
import { colores, radios } from '../theme';
import { hora } from '../utils/formato';
import Etiqueta from './Etiqueta';
import Texto from './Texto';

// Tarjeta de la lista "Mi ruta" (pantalla 2). Componente común: también la usa Evelyn.
export default function TarjetaPaquete({ paquete, destacada, onPress }) {
  const p = paquete;
  const etiqueta = etiquetaDe(p, destacada);
  const direccion = [p.direccion, p.colonia].filter(Boolean).join(', ');

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tarjeta, destacada && styles.destacada, pressed && { opacity: 0.85 }]}
      accessibilityRole="button"
      accessibilityLabel={`${p.guia}, ${p.destinatario ?? ''}`}
    >
      <View style={styles.filaSup}>
        <Texto peso="bold" tam={11.5} color={colores.textoSec}>{p.guia}</Texto>
        {etiqueta ? <Etiqueta texto={etiqueta.texto} tono={etiqueta.tono} /> : null}
      </View>
      <Texto peso="bold" tam={16} style={{ marginTop: 4 }}>{p.destinatario ?? 'Destinatario sin registrar'}</Texto>
      {direccion ? (
        <View style={styles.direccion}>
          <MapPin size={13} color={colores.textoTer} strokeWidth={2} style={{ marginTop: 2, marginRight: 7 }} />
          <Texto tam={13} color={colores.textoSec} style={{ flex: 1 }}>{direccion}</Texto>
        </View>
      ) : null}

      <View style={styles.divisor} />

      <View style={styles.filaInf}>
        {p.estado === 'no_entregado' ? (
          <View style={styles.dato}>
            <CircleX size={13} color={colores.rojo} strokeWidth={2.2} style={{ marginRight: 6 }} />
            <Texto peso="medium" tam={12.5} color={colores.rojo}>No entregado</Texto>
          </View>
        ) : p.estado === 'entregado' ? (
          <View style={styles.dato}>
            <CircleCheck size={13} color={colores.verde} strokeWidth={2.2} style={{ marginRight: 6 }} />
            <Texto peso="medium" tam={12.5} color={colores.verdeTexto}>Entregado a las {hora(p.entregadoEn)}</Texto>
          </View>
        ) : (
          <View style={styles.dato}>
            <Clock size={13} color={colores.textoSec} strokeWidth={2.2} style={{ marginRight: 6 }} />
            <Texto peso="medium" tam={12.5} color={colores.textoSec}>{p.ventana ?? 'Sin horario asignado'}</Texto>
          </View>
        )}
        {p.estado !== 'entregado' && p.estado !== 'no_entregado' ? (
          <View style={styles.dato}>
            <Camera size={13} color={colores.azulTexto} strokeWidth={2.2} style={{ marginRight: 5 }} />
            <Texto peso="semibold" tam={12.5} color={colores.azulTexto}>{p.estado === 'por_recoger' ? 'Foto de llegada' : p.estado === 'en_bodega' ? 'Salida sin foto' : p.requiere ?? 'Foto y firma'}</Texto>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function etiquetaDe(p, destacada) {
  if (p.estado === 'en_transferencia') return { texto: `Por aceptar: ${p.transferenciaA ?? 'nuevo responsable'}`, tono: 'ambar' };
  if (p.incidente) return { texto: 'Con reporte', tono: 'ambar' };
  if (destacada) return { texto: 'Próxima parada', tono: 'azul' };
  if (p.estado === 'en_bodega') return { texto: p.estadoFisico === 'bien' ? 'En bodega' : 'En bodega, con daño', tono: p.estadoFisico === 'bien' ? 'verde' : 'ambar' };
  if (p.estado === 'por_recoger' && p.origen) return { texto: p.origen, tono: 'gris' };
  return null;
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: colores.blanco, borderRadius: radios.tarjeta, borderWidth: 1, borderColor: colores.borde,
    paddingHorizontal: 15, paddingTop: 13, paddingBottom: 11, marginBottom: 10,
  },
  destacada: { borderColor: colores.primarioBorde, borderWidth: 1.5, backgroundColor: '#FBFDFF' },
  filaSup: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 22 },
  direccion: { flexDirection: 'row', marginTop: 3 },
  divisor: { height: 1, backgroundColor: colores.gris, marginTop: 10, marginBottom: 9 },
  filaInf: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dato: { flexDirection: 'row', alignItems: 'center' },
});
