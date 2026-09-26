import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { colores, fuentes } from '../../theme';
import Texto from '../Texto';

// Gráficas sencillas en SVG (react-native-svg): funcionan en navegador y en celular.

function useAncho() {
  const [ancho, setAncho] = useState(0);
  return [ancho, (e) => setAncho(e.nativeEvent.layout.width)];
}

const redondearArriba = (n) => {
  if (n <= 5) return 5;
  const p = 10 ** Math.floor(Math.log10(n));
  return Math.ceil(n / (p / 2)) * (p / 2);
};

/**
 * Barras verticales apiladas por día. series: [{ clave, color, nombre }]
 */
export function BarrasPorDia({ datos, series, etiqueta, alto = 220, onSeleccion }) {
  const [ancho, alLayout] = useAncho();
  const [sel, setSel] = useState(null);
  const izq = 34; const abajo = 26; const arriba = 10;
  const max = redondearArriba(Math.max(1, ...datos.map((d) => series.reduce((s, x) => s + d[x.clave], 0))));
  const util = Math.max(1, ancho - izq - 6);
  const paso = util / Math.max(1, datos.length);
  const anchoBarra = Math.max(3, Math.min(26, paso * 0.62));
  const altoUtil = alto - abajo - arriba;
  const cadaCuanto = Math.ceil(datos.length / Math.max(1, Math.floor(util / 46)));
  const marcas = [0, 0.25, 0.5, 0.75, 1];

  return (
    <View>
      <View style={{ height: alto }} onLayout={alLayout}>
        {ancho > 0 ? (
          <Svg width={ancho} height={alto}>
            {marcas.map((m) => {
              const y = arriba + altoUtil * (1 - m);
              return (
                <G key={m}>
                  <Line x1={izq} x2={ancho} y1={y} y2={y} stroke={colores.gris} strokeWidth={1} />
                  <SvgText x={izq - 8} y={y + 4} fontSize={10.5} fill={colores.textoTer} textAnchor="end" fontFamily={fuentes.medium}>{Math.round(max * m)}</SvgText>
                </G>
              );
            })}
            {datos.map((d, i) => {
              const cx = izq + paso * i + paso / 2;
              let acumulado = 0;
              return (
                <G key={d.clave} onPress={() => { setSel(i); onSeleccion?.(d); }} onPressIn={() => setSel(i)}>
                  <Rect x={cx - paso / 2} y={arriba} width={paso} height={altoUtil} fill={sel === i ? colores.primarioSuave : 'transparent'} />
                  {series.map((s) => {
                    const h = (d[s.clave] / max) * altoUtil;
                    acumulado += h;
                    return <Rect key={s.clave} x={cx - anchoBarra / 2} y={arriba + altoUtil - acumulado} width={anchoBarra} height={Math.max(0, h)} rx={Math.min(3, anchoBarra / 2)} fill={s.color} />;
                  })}
                  {i % cadaCuanto === 0 ? (
                    <SvgText x={cx} y={alto - 8} fontSize={10.5} fill={colores.textoTer} textAnchor="middle" fontFamily={fuentes.medium}>{etiqueta(d)}</SvgText>
                  ) : null}
                </G>
              );
            })}
          </Svg>
        ) : null}
      </View>
      <View style={styles.leyenda}>
        {series.map((s) => (
          <View key={s.clave} style={styles.itemLeyenda}>
            <View style={[styles.cuadro, { backgroundColor: s.color }]} />
            <Texto tam={12} color={colores.textoSec}>{s.nombre}</Texto>
          </View>
        ))}
        {sel != null && datos[sel] ? (
          <Texto tam={12} color={colores.tinta} style={{ marginLeft: 'auto' }}>
            <Texto peso="bold" tam={12}>{etiqueta(datos[sel], true)}: </Texto>
            {series.map((s) => `${datos[sel][s.clave]} ${s.nombre.toLowerCase()}`).join(', ')}
          </Texto>
        ) : null}
      </View>
    </View>
  );
}

/** Barras horizontales: datos [{ etiqueta, valor, detalle? }] */
export function BarrasHorizontales({ datos, color = colores.primario, formato = (v) => String(v) }) {
  const max = Math.max(1, ...datos.map((d) => d.valor));
  return (
    <View>
      {datos.map((d) => (
        <View key={d.etiqueta} style={styles.filaH}>
          <View style={styles.cabezaH}>
            <Texto peso="semibold" tam={13} numberOfLines={1} style={{ flex: 1 }}>{d.etiqueta}</Texto>
            <Texto peso="bold" tam={13}>{formato(d.valor)}</Texto>
          </View>
          <View style={styles.pista}>
            <View style={[styles.relleno, { width: `${(d.valor / max) * 100}%`, backgroundColor: d.color ?? color }]} />
          </View>
          {d.detalle ? <Texto tam={11.5} color={colores.textoSec} style={{ marginTop: 3 }}>{d.detalle}</Texto> : null}
        </View>
      ))}
    </View>
  );
}

/** Dona de porcentaje (0 a 1) */
export function Dona({ valor, tam = 132, grosor = 14, color = colores.primario, texto, subtexto }) {
  const r = (tam - grosor) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: tam, height: tam, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={tam} height={tam} style={StyleSheet.absoluteFill}>
        <Circle cx={tam / 2} cy={tam / 2} r={r} stroke={colores.gris} strokeWidth={grosor} fill="none" />
        <Circle
          cx={tam / 2} cy={tam / 2} r={r} stroke={color} strokeWidth={grosor} fill="none"
          strokeDasharray={`${c * valor} ${c}`} strokeLinecap="round" rotation={-90} origin={`${tam / 2}, ${tam / 2}`}
        />
      </Svg>
      <Texto peso="extrabold" tam={24} alto={28}>{texto}</Texto>
      {subtexto ? <Texto tam={11} color={colores.textoSec}>{subtexto}</Texto> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  leyenda: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 10, gap: 16 },
  itemLeyenda: { flexDirection: 'row', alignItems: 'center' },
  cuadro: { width: 10, height: 10, borderRadius: 3, marginRight: 6 },
  filaH: { marginBottom: 14 },
  cabezaH: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  pista: { height: 8, borderRadius: 4, backgroundColor: colores.gris, overflow: 'hidden' },
  relleno: { height: '100%', borderRadius: 4 },
});
