// P2 · Lista de paquetes
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react-native';
import { usePaquetes, useRepartidores } from '../api/consultas';
import Boton from '../components/Boton';
import Campo from '../components/Campo';
import Chip from '../components/Chip';
import { Cargando, Vacio } from '../components/Estados';
import EstadoPaquete from '../components/EstadoPaquete';
import Pagina from '../components/Pagina';
import Selector from '../components/Selector';
import Tarjeta from '../components/Tarjeta';
import Texto from '../components/Texto';
import { describir } from '../components/LineaTiempo';
import { colores } from '../theme';
import { cuando } from '../utils/formato';

const ESTADOS = [
  ['todos', 'Todos'], ['por_recoger', 'Por recoger'], ['en_ruta', 'En ruta'], ['en_transferencia', 'En transferencia'],
  ['entregado', 'Entregado'], ['excepcion', 'No entregado'],
];
const FECHAS = [
  { valor: 'hoy', texto: 'Hoy' }, { valor: '7', texto: 'Últimos 7 días' }, { valor: '30', texto: 'Últimos 30 días' }, { valor: 'todo', texto: 'Todo' },
];

function desdeDe(f) {
  if (f === 'todo') return null;
  const d = new Date(); d.setHours(0, 0, 0, 0);
  if (f !== 'hoy') d.setDate(d.getDate() - Number(f));
  return d;
}

export default function PaquetesPantalla({ navigation, route }) {
  const { width } = useWindowDimensions();
  const tabla = width >= 1100;
  const [busqueda, setBusqueda] = useState(route.params?.busqueda ?? '');
  const [ultimaBusqueda, setUltimaBusqueda] = useState(route.params?.t);
  if (route.params?.t && route.params.t !== ultimaBusqueda) { setUltimaBusqueda(route.params.t); setBusqueda(route.params.busqueda ?? ''); }
  const [estado, setEstado] = useState('todos');
  const [repartidorId, setRepartidorId] = useState('todos');
  const [fecha, setFecha] = useState('7');
  const [pagina, setPagina] = useState(1);

  const filtros = useMemo(() => ({ busqueda, estado, repartidorId, desde: desdeDe(fecha), pagina }), [busqueda, estado, repartidorId, fecha, pagina]);
  const { data, isLoading, isFetching } = usePaquetes(filtros);
  const { data: repartidores } = useRepartidores();

  const cambiar = (fn) => (v) => { fn(v); setPagina(1); };
  const abrir = (guia) => navigation.navigate('Paquete', { guia });

  const opcionesRep = [{ valor: 'todos', texto: 'Todos' }, ...(repartidores ?? []).map((r) => ({ valor: r.id, texto: r.nombre }))];

  return (
    <Pagina titulo="Paquetes" subtitulo="Busca una guía para ver su línea de tiempo, el recorrido y la evidencia de entrega.">
      <Tarjeta relleno={18}>
        <View style={styles.filtros}>
          <Campo icono={Search} value={busqueda} onChangeText={cambiar(setBusqueda)} placeholder="Número de guía o destinatario" autoCapitalize="characters" style={{ flexGrow: 1, flexBasis: 260, maxWidth: 380 }} />
          <Selector prefijo="Repartidor" valor={repartidorId} opciones={opcionesRep} onCambiar={cambiar(setRepartidorId)} ancho={250} />
          <Selector prefijo="Fecha" valor={fecha} opciones={FECHAS} onCambiar={cambiar(setFecha)} ancho={210} />
        </View>
        <View style={styles.chips}>
          {ESTADOS.map(([v, t]) => <Chip key={v} texto={t} seleccionado={estado === v} onPress={() => cambiar(setEstado)(v)} />)}
        </View>
      </Tarjeta>

      <View style={styles.resumen}>
        <Texto tam={13} color={colores.textoSec}>
          {data ? `${data.total.toLocaleString('es-MX')} ${data.total === 1 ? 'paquete' : 'paquetes'}` : ' '}{isFetching && !isLoading ? ', actualizando…' : ''}
        </Texto>
      </View>

      <Tarjeta sinRelleno style={{ overflow: 'hidden' }}>
        {isLoading ? <Cargando /> : data.paquetes.length === 0 ? (
          <Vacio titulo="No hay paquetes con esos filtros" texto="Prueba con otra fecha o quita el filtro de estado." accion={<Boton titulo="Quitar filtros" variante="secundario" onPress={() => { setBusqueda(''); setEstado('todos'); setRepartidorId('todos'); setFecha('todo'); setPagina(1); }} />} />
        ) : tabla ? (
          <View>
            <View style={[styles.fila, styles.encabezado]}>
              <Col w={130}><Th>Guía</Th></Col>
              <Col flex={1.2}><Th>Destinatario</Th></Col>
              <Col flex={1.3}><Th>Dirección</Th></Col>
              <Col w={170}><Th>Responsable</Th></Col>
              <Col w={150}><Th>Estado</Th></Col>
              <Col flex={1.1}><Th>Último evento</Th></Col>
            </View>
            {data.paquetes.map((p) => (
              <Pressable key={p.guia} onPress={() => abrir(p.guia)} style={({ hovered }) => [styles.fila, hovered && { backgroundColor: '#F8FAFD' }]} accessibilityRole="link">
                <Col w={130}><Texto peso="bold" tam={13.5} color={colores.azulTexto}>{p.guia}</Texto></Col>
                <Col flex={1.2}><Texto peso="semibold" tam={13.5} numberOfLines={1}>{p.destinatario}</Texto></Col>
                <Col flex={1.3}><Texto tam={13} color={colores.textoSec} numberOfLines={1}>{p.direccion}, {p.colonia}</Texto></Col>
                <Col w={170}><Texto tam={13} numberOfLines={1}>{p.repartidor}</Texto></Col>
                <Col w={150}><EstadoPaquete estado={p.estado} /></Col>
                <Col flex={1.1}>
                  {p.ultimoEvento ? (
                    <>
                      <Texto tam={13} numberOfLines={1}>{describir({ ...p.ultimoEvento, repartidor: p.repartidor, destino: '' }).titulo}</Texto>
                      <Texto tam={12} color={colores.textoSec}>{cuando(p.ultimoEvento.fecha)}</Texto>
                    </>
                  ) : <Texto tam={13} color={colores.textoTer}>Sin eventos todavía</Texto>}
                </Col>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={{ padding: 12 }}>
            {data.paquetes.map((p) => (
              <Pressable key={p.guia} onPress={() => abrir(p.guia)} style={styles.tarjetaMovil}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Texto peso="bold" tam={13.5} color={colores.azulTexto}>{p.guia}</Texto>
                  <EstadoPaquete estado={p.estado} />
                </View>
                <Texto peso="bold" tam={15} style={{ marginTop: 4 }}>{p.destinatario}</Texto>
                <Texto tam={12.5} color={colores.textoSec}>{p.direccion}, {p.colonia}</Texto>
                <Texto tam={12.5} color={colores.textoSec} style={{ marginTop: 4 }}>{p.repartidor}{p.ultimoEvento ? `, ${cuando(p.ultimoEvento.fecha)}` : ''}</Texto>
              </Pressable>
            ))}
          </View>
        )}
      </Tarjeta>

      {data && data.paginas > 1 ? (
        <View style={styles.paginacion}>
          <Boton icono={ChevronLeft} variante="secundario" alto={36} deshabilitado={pagina <= 1} onPress={() => setPagina((x) => x - 1)} accessibilityLabel="Página anterior" />
          <Texto tam={13} color={colores.textoSec} style={{ marginHorizontal: 14 }}>Página {pagina} de {data.paginas}</Texto>
          <Boton icono={ChevronRight} variante="secundario" alto={36} deshabilitado={pagina >= data.paginas} onPress={() => setPagina((x) => x + 1)} accessibilityLabel="Página siguiente" />
        </View>
      ) : null}
    </Pagina>
  );
}

const Col = ({ w, flex, children }) => <View style={[{ paddingHorizontal: 10, justifyContent: 'center' }, w ? { width: w } : { flex }]}>{children}</View>;
const Th = ({ children }) => <Texto peso="bold" tam={12} color={colores.textoSec}>{children}</Texto>;

const styles = StyleSheet.create({
  filtros: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, marginBottom: -8 },
  resumen: { marginTop: 18, marginBottom: 8, paddingLeft: 2 },
  fila: { flexDirection: 'row', alignItems: 'center', minHeight: 60, paddingHorizontal: 10, borderTopWidth: 1, borderTopColor: colores.gris },
  encabezado: { minHeight: 42, backgroundColor: '#F8FAFD', borderTopWidth: 0 },
  tarjetaMovil: { borderWidth: 1, borderColor: colores.borde, borderRadius: 12, padding: 12, marginBottom: 8 },
  paginacion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
});
