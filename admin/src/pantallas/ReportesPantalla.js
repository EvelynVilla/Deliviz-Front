// P6 · Reportes: tablero de indicadores del negocio (la parte de Inteligencia de Negocios)
import { useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { CircleCheck, Clock, Package, TriangleAlert, X } from 'lucide-react-native';
import { useReportes } from '../api/consultas';
import Chip from '../components/Chip';
import { Cargando } from '../components/Estados';
import { BarrasHorizontales, BarrasPorDia, Dona } from '../components/graficas/Graficas';
import Pagina from '../components/Pagina';
import Tarjeta from '../components/Tarjeta';
import Texto from '../components/Texto';
import { colores } from '../theme';
import { diaSemanaCorto, fechaCorta, porcentaje } from '../utils/formato';

const RANGOS = [['7', 'Últimos 7 días'], ['14', 'Últimos 14 días'], ['30', 'Últimos 30 días'], ['mes', 'Este mes']];

function rangoDe(clave) {
  const hasta = new Date();
  const desde = new Date(); desde.setHours(0, 0, 0, 0);
  if (clave === 'mes') desde.setDate(1);
  else desde.setDate(desde.getDate() - Number(clave) + 1);
  return { desde, hasta };
}

const horasTexto = (h) => (h == null ? 'Sin datos' : h < 24 ? `${h.toFixed(1)} h` : `${(h / 24).toFixed(1)} días`);

export default function ReportesPantalla() {
  const [clave, setClave] = useState('14');
  const rango = useMemo(() => rangoDe(clave), [clave]);
  const { data, isLoading, isFetching } = useReportes(rango);
  const { width } = useWindowDimensions();
  const ancho = width >= 1150;

  if (isLoading) return <Cargando alto={400} />;
  const t = data.totales;

  const kpis = [
    { icono: CircleCheck, color: colores.verde, fondo: colores.verdeSuave, valor: t.entregas.toLocaleString('es-MX'), titulo: 'Entregas', detalle: `${t.entregasPorDia.toFixed(1)} por día hábil` },
    { icono: Package, color: colores.primario, fondo: colores.primarioSuave, valor: porcentaje(t.primerIntento), titulo: 'Al primer intento', detalle: 'Sin excepción antes de entregar' },
    { icono: X, color: colores.rojo, fondo: colores.rojoSuave, valor: t.excepciones, titulo: 'Excepciones', detalle: 'Nadie recibió, dirección o rechazo' },
    { icono: TriangleAlert, color: colores.ambar, fondo: colores.ambarIcono, valor: t.incidentes, titulo: 'Incidentes', detalle: 'Daños, etiquetas, derrames' },
    { icono: Clock, color: colores.tinta, fondo: colores.gris, valor: horasTexto(t.horasPromedio), titulo: 'De bodega a entrega', detalle: 'Tiempo promedio' },
  ];

  return (
    <Pagina
      titulo="Reportes"
      subtitulo={`Del ${fechaCorta(rango.desde)} al ${fechaCorta(rango.hasta)}${isFetching ? ', actualizando…' : ''}`}
      acciones={<View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: -8 }}>{RANGOS.map(([v, txt]) => <Chip key={v} texto={txt} seleccionado={clave === v} onPress={() => setClave(v)} />)}</View>}
    >
      <View style={styles.kpis}>
        {kpis.map((k) => {
          const Icono = k.icono;
          return (
            <View key={k.titulo} style={[styles.kpi, { minWidth: width < 700 ? '100%' : 200 }]}>
              <View style={[styles.kpiIcono, { backgroundColor: k.fondo }]}><Icono size={17} color={k.color} strokeWidth={2.3} /></View>
              <Texto peso="extrabold" tam={26} alto={32} style={{ marginTop: 12 }}>{k.valor}</Texto>
              <Texto peso="semibold" tam={13.5}>{k.titulo}</Texto>
              <Texto tam={12} color={colores.textoSec}>{k.detalle}</Texto>
            </View>
          );
        })}
      </View>

      <View style={[styles.fila, ancho && { flexDirection: 'row' }]}>
        <Tarjeta titulo="Entregas por día" style={ancho ? { flex: 2 } : null}>
          <BarrasPorDia
            datos={data.serieDias}
            series={[{ clave: 'entregas', nombre: 'Entregas', color: colores.primario }, { clave: 'excepciones', nombre: 'Excepciones', color: '#F29C94' }]}
            etiqueta={(d, largo) => (largo ? `${diaSemanaCorto(d.fecha)} ${fechaCorta(d.fecha)}` : fechaCorta(d.fecha))}
          />
        </Tarjeta>
        <Tarjeta titulo="Entregas al primer intento" style={ancho ? { flex: 1 } : null}>
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <Dona valor={t.primerIntento} tam={160} grosor={16} texto={porcentaje(t.primerIntento)} subtexto="primer intento" />
          </View>
          <Texto tam={12.5} color={colores.textoSec} centro style={{ marginTop: 10 }}>
            De {t.entregas.toLocaleString('es-MX')} entregas, {Math.round(t.entregas * (1 - t.primerIntento))} necesitaron un segundo intento.
          </Texto>
        </Tarjeta>
      </View>

      <View style={[styles.fila, ancho && { flexDirection: 'row' }]}>
        <Tarjeta titulo="Por repartidor" style={ancho ? { flex: 1.4 } : null}>
          <View style={[styles.tablaFila, styles.tablaEnc]}>
            <Th flex={1.5}>Repartidor</Th><Th w={80}>Entregas</Th><Th w={110}>Primer intento</Th><Th w={96}>Excepciones</Th><Th w={90}>Incidentes</Th><Th w={96}>Bodega a entrega</Th>
          </View>
          {data.porRepartidor.map((r) => (
            <View key={r.id} style={styles.tablaFila}>
              <Td flex={1.5} peso="bold">{r.nombre}</Td>
              <Td w={80}>{r.entregas}</Td>
              <Td w={110} color={r.primerIntento < 0.88 ? colores.rojo : colores.tinta}>{porcentaje(r.primerIntento)}</Td>
              <Td w={96}>{r.excepciones}</Td>
              <Td w={90}>{r.incidentes}</Td>
              <Td w={96}>{horasTexto(r.horasPromedio)}</Td>
            </View>
          ))}
        </Tarjeta>
        <Tarjeta titulo="Entregas por repartidor" style={ancho ? { flex: 1 } : null}>
          <BarrasHorizontales datos={data.porRepartidor.map((r) => ({ etiqueta: r.nombre, valor: r.entregas }))} />
        </Tarjeta>
      </View>

      <View style={[styles.fila, width >= 760 && { flexDirection: 'row' }]}>
        <Tarjeta titulo="Excepciones por motivo" style={width >= 760 ? { flex: 1 } : null}>
          {data.motivos.length ? (
            <BarrasHorizontales
              datos={data.motivos.map((m) => ({ ...m, detalle: `${porcentaje(m.valor / t.excepciones, 0)} de las excepciones` }))}
              color={colores.rojo}
            />
          ) : <Texto tam={13} color={colores.textoSec}>Sin excepciones en este periodo.</Texto>}
        </Tarjeta>
        <Tarjeta titulo="Incidentes por tipo" style={width >= 760 ? { flex: 1 } : null}>
          {data.tiposIncidente.length ? (
            <BarrasHorizontales datos={data.tiposIncidente} color={colores.ambar} />
          ) : <Texto tam={13} color={colores.textoSec}>Sin incidentes en este periodo.</Texto>}
          <Texto tam={12} color={colores.textoSec} style={{ marginTop: 4 }}>
            Por repartidor: {data.porRepartidor.filter((r) => r.incidentes).map((r) => `${r.nombre.split(' ')[0]} ${r.incidentes}`).join(', ') || 'ninguno'}.
          </Texto>
        </Tarjeta>
      </View>
    </Pagina>
  );
}

const Th = ({ children, w, flex }) => <Texto peso="bold" tam={11.5} color={colores.textoSec} style={[w ? { width: w, textAlign: 'right' } : { flex }]}>{children}</Texto>;
const Td = ({ children, w, flex, peso = 'medium', color = colores.tinta }) => <Texto peso={peso} tam={13} color={color} style={[w ? { width: w, textAlign: 'right' } : { flex }]} numberOfLines={1}>{children}</Texto>;

const styles = StyleSheet.create({
  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 16 },
  kpi: { flex: 1, backgroundColor: colores.blanco, borderRadius: 16, borderWidth: 1, borderColor: colores.borde, padding: 18 },
  kpiIcono: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  fila: { gap: 16, marginBottom: 16 },
  tablaFila: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: colores.gris, gap: 8 },
  tablaEnc: { borderTopWidth: 0, paddingTop: 0 },
});
