import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { colores, fuentes } from '../theme';
import Texto from './Texto';

// Mapa del recorrido (P3). Dibuja cada evento con ubicación en su lugar, unidos por una línea.
// Es un plano esquemático en SVG con el estilo del mockup: funciona igual en web y en celular
// sin llaves de Google Maps. Las posiciones sí salen de la latitud y longitud reales.
export default function MapaRecorrido({ puntos, alto = 230 }) {
  const [ancho, setAncho] = useState(0);
  const pad = 46;

  const lats = puntos.map((p) => p.lat);
  const lngs = puntos.map((p) => p.lng);
  let [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
  // Evita divisiones entre cero cuando todos los puntos están juntos
  if (maxLat - minLat < 0.004) { minLat -= 0.002; maxLat += 0.002; }
  if (maxLng - minLng < 0.004) { minLng -= 0.002; maxLng += 0.002; }

  const x = (lng) => pad + ((lng - minLng) / (maxLng - minLng)) * Math.max(1, ancho - pad * 2);
  const y = (lat) => pad + 10 + ((maxLat - lat) / (maxLat - minLat)) * (alto - pad * 2 - 10);

  // Trazo en "L" entre puntos, como calles
  const trazo = [];
  puntos.forEach((p, i) => {
    const px = x(p.lng); const py = y(p.lat);
    if (i > 0) trazo.push(`${px},${y(puntos[i - 1].lat)}`);
    trazo.push(`${px},${py}`);
  });

  const calles = [];
  for (let cx = 55; cx < ancho; cx += 130) calles.push(<Rect key={`v${cx}`} x={cx} y={0} width={10} height={alto} fill="#FFFFFF" />);
  for (let cy = 30; cy < alto; cy += 50) calles.push(<Rect key={`h${cy}`} x={0} y={cy} width={ancho} height={8} fill="#FFFFFF" />);

  return (
    <View style={[styles.base, { height: alto }]} onLayout={(e) => setAncho(e.nativeEvent.layout.width)}>
      {ancho > 0 ? (
        <Svg width={ancho} height={alto}>
          <Rect x={0} y={0} width={ancho} height={alto} fill="#E4EAF3" />
          <Path d={`M0 ${alto * 0.52} C ${ancho * 0.3} ${alto * 0.44}, ${ancho * 0.6} ${alto * 0.62}, ${ancho} ${alto * 0.5}`} stroke="#CFE3F6" strokeWidth={16} fill="none" />
          {calles}
          <Rect x={ancho * 0.52} y={alto * 0.42} width={ancho * 0.16} height={alto * 0.2} fill="#DCEFD9" />
          <Line x1={0} y1={alto * 0.96} x2={ancho} y2={alto * 0.2} stroke="#FFFFFF" strokeWidth={16} />
          <SvgText x={ancho * 0.53} y={alto * 0.54} fontSize={10} fill="#5E9B63" fontFamily={fuentes.medium}>Parque Rodolfo Landeros</SvgText>
          <SvgText x={ancho * 0.3} y={alto * 0.3} fontSize={10} fill="#7A869C" fontFamily={fuentes.medium}>Calle Nieto</SvgText>
          <SvgText x={ancho * 0.72} y={alto * 0.74} fontSize={10} fill="#7A869C" fontFamily={fuentes.medium}>Av. Aguascalientes Sur</SvgText>

          {puntos.length > 1 ? <Polyline points={trazo.join(' ')} stroke={colores.primario} strokeWidth={5} fill="none" strokeLinejoin="round" strokeLinecap="round" /> : null}

          {puntos.map((p, i) => {
            const px = x(p.lng); const py = y(p.lat);
            if (i === 0) return <Rect key={i} x={px - 8} y={py - 8} width={16} height={16} rx={3} fill={colores.caja} stroke="#fff" strokeWidth={2} />;
            if (i === puntos.length - 1 && p.final) {
              return (
                <G key={i}>
                  <Circle cx={px} cy={py} r={9} fill={p.final === 'entrega' ? colores.verde : colores.rojo} stroke="#fff" strokeWidth={2} />
                  <Path d={p.final === 'entrega' ? `M${px - 4} ${py} l3 3 l5 -6` : `M${px - 3.5} ${py - 3.5} l7 7 M${px + 3.5} ${py - 3.5} l-7 7`} stroke="#fff" strokeWidth={2} fill="none" strokeLinecap="round" />
                </G>
              );
            }
            return <Circle key={i} cx={px} cy={py} r={7} fill="#fff" stroke={colores.tinta} strokeWidth={3} />;
          })}
        </Svg>
      ) : null}
      <View style={styles.chip}>
        <Texto peso="bold" tam={12}>Recorrido, {puntos.length} {puntos.length === 1 ? 'punto' : 'puntos'} con ubicación</Texto>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colores.borde, backgroundColor: '#E4EAF3' },
  chip: {
    position: 'absolute', top: 12, left: 12, backgroundColor: colores.blanco, borderRadius: 8, paddingHorizontal: 11, paddingVertical: 6,
    shadowColor: '#0D1D3E', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
});
