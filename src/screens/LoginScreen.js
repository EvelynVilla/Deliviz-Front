// Pantalla 1 · Inicio de sesión
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Controller, useForm } from 'react-hook-form';
import { Eye, EyeOff, Info } from 'lucide-react-native';
import Boton from '../components/Boton';
import Texto from '../components/Texto';
import { USAR_MOCK } from '../api';
import { useApp } from '../context/AppContext';
import { colores, fuentes, radios } from '../theme';

export default function LoginScreen() {
  const { iniciarSesion } = useApp();
  const [verContrasena, setVerContrasena] = useState(false);
  const [enfocado, setEnfocado] = useState(null);
  const [errorServidor, setErrorServidor] = useState(null);
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({ defaultValues: { email: USAR_MOCK ? 'repartidor1@deliviz.test' : '', contrasena: '' } });

  const entrar = async ({ email, contrasena }) => {
    setErrorServidor(null);
    try {
      await iniciarSesion(email, contrasena);
    } catch (e) {
      setErrorServidor(e.message ?? 'No se pudo entrar. Revisa tu conexión e inténtalo de nuevo.');
    }
  };

  return (
    <SafeAreaView style={styles.pantalla}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
          <Image source={require('../../assets/logo-deliviz.png')} style={styles.logo} resizeMode="contain" accessibilityLabel="Deliviz, entregas que generan confianza" />

          <Texto peso="bold" tam={24} style={{ marginTop: 26 }}>Inicia sesión</Texto>
          <Texto tam={14} color={colores.textoSec} style={{ marginTop: 4 }}>Entra con el correo de tu cuenta de repartidor para ver la ruta de hoy.</Texto>

          <Texto peso="semibold" tam={13} color="#34425E" style={styles.etiqueta}>Correo</Texto>
          <Controller
            control={control}
            name="email"
            rules={{ required: 'Escribe tu correo.', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Revisa el formato del correo.' } }}
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                value={value}
                onChangeText={(t) => onChange(t.trim())}
                onFocus={() => setEnfocado('email')}
                onBlur={() => { setEnfocado(null); onBlur(); }}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                keyboardType="email-address"
                textContentType="username"
                placeholder="repartidor@deliviz.mx"
                placeholderTextColor={colores.textoTer}
                style={[styles.campo, enfocado === 'email' && styles.campoFoco, errors.email && styles.campoError]}
              />
            )}
          />
          {errors.email ? <Texto tam={12} color={colores.rojo} style={styles.error}>{errors.email.message}</Texto> : null}

          <Texto peso="semibold" tam={13} color="#34425E" style={styles.etiqueta}>Contraseña</Texto>
          <Controller
            control={control}
            name="contrasena"
            rules={{ required: 'Escribe tu contraseña.' }}
            render={({ field: { value, onChange, onBlur } }) => (
              <View>
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onFocus={() => setEnfocado('contrasena')}
                  onBlur={() => { setEnfocado(null); onBlur(); }}
                  secureTextEntry={!verContrasena}
                  autoCapitalize="none"
                  placeholder="Tu contraseña"
                  placeholderTextColor={colores.textoTer}
                  onSubmitEditing={handleSubmit(entrar)}
                  style={[styles.campo, { paddingRight: 48 }, enfocado === 'contrasena' && styles.campoFoco, errors.contrasena && styles.campoError]}
                />
                <Pressable onPress={() => setVerContrasena((v) => !v)} style={styles.ojo} hitSlop={8} accessibilityLabel={verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  {verContrasena ? <EyeOff size={19} color={colores.textoSec} strokeWidth={2} /> : <Eye size={19} color={colores.textoSec} strokeWidth={2} />}
                </Pressable>
              </View>
            )}
          />
          {errors.contrasena ? <Texto tam={12} color={colores.rojo} style={styles.error}>{errors.contrasena.message}</Texto> : null}
          {errorServidor ? <Texto tam={12.5} color={colores.rojo} style={[styles.error, { marginTop: 10 }]}>{errorServidor}</Texto> : null}

          <Boton titulo="Entrar" onPress={handleSubmit(entrar)} cargando={isSubmitting} style={{ marginTop: 20 }} />
          <Boton titulo="Olvidé mi contraseña" variante="enlace" tamTexto={13.5} onPress={() => setErrorServidor('Pídele al administrador que restablezca tu contraseña.')} style={{ marginTop: 8 }} />

          <View style={{ flex: 1, minHeight: 24 }} />

          <View style={styles.info}>
            <Info size={15} color={colores.textoSec} strokeWidth={2} style={{ marginTop: 1, marginRight: 9 }} />
            <Texto tam={12.5} color={colores.textoSec} alto={17} style={{ flex: 1 }}>
              Tu cuenta la crea el administrador. Si no puedes entrar, pídele que la revise.
            </Texto>
          </View>
          <Texto tam={11.5} color={colores.textoTer} centro style={{ marginTop: 12 }}>Deliviz 1.0 (piloto){USAR_MOCK ? ' · API simulada' : ''}</Texto>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.blanco },
  contenido: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 16 },
  logo: { width: 190, height: 184, alignSelf: 'center' },
  etiqueta: { marginTop: 18, marginBottom: 7 },
  campo: {
    height: 50, borderRadius: radios.campo, borderWidth: 1, borderColor: colores.bordeCampo, backgroundColor: colores.blanco,
    paddingHorizontal: 14, fontFamily: fuentes.medium, fontSize: 15.5, color: colores.tinta,
  },
  campoFoco: { borderColor: colores.primario, borderWidth: 1.5, shadowColor: colores.primario, shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  campoError: { borderColor: colores.rojo },
  ojo: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  error: { marginTop: 5 },
  info: { flexDirection: 'row', backgroundColor: colores.gris, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 11 },
});
