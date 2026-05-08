import { useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, ImageBackground, Pressable, useWindowDimensions } from 'react-native';
import { Link, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { AlertaContext } from './alerta-context';
import { traducirError } from '@/utils/errores';

export default function RegistroPage() {
  const { width } = useWindowDimensions();
  const esMovil = width < 768;
  const router = useRouter();
  const alerta = useContext(AlertaContext);
  const BASE_URL = process.env.EXPO_PUBLIC_API_URL || '';

  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [repetirContrasena, setRepetirContrasena] = useState('');
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [cargando, setCargando] = useState(false);

  const manejarRegistro = async () => {
    if (!nombre || !apellidos || !correo || !telefono || !contrasena || !repetirContrasena) {
      alerta?.mostrarAlerta("Error", "Por favor, rellena todos los campos.");
      return;
    }

    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexCorreo.test(correo)) {
      alerta?.mostrarAlerta("Error", "El formato del correo electrónico no es válido.");
      return;
    }

    const regexTelefono = /^\+?[0-9]{9,15}$/;
    if (!regexTelefono.test(telefono)) {
      alerta?.mostrarAlerta("Error", "El formato del teléfono no es válido. Debe contener entre 9 y 15 números.");
      return;
    } 

    if (contrasena !== repetirContrasena) {
      alerta?.mostrarAlerta("Error", "Las contraseñas no coinciden.");
      return;
    }

    if (contrasena.length < 6) {
      alerta?.mostrarAlerta("Error", "La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (!aceptaTerminos) {
      alerta?.mostrarAlerta("Error", "Debes aceptar los Términos y Condiciones.");
      return;
    }

    setCargando(true);

    try {
      const urlApi = `${BASE_URL}/api/usuarios`;
      
      const respuesta = await fetch(urlApi, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          correo,
          contrasena,
          nombre,
          apellidos,
          telefono,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.detail || "Error al registrar la cuenta");
      } else {
        alerta?.mostrarAlerta("Cuenta creada correctamente", "Por favor revise su correo electrónico para activar su cuenta.")
      }

      router.push("/login");

    } catch (e: any) {
        const mensajeError = traducirError(e.message);
        alerta?.mostrarAlerta("Error", mensajeError);
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={styles.contenedor}>
      <Head>
          <title>Registro | Domitex</title>
      </Head>
      <ImageBackground source={require('@/assets/images/bannerLanding.png')} style={styles.contenedorImagen} resizeMode="cover">
        <View style={styles.capaSuperpuesta}>
          <Text style={[styles.tituloBanner, esMovil && { fontSize: 36, lineHeight: 40, marginTop: 10 }]}>
            Domitex: Vistiendo tu hogar con elegancia
          </Text>
          <Text style={[styles.subtituloBanner, esMovil && { fontSize: 18, lineHeight: 24, marginTop: 20 }]}>
            La calidad textil de siempre, ahora a un solo clic. Haz tus pedidos de forma rápida y eficaz.
          </Text>
          <Link href="/catalogo" asChild>
            <Pressable style={esMovil ? styles.botonBannerMovil : styles.botonBanner}>
              <Text style={[styles.textoBotonBanner, esMovil && { fontSize: 18 }]}>Explorar Catálogo</Text>
            </Pressable>
          </Link>
        </View>
      </ImageBackground>

      <View style={styles.seccionFormulario}>
        <View style={styles.contenedorFormulario}>
          <Text style={styles.tituloFormulario}>Crear Cuenta</Text>

          <View style={styles.grupoInput}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput style={styles.input} value={nombre} onChangeText={setNombre} />
          </View>

          <View style={styles.grupoInput}>
            <Text style={styles.label}>Apellidos</Text>
            <TextInput style={styles.input} value={apellidos} onChangeText={setApellidos} />
          </View>

          <View style={styles.grupoInput}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput style={styles.input} value={correo} onChangeText={setCorreo} keyboardType="email-address" autoCapitalize="none" />
          </View>

          <View style={styles.grupoInput}>
            <Text style={styles.label}>Teléfono</Text>
            <TextInput style={styles.input} value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
          </View>

          <View style={styles.grupoInput}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput style={[styles.input, {fontFamily: undefined}]}  value={contrasena} onChangeText={setContrasena} secureTextEntry={true} />
          </View>

          <View style={styles.grupoInput}>
            <Text style={styles.label}>Repetir Contraseña</Text>
            <TextInput style={[styles.input, {fontFamily: undefined}]}  value={repetirContrasena} onChangeText={setRepetirContrasena} secureTextEntry={true} />
          </View>

          <Pressable style={styles.contenedorCheckbox} onPress={() => setAceptaTerminos(!aceptaTerminos)}>
            <View style={styles.checkbox}>
              {aceptaTerminos && <View style={styles.checkboxMarcado} />}
            </View>
            <Text style={styles.textoCheckbox}>Acepto los <Link href="/terminos-condiciones" style={styles.linkInfo}>Términos y Condiciones</Link> y la <Link href="/politica-cookies" style={styles.linkInfo}>Política de Privacidad</Link>.</Text>
          </Pressable>

          <Pressable style={styles.botonRegistrarse} onPress={manejarRegistro} disabled={cargando}>
            <Text style={styles.textoBotonRegistrarse}>REGISTRARSE</Text>
          </Pressable>

          <View style={styles.contenedorLoginLink}>
            <Text style={styles.textoPregunta}>¿Ya tienes una cuenta? </Text>
            <Link href="/login" style={styles.linkLogin}>Inicia sesión aquí.</Link>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contenedorImagen: {
    width: '100%',
    height: 498,
  },
  capaSuperpuesta: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  tituloBanner: {
    fontSize: 64,
    lineHeight: 64,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 30,
    maxWidth: 800,
  },
  subtituloBanner: {
    fontSize: 36,
    lineHeight: 34,
    fontFamily: 'Montserrat_300Light',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 50,
    maxWidth: 920,
  },
  botonBanner: {
    backgroundColor: '#DB3632',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 80,
    justifyContent: 'center', 
    alignItems: 'center',
    overflow: 'hidden',
  },
  botonBannerMovil: {
    backgroundColor: '#DB3632',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 40,
    justifyContent: 'center', 
    alignItems: 'center',
    overflow: 'hidden',
  },
  textoBotonBanner: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    textAlign: 'center',
  },
  seccionFormulario: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    width: '100%',
  },
  contenedorFormulario: {
    width: '100%',
    maxWidth: 500,
  },
  tituloFormulario: {
    color: '#29166F',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 36,
    textAlign: 'center',
    marginBottom: 40,
  },
  grupoInput: {
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Inter_400Regular',
    fontSize: 20,
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#29166F',
    borderRadius: 6,
    color: '#000',
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    backgroundColor: '#FFFFFF',
    width: '100%',
  },
  contenedorCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#29166F',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxMarcado: {
    width: 12,
    height: 12,
    backgroundColor: '#29166F',
    borderRadius: 2,
  },
  textoCheckbox: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#000000',
    flex: 1,
  },
  botonRegistrarse: { 
    backgroundColor: '#29166F',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  textoBotonRegistrarse: { 
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
  },
  contenedorLoginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  textoPregunta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#000000',
  },
  linkLogin: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#29166F',
    textDecorationLine: 'underline',
  },
  linkInfo: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#29166F',
    textDecorationLine: 'underline',
  }
});