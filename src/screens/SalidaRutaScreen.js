// Pantalla 7 · Salida a ruta (sin foto)
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Check, Clock, MapPin, ScanLine, Truck } from 'lucide-react-native';
import Aviso from '../components/Aviso';
import Boton from '../components/Boton';
import Encabezado from '../components/Encabezado';
import { Contenido, Pantalla, Pie, TituloSeccion } from '../components/Estructura';
import Texto from '../components/Texto';
import { useApp, useResumenRuta } from '../context/AppContext';
import { useUbicacion } from '../services/ubicacion';
import { colores, radios } from '../theme';
import { hora } from '../utils/formato';

export default function SalidaRutaScreen({ navigation }) {
  const { salirARuta, avisar } = useApp();
  const { enBodega } = useResumenRuta();
  const { ubicacion, permiso } = useUbicacion();
  const [marcados, setMarcados] = useState(() => enBodega.map((p) => p.guia));
  const [enviando, setEnviando] = useState(false);
  const [ahora, setAhora] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const alternar = (guia) => setMarcados((m) => (m.includes(guia) ? m.filter((g) => g !== guia) : [...m, guia]));

  const salir = async () => {
    setEnviando(true);
    // El contrato registra un evento salida_ruta por guía (sin foto).
    await salirARuta(marcados);
    avisar(`Saliste a ruta con ${marcados.length} ${marcados.length === 1 ? 'paquete' : 'paquetes'}`);
    navigation.replace('RutaEnCurso');
  };

  const n = marcados.length;

  return (
    <Pantalla>
      <StatusBar style="dark" />
      <Encabezado titulo="Salir a ruta" />
      <Contenido>
        <Aviso tono="ambar" icono={Truck} titulo="Este paso no lleva foto" bloque>
          Solo se guardan la hora y tu ubicación. Los paquetes quedan en ruta a tu nombre.
        </Aviso>

        {enBodega.length === 0 ? (
          <View style={styles.vacio}>
            <Texto peso="bold" tam={15} centro>No hay paquetes listos para salir</Texto>
            <Texto tam={13} color={colores.textoSec} centro style={{ marginTop: 4, marginBottom: 14 }}>
              Primero registra la llegada a bodega de cada paquete: escanea la guía y toma la foto.
            </Texto>
            <Boton titulo="Escanear guía" icono={ScanLine} variante="secundario" alto={44} tamTexto={14} onPress={() => navigation.replace('EscanearGuia')} style={{ alignSelf: 'center' }} />
          </View>
        ) : (
          <>
            <TituloSeccion derecha={<Texto tam={12.5} color={colores.textoSec}>{n} de {enBodega.length}</Texto>}>Paquetes que llevas</TituloSeccion>
            <View style={styles.lista}>
              {enBodega.map((p, i) => {
                const sel = marcados.includes(p.guia);
                return (
                  <Pressable
                    key={p.guia}
                    onPress={() => alternar(p.guia)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: sel }}
                    style={[styles.fila, i > 0 && styles.sep]}
                  >
                    <View style={[styles.check, sel && styles.checkSel]}>
                      {sel ? <Check size={14} color="#fff" strokeWidth={3} /> : null}
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Texto peso="bold" tam={14.5}>{p.destinatario}</Texto>
                      <Texto tam={12} color={colores.textoSec}>{p.guia}</Texto>
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.meta}>
              <Clock size={13} color={colores.textoSec} strokeWidth={2.2} style={{ marginRight: 5 }} />
              <Texto tam={12} color={colores.textoSec} style={{ marginRight: 16 }}>Hoy, {hora(ahora)}</Texto>
              <MapPin size={13} color={colores.textoSec} strokeWidth={2.2} style={{ marginRight: 5 }} />
              <Texto tam={12} color={colores.textoSec}>{ubicacion?.lugar ?? (permiso === 'denegado' ? 'Sin permiso de ubicación' : 'Buscando ubicación…')}</Texto>
            </View>
          </>
        )}
      </Contenido>
      {enBodega.length > 0 ? (
        <Pie>
          <Boton icono={Truck} titulo={n === 0 ? 'Marca al menos un paquete' : `Salir a ruta con ${n} ${n === 1 ? 'paquete' : 'paquetes'}`} onPress={salir} deshabilitado={n === 0} cargando={enviando} />
        </Pie>
      ) : null}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  lista: { backgroundColor: colores.blanco, borderRadius: radios.tarjeta, borderWidth: 1, borderColor: colores.borde, paddingHorizontal: 13 },
  fila: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11 },
  sep: { borderTopWidth: 1, borderTopColor: colores.gris },
  check: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colores.hueco, alignItems: 'center', justifyContent: 'center' },
  checkSel: { backgroundColor: colores.primario, borderColor: colores.primario },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingLeft: 2 },
  vacio: { paddingTop: 36, paddingHorizontal: 12 },
});
