// P4 · Alertas
import { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Check, Clock, RotateCcw, TriangleAlert, X } from 'lucide-react-native';
import { useAjustes, useAlertas, useMarcarAlerta } from '../api/consultas';
import Boton from '../components/Boton';
import Chip from '../components/Chip';
import { Cargando, Vacio } from '../components/Estados';
import { IconoAlerta, textoAlerta } from '../components/ListaAlertas';
import Pagina from '../components/Pagina';
import Tarjeta from '../components/Tarjeta';
import Texto from '../components/Texto';
import { colores } from '../theme';
import { cuando } from '../utils/formato';

const FILTROS = [['todas', 'Todas'], ['sin_eventos', 'Sin eventos'], ['excepcion', 'Excepciones'], ['incidente', 'Incidentes']];

export default function AlertasPantalla({ navigation }) {
  const { data, isLoading } = useAlertas();
  const { data: ajustes } = useAjustes();
  const marcar = useMarcarAlerta();
  const { width } = useWindowDimensions();
  const [filtro, setFiltro] = useState('todas');
  const [verRevisadas, setVerRevisadas] = useState(false);

  if (isLoading) return <Cargando alto={400} />;

  const activas = data.filter((a) => !a.revisada);
  const lista = data.filter((a) => (filtro === 'todas' || a.tipo === filtro) && (verRevisadas ? a.revisada : !a.revisada));
  const cuenta = (t) => activas.filter((a) => a.tipo === t).length;

  const resumen = [
    { t: 'sin_eventos', titulo: 'Sin eventos', detalle: `Más de ${ajustes?.horasSinEventos ?? '…'} h sin registro`, icono: Clock, color: colores.ambar, fondo: colores.ambarIcono },
    { t: 'excepcion', titulo: 'Excepciones', detalle: 'En las últimas 24 horas', icono: X, color: colores.rojo, fondo: colores.rojoSuave },
    { t: 'incidente', titulo: 'Incidentes', detalle: 'Reportados en las últimas 24 horas', icono: TriangleAlert, color: colores.ambar, fondo: colores.ambarIcono },
  ];

  return (
    <Pagina
      titulo="Alertas"
      subtitulo="Paquetes que necesitan atención: sin eventos, excepciones e incidentes."
      acciones={<Boton titulo="Cambiar horas de alerta" variante="secundario" onPress={() => navigation.navigate('Ajustes')} />}
    >
      <View style={[styles.resumen, width < 760 && { flexDirection: 'column' }]}>
        {resumen.map((r) => {
          const Icono = r.icono;
          const sel = filtro === r.t;
          return (
            <Pressable key={r.t} onPress={() => setFiltro(sel ? 'todas' : r.t)} style={({ hovered }) => [styles.kpi, sel && { borderColor: colores.primario, borderWidth: 1.5 }, hovered && !sel && { borderColor: colores.hueco }]}>
              <View style={[styles.kpiIcono, { backgroundColor: r.fondo }]}><Icono size={18} color={r.color} strokeWidth={2.3} /></View>
              <View style={{ marginLeft: 14, flex: 1 }}>
                <Texto peso="extrabold" tam={26} alto={30}>{cuenta(r.t)}</Texto>
                <Texto peso="semibold" tam={13.5}>{r.titulo}</Texto>
                <Texto tam={12} color={colores.textoSec}>{r.detalle}</Texto>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.filtros}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', flex: 1 }}>
          {FILTROS.map(([v, t]) => <Chip key={v} texto={t} seleccionado={filtro === v} onPress={() => setFiltro(v)} />)}
        </View>
        <Boton titulo={verRevisadas ? 'Ver pendientes' : `Ver revisadas (${data.length - activas.length})`} variante="enlace" tamTexto={13.5} onPress={() => setVerRevisadas((v) => !v)} />
      </View>

      <Tarjeta sinRelleno>
        {lista.length === 0 ? (
          <Vacio titulo={verRevisadas ? 'No hay alertas revisadas' : 'Sin alertas pendientes'} texto={verRevisadas ? 'Las alertas que marques como revisadas aparecen aquí.' : 'Cuando un paquete se quede sin eventos, no se entregue o tenga un problema, aparece aquí.'} />
        ) : lista.map((a, i) => {
          const t = textoAlerta(a);
          return (
            <View key={a.id} style={[styles.fila, i > 0 && styles.sep, width < 760 && { flexDirection: 'column', alignItems: 'flex-start' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <IconoAlerta tono={t.tono} tam={38} />
                <View style={{ marginLeft: 14, flex: 1 }}>
                  <Texto peso="bold" tam={14.5}>{t.titulo}</Texto>
                  <Texto tam={13} color={colores.textoSec}>{t.detalle}</Texto>
                  <Texto tam={12} color={colores.textoTer} style={{ marginTop: 2 }}>{a.repartidor}, {cuando(a.fecha)}</Texto>
                </View>
              </View>
              <View style={[styles.acciones, width < 760 && { marginTop: 10, marginLeft: 52 }]}>
                <Boton titulo="Ver paquete" variante="secundario" alto={36} tamTexto={13} onPress={() => navigation.navigate('Paquete', { guia: a.guia })} />
                <Boton
                  icono={a.revisada ? RotateCcw : Check}
                  titulo={a.revisada ? 'Reabrir' : 'Marcar revisada'}
                  variante={a.revisada ? 'fantasma' : 'secundario'}
                  alto={36} tamTexto={13}
                  onPress={() => marcar.mutate({ id: a.id, revisada: !a.revisada })}
                />
              </View>
            </View>
          );
        })}
      </Tarjeta>
    </Pagina>
  );
}

const styles = StyleSheet.create({
  resumen: { flexDirection: 'row', gap: 14, marginBottom: 18 },
  kpi: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colores.blanco, borderRadius: 16, borderWidth: 1, borderColor: colores.borde, padding: 18 },
  kpiIcono: { width: 42, height: 42, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  filtros: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  fila: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  sep: { borderTopWidth: 1, borderTopColor: colores.gris },
  acciones: { flexDirection: 'row', gap: 8, marginLeft: 16 },
});
