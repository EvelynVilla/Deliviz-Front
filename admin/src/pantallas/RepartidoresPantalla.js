// P5 · Repartidores: lista, alta y edición de cuentas, con sus paquetes asignados
import { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Pencil, RotateCcw, UserPlus } from 'lucide-react-native';
import { siguienteNumeroRepartidor } from '../api/cliente';
import { useGuardarRepartidor, useRepartidores } from '../api/consultas';
import Aviso from '../components/Aviso';
import Boton from '../components/Boton';
import Campo from '../components/Campo';
import Chip from '../components/Chip';
import Dialogo from '../components/Dialogo';
import { Cargando, Vacio } from '../components/Estados';
import EstadoPaquete from '../components/EstadoPaquete';
import Etiqueta from '../components/Etiqueta';
import Pagina from '../components/Pagina';
import Tarjeta from '../components/Tarjeta';
import Texto from '../components/Texto';
import { colores } from '../theme';
import { iniciales } from '../utils/formato';

const ZONAS = ['Zona centro', 'Zona norte', 'Zona sur', 'Zona oriente', 'Zona poniente'];

const contrasenaInicial = () => {
  const letras = 'abcdefghjkmnpqrstuvwxyz';
  let s = '';
  for (let i = 0; i < 4; i++) s += letras[Math.floor(Math.random() * letras.length)];
  return `${s}${Math.floor(1000 + Math.random() * 9000)}`;
};

export default function RepartidoresPantalla({ navigation }) {
  const { data, isLoading } = useRepartidores();
  const { width } = useWindowDimensions();
  const [seleccion, setSeleccion] = useState(null);
  const [editando, setEditando] = useState(null); // null | 'nuevo' | repartidor
  const [creado, setCreado] = useState(null);

  if (isLoading) return <Cargando alto={400} />;
  const actual = data.find((r) => r.id === seleccion) ?? data[0];
  const ancho = width >= 1100;

  return (
    <Pagina
      titulo="Repartidores"
      subtitulo="Las cuentas se crean aquí: los repartidores no se pueden registrar desde la app."
      acciones={<Boton icono={UserPlus} titulo="Nuevo repartidor" onPress={() => setEditando('nuevo')} />}
    >
      {creado ? (
        <Aviso tono="azul" style={{ marginBottom: 16 }} titulo={`Cuenta creada para ${creado.nombre}.`}>
          Número de repartidor {creado.id}, contraseña inicial {creado.contrasena}. Compártelos en persona; podrá cambiar la contraseña después.
        </Aviso>
      ) : null}

      <View style={[{ gap: 16 }, ancho && { flexDirection: 'row', alignItems: 'flex-start' }]}>
        <Tarjeta sinRelleno style={ancho ? { flex: 1.25 } : null}>
          <View style={[styles.fila, styles.encabezado]}>
            <Texto peso="bold" tam={12} color={colores.textoSec} style={{ flex: 1.4 }}>Repartidor</Texto>
            <Texto peso="bold" tam={12} color={colores.textoSec} style={{ flex: 1 }}>Zona</Texto>
            <Texto peso="bold" tam={12} color={colores.textoSec} style={{ width: 90, textAlign: 'center' }}>Asignados</Texto>
            <Texto peso="bold" tam={12} color={colores.textoSec} style={{ width: 110, textAlign: 'center' }}>Entregados hoy</Texto>
          </View>
          {data.map((r) => {
            const sel = r.id === actual?.id;
            return (
              <Pressable key={r.id} onPress={() => setSeleccion(r.id)} style={({ hovered }) => [styles.fila, sel && { backgroundColor: colores.primarioSuave }, hovered && !sel && { backgroundColor: '#F8FAFD' }]}>
                <View style={{ flex: 1.4, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.avatar, !r.activo && { backgroundColor: colores.hueco }]}><Texto peso="bold" tam={12.5} color="#fff">{iniciales(r.nombre)}</Texto></View>
                  <View style={{ marginLeft: 11, flex: 1 }}>
                    <Texto peso="bold" tam={14}>{r.nombre}</Texto>
                    <Texto tam={12} color={colores.textoSec}>{r.id}{r.activo ? '' : ', cuenta desactivada'}</Texto>
                  </View>
                </View>
                <Texto tam={13} color={colores.textoSec} style={{ flex: 1 }}>{r.zona}</Texto>
                <Texto peso="bold" tam={14} style={{ width: 90, textAlign: 'center' }}>{r.asignados.length}</Texto>
                <Texto peso="bold" tam={14} style={{ width: 110, textAlign: 'center' }}>{r.entregadosHoy}</Texto>
              </Pressable>
            );
          })}
        </Tarjeta>

        {actual ? (
          <Tarjeta
            titulo={actual.nombre}
            derecha={<Boton icono={Pencil} titulo="Editar" variante="secundario" alto={34} tamTexto={13} onPress={() => setEditando(actual)} />}
            style={ancho ? { flex: 1 } : null}
          >
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: -6, marginBottom: 14 }}>
              <Etiqueta texto={actual.id} tono="gris" />
              <Etiqueta texto={actual.zona} tono="azul" />
              <Etiqueta texto={actual.activo ? 'Activo' : 'Desactivado'} tono={actual.activo ? 'verde' : 'rojo'} />
            </View>
            <Texto tam={13} color={colores.textoSec}>Teléfono: <Texto peso="semibold" tam={13}>{actual.telefono}</Texto></Texto>

            <Texto peso="bold" tam={14.5} style={{ marginTop: 18, marginBottom: 6 }}>Paquetes asignados ({actual.asignados.length})</Texto>
            {actual.asignados.length === 0 ? (
              <Vacio titulo="Sin paquetes asignados" texto="Aquí aparecen los paquetes por recoger, en bodega o en ruta a su nombre." />
            ) : actual.asignados.map((p, i) => (
              <Pressable key={p.guia} onPress={() => navigation.navigate('Paquete', { guia: p.guia })} style={({ hovered }) => [styles.paquete, i > 0 && styles.sep, hovered && { backgroundColor: '#FAFBFD' }]}>
                <View style={{ flex: 1 }}>
                  <Texto peso="bold" tam={13.5} color={colores.azulTexto}>{p.guia}</Texto>
                  <Texto tam={12.5} color={colores.textoSec} numberOfLines={1}>{p.destinatario}, {p.colonia}</Texto>
                </View>
                <EstadoPaquete estado={p.estado} />
              </Pressable>
            ))}
          </Tarjeta>
        ) : null}
      </View>

      {editando ? (
        <FormularioRepartidor
          repartidor={editando === 'nuevo' ? null : editando}
          onCerrar={() => setEditando(null)}
          onCreado={(r) => { setCreado(r); setSeleccion(r.id); }}
        />
      ) : null}
    </Pagina>
  );
}

function FormularioRepartidor({ repartidor, onCerrar, onCreado }) {
  const nuevo = !repartidor;
  const guardar = useGuardarRepartidor();
  const [errorServidor, setErrorServidor] = useState(null);
  const { control, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: repartidor
      ? { numero: repartidor.id, nombre: repartidor.nombre, zona: repartidor.zona, telefono: repartidor.telefono, activo: repartidor.activo }
      : { numero: siguienteNumeroRepartidor(), nombre: '', zona: ZONAS[0], telefono: '', contrasena: contrasenaInicial(), activo: true },
  });
  const zona = useWatch({ control, name: 'zona' });
  const activo = useWatch({ control, name: 'activo' });

  const enviar = async (d) => {
    setErrorServidor(null);
    try {
      const r = await guardar.mutateAsync(nuevo ? d : { ...d, id: repartidor.id });
      if (nuevo) onCreado({ ...r, contrasena: d.contrasena });
      onCerrar();
    } catch (e) { setErrorServidor(e.message); }
  };

  return (
    <Dialogo
      visible
      titulo={nuevo ? 'Nuevo repartidor' : `Editar a ${repartidor.nombre}`}
      subtitulo={nuevo ? 'Con estos datos entra a la app el primer día.' : 'El número de repartidor no se puede cambiar.'}
      onCerrar={onCerrar}
      pie={<>
        <Boton titulo="Cancelar" variante="secundario" onPress={onCerrar} />
        <Boton titulo={nuevo ? 'Crear cuenta' : 'Guardar cambios'} onPress={handleSubmit(enviar)} cargando={guardar.isPending} />
      </>}
    >
      <Controller control={control} name="nombre" rules={{ required: 'Escribe el nombre completo.' }} render={({ field }) => (
        <Campo etiqueta="Nombre completo" value={field.value} onChangeText={field.onChange} placeholder="Ej. Fernanda Lozano Ruiz" error={errors.nombre?.message} />
      )} />
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
        <Controller control={control} name="numero" rules={{ pattern: { value: /^R-\d{4}$/, message: 'Formato R-0000.' } }} render={({ field }) => (
          <Campo etiqueta="Número de repartidor" value={field.value} onChangeText={(t) => field.onChange(t.toUpperCase())} editable={nuevo} error={errors.numero?.message} style={{ flex: 1 }} />
        )} />
        <Controller control={control} name="telefono" rules={{ required: 'Escribe un teléfono.', minLength: { value: 10, message: 'Deben ser 10 dígitos.' } }} render={({ field }) => (
          <Campo etiqueta="Teléfono" value={field.value} onChangeText={field.onChange} keyboardType="phone-pad" placeholder="449 000 0000" error={errors.telefono?.message} style={{ flex: 1 }} />
        )} />
      </View>
      <Texto peso="semibold" tam={13} color="#34425E" style={{ marginTop: 14, marginBottom: 8 }}>Zona</Texto>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {ZONAS.map((z) => <Chip key={z} texto={z} seleccionado={zona === z} onPress={() => setValue('zona', z)} />)}
      </View>

      {nuevo ? (
        <Controller control={control} name="contrasena" render={({ field }) => (
          <Campo
            etiqueta="Contraseña inicial" value={field.value} onChangeText={field.onChange} style={{ marginTop: 8 }}
            ayuda="Se la das al repartidor en persona. Podrá cambiarla desde su perfil."
            derecha={<Pressable onPress={() => setValue('contrasena', contrasenaInicial())} hitSlop={8} accessibilityLabel="Generar otra contraseña"><RotateCcw size={16} color={colores.textoSec} strokeWidth={2.2} /></Pressable>}
          />
        )} />
      ) : (
        <>
          <Texto peso="semibold" tam={13} color="#34425E" style={{ marginTop: 8, marginBottom: 8 }}>Estado de la cuenta</Texto>
          <View style={{ flexDirection: 'row' }}>
            <Chip texto="Activa" seleccionado={activo} onPress={() => setValue('activo', true)} />
            <Chip texto="Desactivada" seleccionado={!activo} onPress={() => setValue('activo', false)} />
          </View>
          {!activo ? <Aviso tono="ambar" style={{ marginTop: 4 }}>Una cuenta desactivada no puede entrar a la app. Sus paquetes siguen en el historial.</Aviso> : null}
        </>
      )}
      {errorServidor ? <Texto tam={13} color={colores.rojo} style={{ marginTop: 12 }}>{errorServidor}</Texto> : null}
      <View style={{ height: 12 }} />
    </Dialogo>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colores.gris },
  encabezado: { paddingVertical: 12, backgroundColor: '#F8FAFD', borderTopWidth: 0, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colores.tinta, alignItems: 'center', justifyContent: 'center' },
  paquete: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  sep: { borderTopWidth: 1, borderTopColor: colores.gris },
});
