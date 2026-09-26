// P1 · Inicio de sesión del administrador
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { Eye, EyeOff, Info, Lock } from 'lucide-react-native';
import Boton from '../components/Boton';
import Campo from '../components/Campo';
import Texto from '../components/Texto';
import { useSesion } from '../navegacion/Sesion';
import { colores } from '../theme';

export default function LoginPantalla() {
  const { entrar } = useSesion();
  const [ver, setVer] = useState(false);
  const [errorServidor, setErrorServidor] = useState(null);
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({ defaultValues: { correo: 'vane@deliviz.mx', contrasena: '' } });

  const enviar = async ({ correo, contrasena }) => {
    setErrorServidor(null);
    try { await entrar(correo, contrasena); } catch (e) { setErrorServidor(e.message); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.fondo}>
        <View style={styles.tarjeta}>
          <Image source={require('../../assets/logo-deliviz.png')} style={styles.logo} resizeMode="contain" accessibilityLabel="Deliviz, entregas que generan confianza" />
          <Texto peso="bold" tam={24} style={{ marginTop: 22 }}>Panel de administrador</Texto>
          <Texto tam={14} color={colores.textoSec} style={{ marginTop: 3 }}>Revisa cada entrega con su evidencia, las alertas del día y los reportes.</Texto>

          <Controller
            control={control}
            name="correo"
            rules={{ required: 'Escribe tu correo.', pattern: { value: /\S+@\S+\.\S+/, message: 'Revisa el formato del correo.' } }}
            render={({ field }) => (
              <Campo etiqueta="Correo" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} autoCapitalize="none" keyboardType="email-address" autoComplete="email" error={errors.correo?.message} style={{ marginTop: 22 }} />
            )}
          />
          <Controller
            control={control}
            name="contrasena"
            rules={{ required: 'Escribe tu contraseña.' }}
            render={({ field }) => (
              <Campo
                etiqueta="Contraseña" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur}
                secureTextEntry={!ver} autoCapitalize="none" placeholder="Tu contraseña" onSubmitEditing={handleSubmit(enviar)}
                error={errors.contrasena?.message} style={{ marginTop: 14 }}
                derecha={
                  <Pressable onPress={() => setVer((v) => !v)} hitSlop={8} accessibilityLabel={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                    {ver ? <EyeOff size={18} color={colores.textoSec} strokeWidth={2} /> : <Eye size={18} color={colores.textoSec} strokeWidth={2} />}
                  </Pressable>
                }
              />
            )}
          />
          {errorServidor ? <Texto tam={13} color={colores.rojo} style={{ marginTop: 10 }}>{errorServidor}</Texto> : null}

          <Boton titulo="Entrar al panel" icono={Lock} alto={48} tamTexto={15} onPress={handleSubmit(enviar)} cargando={isSubmitting} style={{ marginTop: 20 }} />

          <View style={styles.info}>
            <Info size={15} color={colores.textoSec} strokeWidth={2} style={{ marginTop: 1, marginRight: 9 }} />
            <Texto tam={12.5} color={colores.textoSec} alto={17} style={{ flex: 1 }}>
              Solo para administradores. Los repartidores entran desde la app con su número de repartidor.
            </Texto>
          </View>
        </View>
        <Texto tam={12} color={colores.textoTer} centro style={{ marginTop: 16 }}>Deliviz 1.0 (piloto)</Texto>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fondo: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: colores.fondo },
  tarjeta: { width: '100%', maxWidth: 430, backgroundColor: colores.blanco, borderRadius: 20, borderWidth: 1, borderColor: colores.borde, padding: 32 },
  logo: { width: 150, height: 145, alignSelf: 'center' },
  info: { flexDirection: 'row', backgroundColor: colores.gris, borderRadius: 10, padding: 12, marginTop: 20 },
});
