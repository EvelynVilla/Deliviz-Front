// Pantalla 6 · Estado del paquete (revisar foto de llegada)
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Check, Package, TriangleAlert } from 'lucide-react-native';
import Boton from '../components/Boton';
import Encabezado from '../components/Encabezado';
import { Contenido, Pantalla, Pie, TituloSeccion } from '../components/Estructura';
import { FotoGrande } from '../components/FotoEvidencia';
import OpcionRadio, { CuadroIcono } from '../components/OpcionRadio';
import TablaDatos from '../components/TablaDatos';
import { useApp } from '../context/AppContext';
import { colores } from '../theme';
import { fechaHoraCompleta } from '../utils/formato';

const OPCIONES = [
  { clave: 'bien', titulo: 'Bien', detalle: 'Sin golpes ni daños visibles', icono: Check, fondo: colores.verdeSuave, color: colores.verde },
  { clave: 'danado', titulo: 'Dañado', detalle: 'Golpes, roturas o humedad', icono: TriangleAlert, fondo: colores.ambarIcono, color: colores.ambar },
  { clave: 'incompleto', titulo: 'Incompleto', detalle: 'Falta contenido o piezas', icono: Package, fondo: colores.ambarIcono, color: colores.ambar },
];

export default function EstadoPaqueteScreen({ route, navigation }) {
  const { guia, foto, lugar, datos } = route.params;
  const { registrarLlegada, avisar } = useApp();
  const [estado, setEstado] = useState('bien');
  const [enviando, setEnviando] = useState(false);

  const registrar = async () => {
    setEnviando(true);
    try {
      // Evento llegada_bodega del contrato: foto obligatoria + condicion (bien | danado | incompleto).
      await registrarLlegada({ guia, estadoPaquete: estado, foto, datos });
      avisar(`Llegada de ${guia} registrada`);
      navigation.navigate('Main', { screen: 'Ruta', params: { pestana: 'por_recoger', t: Date.now() } });
    } catch {
      avisar('No se pudo guardar la evidencia en el teléfono. Inténtalo de nuevo.', 'alerta');
      setEnviando(false);
    }
  };

  return (
    <Pantalla>
      <StatusBar style="dark" />
      <Encabezado titulo="Revisar foto" subtitulo="Llegada a bodega" />
      <Contenido>
        <FotoGrande fuente={{ uri: foto.uri }} alto={200} onRepetir={() => navigation.goBack()} />

        <TituloSeccion>¿En qué estado llegó?</TituloSeccion>
        {OPCIONES.map((o) => (
          <OpcionRadio
            key={o.clave}
            titulo={o.titulo}
            detalle={o.detalle}
            seleccionada={estado === o.clave}
            onPress={() => setEstado(o.clave)}
            izquierda={<CuadroIcono icono={o.icono} fondo={o.fondo} color={o.color} />}
          />
        ))}

        <TablaDatos
          filas={[
            ['Guía', guia],
            ['Fecha y hora', fechaHoraCompleta(foto.fecha)],
            ['Lugar', lugar],
          ]}
          nota="Se guardan solos y no se pueden editar."
        />
      </Contenido>
      <Pie>
        <Boton titulo="Registrar llegada" onPress={registrar} cargando={enviando} />
      </Pie>
    </Pantalla>
  );
}
