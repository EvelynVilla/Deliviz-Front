// Pantalla 3 · Detalle del paquete (historial)
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeftRight, Package, Phone, ScanLine, TriangleAlert } from 'lucide-react-native';
import Aviso from '../components/Aviso';
import Boton from '../components/Boton';
import Encabezado from '../components/Encabezado';
import { Contenido, Pantalla, Pie, TituloSeccion } from '../components/Estructura';
import Etiqueta from '../components/Etiqueta';
import LineaTiempo, { describirEvento, Leyenda } from '../components/LineaTiempo';
import Texto from '../components/Texto';
import { api } from '../api';
import { usePaquete } from '../context/AppContext';
import { aplicarDatos, direccionCompleta, eventoDesdeHistorial, nombreDestinatario, paqueteVacio } from '../modelo';
import { useCola } from '../services/cola';
import { colores, radios } from '../theme';

const ESTADOS = {
  por_recoger: { texto: 'Por recoger', tono: 'gris' },
  en_bodega: { texto: 'En bodega', tono: 'verde' },
  en_ruta: { texto: 'En ruta', tono: 'azul' },
  en_transferencia: { texto: 'En transferencia', tono: 'ambar' },
  entregado: { texto: 'Entregado', tono: 'verde' },
  no_entregado: { texto: 'No entregado', tono: 'rojo' },
};

export default function DetallePaqueteScreen({ route, navigation }) {
  const { guia } = route.params;
  const local = usePaquete(guia);
  const [remoto, setRemoto] = useState(null);
  const [errorHistorial, setErrorHistorial] = useState(null);
  const [cargando, setCargando] = useState(true);
  const { items: cola } = useCola();
  const conPendientes = cola.some((i) => i.guia === guia && (i.estado === 'en_espera' || i.estado === 'subiendo'));

  // Línea de tiempo del servidor: GET /api/paquetes/{guia}/historial (fotos con URL temporal de 15 min).
  useFocusEffect(
    useCallback(() => {
      let vivo = true;
      setCargando(true);
      api
        .historial(guia)
        .then((h) => { if (vivo) { setRemoto(h); setErrorHistorial(null); } })
        .catch((e) => {
          if (!vivo) return;
          // 404 = el servidor todavía no conoce la guía (su primer evento sigue en la cola).
          setErrorHistorial(e?.tipo === 'no_encontrado' ? null : e?.tipo === 'red' ? 'Sin conexión: se muestra lo guardado en el teléfono.' : e?.message);
        })
        .finally(() => vivo && setCargando(false));
      return () => { vivo = false; };
    }, [guia]),
  );

  const p = useMemo(() => {
    if (!local && !remoto) return null;
    const base = local ?? aplicarDatos(paqueteVacio(guia, remoto.estado), remoto);
    if (!remoto) return base;
    const locales = new Map(base.eventos.map((e) => [e.id, e]));
    const delServidor = remoto.eventos.map((e) => eventoDesdeHistorial(e, locales.get(e.id)));
    const ids = new Set(delServidor.map((e) => e.id));
    const soloLocales = base.eventos.filter((e) => !ids.has(e.id));
    const eventos = [...delServidor, ...soloLocales].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    // Si hay algo en la cola, el estado del teléfono va adelantado al del servidor.
    const estado = conPendientes || base.estado === 'en_transferencia' ? base.estado : remoto.estado;
    return { ...aplicarDatos(base, remoto), eventos, estado };
  }, [local, remoto, guia, conPendientes]);

  if (!p) {
    return (
      <Pantalla>
        <Encabezado titulo={guia} />
        <Contenido>
          {cargando ? <ActivityIndicator color={colores.primario} style={{ marginTop: 30 }} /> : <Aviso>{errorHistorial ?? `No se encontró la guía ${guia}.`}</Aviso>}
        </Contenido>
      </Pantalla>
    );
  }

  const items = p.eventos.map((e) => ({ id: e.id, ...describirEvento(e), foto: e.foto, firma: e.firma, enCola: e.enCola && conPendientes, fotoPendiente: e.fotoPendiente }));
  const ultimo = p.eventos[p.eventos.length - 1];

  if (p.estado === 'en_ruta' && ultimo && ['salida_ruta', 'transferencia', 'transferencia_recibida'].includes(ultimo.tipo)) {
    items.push({ id: 'camino', tipo: 'auto', titulo: 'En camino', detalle: 'Sin cambios de responsable, no se pide foto' });
  }
  const pendiente = {
    por_recoger: { tipo: 'pendiente', titulo: 'Llegada a bodega pendiente', detalle: 'Escanea la guía y toma la foto del paquete' },
    en_bodega: { tipo: 'auto', titulo: 'Salida a ruta pendiente', detalle: 'Se registra al salir, sin foto' },
    en_ruta: { tipo: 'pendiente', titulo: 'Entrega pendiente', detalle: 'Foto y firma del receptor obligatorias' },
    en_transferencia: { tipo: 'pendiente', titulo: `Esperando a ${p.transferenciaA ?? 'nuevo responsable'}`, detalle: 'Sigues siendo el responsable hasta que lo reciba en su app' },
  }[p.estado];
  if (pendiente) items.push({ id: 'pendiente', ...pendiente });

  const estado = ESTADOS[p.estado];

  return (
    <Pantalla>
      <StatusBar style="dark" />
      <Encabezado titulo={p.guia} derecha={<Etiqueta texto={estado.texto} tono={estado.tono} />} />
      <Contenido>
        <View style={styles.cliente}>
          <View style={{ flex: 1 }}>
            <Texto peso="bold" tam={16}>{nombreDestinatario(p)}</Texto>
            {direccionCompleta(p) ? <Texto tam={12.5} color={colores.textoSec} style={{ marginTop: 1 }}>{direccionCompleta(p)}</Texto> : null}
          </View>
          {p.telefono ? <Pressable onPress={() => Linking.openURL(`tel:${p.telefono}`)} style={({ pressed }) => [styles.tel, pressed && { backgroundColor: colores.primarioBorde }]} accessibilityLabel={`Llamar a ${nombreDestinatario(p)}`}>
            <Phone size={17} color={colores.primario} strokeWidth={2.2} />
          </Pressable> : null}
        </View>

        {p.indicaciones && p.estado === 'en_ruta' ? (
          <Aviso tono="ambar" titulo="Indicaciones del cliente." style={{ marginTop: 10 }}>{p.indicaciones}</Aviso>
        ) : null}

        <TituloSeccion derecha={cargando ? <ActivityIndicator size="small" color={colores.primario} /> : null}>Historial del paquete</TituloSeccion>
        {errorHistorial ? <Texto tam={12} color={colores.textoSec} style={{ marginBottom: 10 }}>{errorHistorial}</Texto> : null}
        <LineaTiempo items={items} />
        <Leyenda />
      </Contenido>

      {['entregado', 'no_entregado'].includes(p.estado) || !local ? null : (
      <Pie>
        {p.estado === 'en_ruta' ? (
          <>
            <Boton icono={Package} titulo="Iniciar entrega" onPress={() => navigation.navigate('LlegadaDomicilio', { guia: p.guia })} />
            <View style={styles.dosBotones}>
              <Boton icono={ArrowLeftRight} titulo="Transferir" variante="secundario" alto={46} tamTexto={14} style={{ flex: 1, marginRight: 8 }} onPress={() => navigation.navigate('Transferir', { guia: p.guia })} />
              <Boton icono={TriangleAlert} titulo="Reportar problema" variante="secundario" alto={46} tamTexto={14} style={{ flex: 1 }} onPress={() => navigation.navigate('ReportarProblema', { guia: p.guia })} />
            </View>
          </>
        ) : null}
        {p.estado === 'por_recoger' ? (
          <Boton icono={ScanLine} titulo="Escanear guía" onPress={() => navigation.navigate('EscanearGuia', { guiaEsperada: p.guia })} />
        ) : null}
        {p.estado === 'en_bodega' ? (
          <Boton titulo="Ir a salida a ruta" onPress={() => navigation.navigate('SalidaRuta')} />
        ) : null}
        {p.estado === 'en_transferencia' ? (
          <Aviso>Mientras {p.transferenciaA} no lo reciba en su app (con su foto), el paquete sigue a tu nombre.</Aviso>
        ) : null}
      </Pie>
      )}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  cliente: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colores.blanco, borderRadius: radios.tarjeta,
    borderWidth: 1, borderColor: colores.borde, paddingHorizontal: 15, paddingVertical: 13,
  },
  tel: { width: 42, height: 42, borderRadius: 11, backgroundColor: colores.primarioSuave, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  dosBotones: { flexDirection: 'row', marginTop: 8 },
});
