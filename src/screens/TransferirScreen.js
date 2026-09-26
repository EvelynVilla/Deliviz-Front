// Pantalla 9 · Transferir paquete
import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeftRight, Camera, ScanLine, Warehouse } from 'lucide-react-native';
import Aviso from '../components/Aviso';
import Boton from '../components/Boton';
import CapturaFoto from '../components/CapturaFoto';
import Chip from '../components/Chip';
import Encabezado from '../components/Encabezado';
import { Contenido, Pantalla, Pie, TituloSeccion } from '../components/Estructura';
import Etiqueta from '../components/Etiqueta';
import { FotoTomadaFila, TomarFotoVacio } from '../components/FotoEvidencia';
import OpcionRadio from '../components/OpcionRadio';
import TarjetaGuia from '../components/TarjetaGuia';
import Texto from '../components/Texto';
import { useApp, usePaquete } from '../context/AppContext';
import { USAR_MOCK } from '../api';
import { destinosTransferencia } from '../data/mock';
import { useUbicacion } from '../services/ubicacion';
import { colores } from '../theme';
import { iniciales } from '../utils/formato';

const MOTIVOS = ['Cambio de zona', 'Ruta saturada', 'Falla en la unidad'];

export default function TransferirScreen({ route, navigation }) {
  const p = usePaquete(route.params.guia);
  const { sesion, transferir, avisar } = useApp();
  const { ubicacion, listo } = useUbicacion();
  const destinos = destinosTransferencia.filter((d) => d.id !== sesion.repartidor.numero);
  const [destino, setDestino] = useState(destinos[0]);
  const [motivo, setMotivo] = useState(null);
  const [foto, setFoto] = useState(null);
  const [camara, setCamara] = useState(false);
  const [enviando, setEnviando] = useState(false);

  if (!p) return null;
  // Con la API real no hay endpoint para quien entrega: ver TransferirSegunContrato.
  if (!USAR_MOCK) return <TransferirSegunContrato paquete={p} onListo={() => navigation.goBack()} />;

  const listoParaEnviar = destino && motivo && foto;
  const faltante = !motivo ? 'Elige el motivo' : !foto ? 'Falta la foto del paquete' : null;

  const confirmar = async () => {
    setEnviando(true);
    await transferir({ guia: p.guia, destino, motivo, foto });
    avisar(`Aviso guardado. ${destino.tipo === 'bodega' ? 'La bodega' : destino.nombre.split(' ')[0]} debe recibirlo con foto en su app.`);
    navigation.goBack();
  };

  const nombreCorto = destino?.tipo === 'bodega' ? destino.nombre : destino?.nombre.split(' ')[0];

  return (
    <Pantalla>
      <StatusBar style="dark" />
      <Encabezado titulo="Transferir paquete" />
      <Contenido>
        <TarjetaGuia paquete={p} />

        <TituloSeccion>Nuevo responsable</TituloSeccion>
        {destinos.map((d) => (
          <OpcionRadio
            key={d.id}
            titulo={d.nombre}
            detalle={d.detalle}
            seleccionada={destino?.id === d.id}
            onPress={() => setDestino(d)}
            izquierda={
              d.tipo === 'bodega' ? (
                <View style={[styles.avatar, { backgroundColor: colores.gris }]}><Warehouse size={17} color={colores.textoSec} strokeWidth={2.1} /></View>
              ) : (
                <View style={styles.avatar}><Texto peso="bold" tam={13} color="#fff">{iniciales(d.nombre)}</Texto></View>
              )
            }
          />
        ))}

        <TituloSeccion style={{ marginTop: 10 }}>Motivo</TituloSeccion>
        <View style={styles.chips}>
          {MOTIVOS.map((m) => <Chip key={m} texto={m} seleccionado={motivo === m} onPress={() => setMotivo(m)} />)}
        </View>

        <TituloSeccion style={{ marginTop: 10 }} derecha={<Etiqueta texto="Obligatoria" tono="azulLleno" icono={Camera} />}>Foto del paquete</TituloSeccion>
        {foto ? (
          <FotoTomadaFila foto={foto} onRepetir={() => setCamara(true)} />
        ) : (
          <TomarFotoVacio texto="Tomar foto del paquete" onPress={() => setCamara(true)} />
        )}

        <Aviso style={{ marginTop: 12 }}>
          {destino?.tipo === 'bodega'
            ? `${destino.nombre} debe recibirlo al escanearlo. Hasta entonces sigues siendo el responsable.`
            : `${nombreCorto} debe recibirlo con foto en su app. Hasta entonces sigues siendo el responsable.`}
        </Aviso>
      </Contenido>
      <Pie>
        <Boton titulo={faltante ?? 'Confirmar transferencia'} onPress={confirmar} deshabilitado={!listoParaEnviar} cargando={enviando} />
      </Pie>

      <Modal visible={camara} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setCamara(false)}>
        <CapturaFoto
          contexto={`Transferencia, ${p.guia}`}
          instruccion="Encuadra el paquete completo y deja la guía a la vista."
          textoGps={listo ? `GPS listo, ${ubicacion?.lugar ?? 'ubicación activa'}` : 'Buscando GPS…'}
          gpsListo={listo}
          onCerrar={() => setCamara(false)}
          onCapturar={(f) => { setFoto(f); setCamara(false); }}
        />
      </Modal>
    </Pantalla>
  );
}

// Según el contrato, el evento "transferencia" lo registra quien RECIBE el paquete (con su foto),
// y hasta entonces el paquete sigue a nombre de quien lo trae. Este lado no llama a la API.
function TransferirSegunContrato({ paquete, onListo }) {
  return (
    <Pantalla>
      <StatusBar style="dark" />
      <Encabezado titulo="Transferir paquete" />
      <Contenido>
        <TarjetaGuia paquete={paquete} />
        <TituloSeccion>Cómo se transfiere</TituloSeccion>
        <View style={styles.paso}>
          <View style={styles.numero}><Texto peso="bold" tam={12} color="#fff">1</Texto></View>
          <Texto tam={14} style={{ flex: 1 }}>Entrega el paquete en mano al otro repartidor o en la segunda bodega.</Texto>
        </View>
        <View style={styles.paso}>
          <View style={styles.numero}><Texto peso="bold" tam={12} color="#fff">2</Texto></View>
          <Texto tam={14} style={{ flex: 1 }}>
            Quien lo recibe abre <Texto peso="bold" tam={14}>Escanear → Recibir transferencia</Texto>, escanea {paquete.guia} y toma la foto.
          </Texto>
        </View>
        <View style={styles.paso}>
          <View style={styles.numero}><Texto peso="bold" tam={12} color="#fff">3</Texto></View>
          <Texto tam={14} style={{ flex: 1 }}>En cuanto se registre, el paquete sale de tu ruta al actualizar la lista.</Texto>
        </View>
        <Aviso tono="azul" icono={ArrowLeftRight} style={{ marginTop: 14 }}>
          Hasta que el otro repartidor lo registre, sigues siendo el responsable del paquete.
        </Aviso>
      </Contenido>
      <Pie>
        <Boton icono={ScanLine} titulo="Entendido" onPress={onListo} />
      </Pie>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  paso: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  numero: { width: 24, height: 24, borderRadius: 12, backgroundColor: colores.primario, alignItems: 'center', justifyContent: 'center', marginRight: 10, marginTop: 1 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colores.tinta, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
});
