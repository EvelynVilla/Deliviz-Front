// P7 · Ajustes: horas sin eventos para lanzar alerta y catálogo de bodegas
import { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Check, Minus, Pencil, Plus, Warehouse } from 'lucide-react-native';
import { useAjustes, useGuardarAjustes, useGuardarBodega } from '../api/consultas';
import Aviso from '../components/Aviso';
import Boton from '../components/Boton';
import Campo from '../components/Campo';
import Chip from '../components/Chip';
import Dialogo from '../components/Dialogo';
import { Cargando } from '../components/Estados';
import Etiqueta from '../components/Etiqueta';
import Pagina from '../components/Pagina';
import Tarjeta from '../components/Tarjeta';
import Texto from '../components/Texto';
import { colores } from '../theme';
import { coordenadas } from '../utils/formato';

export default function AjustesPantalla() {
  const { data, isLoading } = useAjustes();
  const { width } = useWindowDimensions();
  const [bodega, setBodega] = useState(null); // null | 'nueva' | objeto

  if (isLoading) return <Cargando alto={400} />;
  const ancho = width >= 1000;

  return (
    <Pagina titulo="Ajustes" subtitulo="Reglas de las alertas y bodegas donde se registra la llegada de los paquetes.">
      <View style={[{ gap: 16 }, ancho && { flexDirection: 'row', alignItems: 'flex-start' }]}>
        <HorasAlerta inicial={data.horasSinEventos} style={ancho ? { flex: 1 } : null} />
        <Tarjeta
          titulo="Catálogo de bodegas"
          derecha={<Boton icono={Plus} titulo="Agregar bodega" variante="secundario" alto={34} tamTexto={13} onPress={() => setBodega('nueva')} />}
          style={ancho ? { flex: 1.3 } : null}
        >
          {data.bodegas.map((b, i) => (
            <View key={b.id} style={[styles.bodega, i > 0 && styles.sep]}>
              <View style={styles.icono}><Warehouse size={18} color={colores.textoSec} strokeWidth={2} /></View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Texto peso="bold" tam={14.5}>{b.nombre}</Texto>
                  {!b.activa ? <Etiqueta texto="Inactiva" tono="gris" /> : null}
                </View>
                <Texto tam={12.5} color={colores.textoSec}>{b.direccion}</Texto>
                <Texto tam={12} color={colores.textoTer}>GPS {coordenadas(b.lat, b.lng)}</Texto>
              </View>
              <Boton icono={Pencil} variante="fantasma" alto={34} onPress={() => setBodega(b)} accessibilityLabel={`Editar ${b.nombre}`} />
            </View>
          ))}
        </Tarjeta>
      </View>
      {bodega ? <FormularioBodega bodega={bodega === 'nueva' ? null : bodega} onCerrar={() => setBodega(null)} /> : null}
    </Pagina>
  );
}

function HorasAlerta({ inicial, style }) {
  const [horas, setHoras] = useState(inicial);
  const [guardado, setGuardado] = useState(false);
  const guardar = useGuardarAjustes();
  const cambiar = (h) => { setHoras(Math.min(24, Math.max(1, h))); setGuardado(false); };

  return (
    <Tarjeta titulo="Alerta de paquete sin eventos" style={style}>
      <Texto tam={13.5} color={colores.textoSec}>
        Si un paquete en bodega, en ruta o en transferencia pasa este tiempo sin un registro nuevo, aparece en Alertas.
      </Texto>
      <View style={styles.contador}>
        <Pressable onPress={() => cambiar(horas - 1)} style={({ hovered }) => [styles.paso, hovered && { backgroundColor: colores.gris }]} accessibilityLabel="Menos horas"><Minus size={18} color={colores.tinta} strokeWidth={2.4} /></Pressable>
        <View style={{ alignItems: 'center', width: 120 }}>
          <Texto peso="extrabold" tam={40} alto={46}>{horas}</Texto>
          <Texto tam={13} color={colores.textoSec}>{horas === 1 ? 'hora' : 'horas'}</Texto>
        </View>
        <Pressable onPress={() => cambiar(horas + 1)} style={({ hovered }) => [styles.paso, hovered && { backgroundColor: colores.gris }]} accessibilityLabel="Más horas"><Plus size={18} color={colores.tinta} strokeWidth={2.4} /></Pressable>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
        {[2, 4, 6, 8].map((h) => <Chip key={h} texto={`${h} h`} seleccionado={horas === h} onPress={() => cambiar(h)} />)}
      </View>
      <Aviso style={{ marginTop: 8 }}>Una ruta normal pasa entre 4 y 6 horas sin eventos entre la salida y la entrega. Menos horas dan más alertas.</Aviso>
      <Boton
        icono={guardado ? Check : undefined}
        titulo={guardado ? 'Guardado' : 'Guardar cambio'}
        deshabilitado={horas === inicial && !guardado}
        cargando={guardar.isPending}
        onPress={async () => { await guardar.mutateAsync({ horasSinEventos: horas }); setGuardado(true); }}
        style={{ marginTop: 16, alignSelf: 'flex-start' }}
      />
    </Tarjeta>
  );
}

function FormularioBodega({ bodega, onCerrar }) {
  const guardar = useGuardarBodega();
  const { control, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: bodega
      ? { ...bodega, lat: String(bodega.lat), lng: String(bodega.lng) }
      : { nombre: '', direccion: '', lat: '', lng: '', activa: true },
  });
  const activa = useWatch({ control, name: 'activa' });
  const numero = { required: 'Obligatorio.', validate: (v) => !Number.isNaN(Number(v)) || 'Debe ser un número.' };

  const enviar = async (d) => {
    await guardar.mutateAsync({ ...bodega, ...d, lat: Number(d.lat), lng: Number(d.lng) });
    onCerrar();
  };

  return (
    <Dialogo
      visible
      titulo={bodega ? `Editar ${bodega.nombre}` : 'Agregar bodega'}
      subtitulo="La app usa la ubicación de la bodega para registrar la llegada de los paquetes."
      onCerrar={onCerrar}
      pie={<><Boton titulo="Cancelar" variante="secundario" onPress={onCerrar} /><Boton titulo="Guardar bodega" onPress={handleSubmit(enviar)} cargando={guardar.isPending} /></>}
    >
      <Controller control={control} name="nombre" rules={{ required: 'Escribe el nombre.' }} render={({ field }) => (
        <Campo etiqueta="Nombre" value={field.value} onChangeText={field.onChange} placeholder="Ej. Bodega Sur" error={errors.nombre?.message} />
      )} />
      <Controller control={control} name="direccion" rules={{ required: 'Escribe la dirección.' }} render={({ field }) => (
        <Campo etiqueta="Dirección" value={field.value} onChangeText={field.onChange} error={errors.direccion?.message} style={{ marginTop: 14 }} />
      )} />
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
        <Controller control={control} name="lat" rules={numero} render={({ field }) => (
          <Campo etiqueta="Latitud" value={field.value} onChangeText={field.onChange} placeholder="21.8712" keyboardType="numeric" error={errors.lat?.message} style={{ flex: 1 }} />
        )} />
        <Controller control={control} name="lng" rules={numero} render={({ field }) => (
          <Campo etiqueta="Longitud" value={field.value} onChangeText={field.onChange} placeholder="-102.2981" keyboardType="numeric" error={errors.lng?.message} style={{ flex: 1 }} />
        )} />
      </View>
      {bodega ? (
        <View style={{ flexDirection: 'row', marginTop: 14 }}>
          <Chip texto="Activa" seleccionado={activa} onPress={() => setValue('activa', true)} />
          <Chip texto="Inactiva" seleccionado={!activa} onPress={() => setValue('activa', false)} />
        </View>
      ) : null}
      <View style={{ height: 12 }} />
    </Dialogo>
  );
}

const styles = StyleSheet.create({
  contador: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 18 },
  paso: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: colores.borde, alignItems: 'center', justifyContent: 'center' },
  bodega: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  sep: { borderTopWidth: 1, borderTopColor: colores.gris },
  icono: { width: 40, height: 40, borderRadius: 10, backgroundColor: colores.gris, alignItems: 'center', justifyContent: 'center' },
});
