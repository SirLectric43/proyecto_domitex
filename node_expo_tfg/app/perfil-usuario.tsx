import { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Modal, Image, useWindowDimensions, ScrollView } from 'react-native';
import { useRouter, Link } from 'expo-router';
import Head from 'expo-router/head';
import { AuthContext } from './auth-context';
import { AlertaContext } from './alerta-context';
import { traducirError } from '@/utils/errores';

const InputConLapiz = ({ label, valor, setValor, editable, setEditable, esCorreo = false, toggleEdicion }: any) => (
  <View style={styles.grupoInput}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.filaInput}>
      <TextInput 
        style={[styles.input, !editable && styles.inputBloqueado]} 
        value={valor} 
        onChangeText={setValor} 
        editable={editable}
      />
      <Pressable 
        style={styles.botonLapiz} 
        onPress={() => !esCorreo && toggleEdicion(editable, setEditable)}
        disabled={esCorreo}
      >
        <Image 
          source={
            esCorreo
              ? require('@/assets/images/iconoCandado.png')
              : editable 
                ? require('@/assets/images/iconoGuardar.png') 
                : require('@/assets/images/iconoEditar.png')
          } 
          style={styles.iconoEditar} 
        />
      </Pressable>
    </View>
  </View>
);

export default function PerfilPage() {
  const { width } = useWindowDimensions();
  const esMovil = width < 768; 
  const router = useRouter();
  const auth = useContext(AuthContext);
  const alerta = useContext(AlertaContext);
  const BASE_URL = process.env.EXPO_PUBLIC_API_URL || '';

  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [fechaRegistro, setFechaRegistro] = useState('');

  const [editNombre, setEditNombre] = useState(false);
  const [editApellidos, setEditApellidos] = useState(false);
  const [editTelefono, setEditTelefono] = useState(false);
  const [editDireccion, setEditDireccion] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [contrasenaActual, setContrasenaActual] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [repetirContrasena, setRepetirContrasena] = useState('');
  const [cargandoPassword, setCargandoPassword] = useState(false);

  const esAdmin = auth?.usuario?.rol === 'admin';

  useEffect(() => {
    const obtenerDatos = async () => {
      if (!auth?.usuario?.usuario_id || !auth?.usuario?.token) return;
      
      try {
        const urlApi = `${BASE_URL}/api/usuarios/${auth.usuario.usuario_id}`; 
        
        const respuesta = await fetch(urlApi, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${auth.usuario.token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          cache: 'no-store'
        });
        const datos = await respuesta.json();

        if (respuesta.ok) {
          setNombre(datos.nombre || '');
          setApellidos(datos.apellidos || '');
          setCorreo(datos.correo || '');
          setTelefono(datos.telefono || '');
          setDireccion(datos.direccion || '');
          
          if (datos.fecha_registro) {
            const fecha = new Date(datos.fecha_registro);
            const dia = String(fecha.getDate()).padStart(2, '0');
            const mes = String(fecha.getMonth() + 1).padStart(2, '0');
            const anio = fecha.getFullYear();
            setFechaRegistro(`${dia}-${mes}-${anio}`);
          }
        }
      } catch (error) {
        console.error("Error al cargar perfil:", error);
      }
    };
    obtenerDatos();
  }, [auth?.usuario?.usuario_id, auth?.usuario?.token, BASE_URL]);

  const guardarDatosPerfil = async () => {
    const regexTelefono = /^\+?[0-9]{9,15}$/;
      if (!regexTelefono.test(telefono)) {
        alerta?.mostrarAlerta("Error", "El formato del teléfono no es válido. Debe contener entre 9 y 15 números.");
        return;
      }
    try {
      const urlApi = `${BASE_URL}/api/usuarios/${auth?.usuario?.usuario_id}`;
      
      const respuesta = await fetch(urlApi, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth?.usuario?.token}`
        },
        body: JSON.stringify({ nombre, apellidos, telefono, direccion })
      });

      if (respuesta.ok) {
        if (auth?.iniciarSesionContext && auth.usuario?.token && auth.usuario?.usuario_id && auth.usuario?.rol) {
          await auth.iniciarSesionContext(nombre, auth.usuario.token, auth.usuario.usuario_id, auth.usuario.rol);
        }
        alerta?.mostrarAlerta("Éxito", "Perfil actualizado correctamente.");
      } else {
        alerta?.mostrarAlerta("Error", "No se pudo actualizar el perfil.");
      }
    } catch {
      alerta?.mostrarAlerta("Error al guardar", "Comprueba tu conexión.");
    }
  };

  const toggleEdicion = async (estadoActual: boolean, setEstado: any) => {
    if (estadoActual) {
      await guardarDatosPerfil();
    }
    setEstado(!estadoActual);
  };

  const manejarCambiarContrasena = async () => {
    if (!contrasenaActual || !nuevaContrasena || !repetirContrasena) {
      alerta?.mostrarAlerta("Error", "Rellena todos los campos.");
      return;
    }
    if (nuevaContrasena !== repetirContrasena) {
      alerta?.mostrarAlerta("Error", "Las nuevas contraseñas no coinciden.");
      return;
    }

    setCargandoPassword(true);
    try {
      const urlApi = `${BASE_URL}/api/usuarios/${auth?.usuario?.usuario_id}/contrasena`;

      const respuesta = await fetch(urlApi, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth?.usuario?.token}`
        },
        body: JSON.stringify({ 
          contrasena_actual: contrasenaActual, 
          nueva_contrasena: nuevaContrasena 
        })
      });

      if (!respuesta.ok) throw new Error("Contraseña actual incorrecta.");

      setModalVisible(false);
      setContrasenaActual('');
      setNuevaContrasena('');
      setRepetirContrasena('');

      if (auth?.cerrarSesionContext) {
        await auth.cerrarSesionContext();
        alerta?.mostrarAlerta("Éxito", "Contraseña cambiada. Por favor, inicia sesión de nuevo.");
        router.replace('/'); 
      }
      
    } catch (e: any) {
      const mensajeError = traducirError(e.message);
      alerta?.mostrarAlerta("Error", mensajeError);
    } finally {
      setCargandoPassword(false);
    }
  };

  const manejarCerrarSesion = async () => {
    if (auth?.cerrarSesionContext) {
      await auth.cerrarSesionContext();
      alerta?.mostrarAlerta("Sesión cerrada", "Has cerrado sesión correctamente.");
      router.replace('/'); 
    }
  };

  return (
    <View style={styles.contenedorPantalla}>
      <ScrollView contentContainerStyle={styles.scrollContenido} keyboardShouldPersistTaps="handled">
        <Head>
            <title>Perfil de usuario | Domitex</title>
        </Head>
        <View style={[styles.contenedorColumnas, esMovil && styles.contenedorColumnasMovil]}>
          
          <View style={[styles.columnaIzquierda, esMovil && styles.columnaIzquierdaMovil]}>
            <InputConLapiz label="Nombre" valor={nombre} setValor={setNombre} editable={editNombre} setEditable={setEditNombre} toggleEdicion={toggleEdicion} />
            <InputConLapiz label="Apellidos" valor={apellidos} setValor={setApellidos} editable={editApellidos} setEditable={setEditApellidos} toggleEdicion={toggleEdicion} />
            <InputConLapiz label="Correo electrónico" valor={correo} setValor={setCorreo} editable={false} setEditable={() => {}} esCorreo={true} toggleEdicion={toggleEdicion} />
            <InputConLapiz label="Teléfono" valor={telefono} setValor={setTelefono} editable={editTelefono} setEditable={setEditTelefono} toggleEdicion={toggleEdicion} />
            <InputConLapiz label="Dirección" valor={direccion} setValor={setDireccion} editable={editDireccion} setEditable={setEditDireccion} toggleEdicion={toggleEdicion} />

            <Text style={styles.textoFecha}>Fecha de registro: {fechaRegistro}</Text>
          </View>

          <View style={[styles.columnaDerecha, esMovil && styles.columnaDerechaMovil]}>
            {!esAdmin && (
              <Link href="/historial-compra" asChild>
                <Pressable style={styles.botonAccion}>
                  <Text style={styles.textoBotonSecundario}>Historial de compra</Text>
                </Pressable>
              </Link>
            )}

            <Pressable style={[styles.botonAccion, !esAdmin ? styles.espacioBotonIntermedio : null]} onPress={() => setModalVisible(true)}>
              <Text style={styles.textoBotonSecundario}>Cambiar contraseña</Text>
            </Pressable>
            
            <Pressable style={[styles.botonAccion, styles.espacioBotonCerrar]} onPress={manejarCerrarSesion}>
              <Text style={styles.textoBotonSecundario}>Cerrar sesión</Text>
            </Pressable>
          </View>

        </View>

      </ScrollView>

      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <Pressable style={styles.fondoModal} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.contenedorModalCentrado} onPress={(e) => e.stopPropagation()}>            
            
            <View style={styles.tarjetaBlancaModal}>
              <Text style={styles.tituloModal}>CAMBIAR{'\n'}CONTRASEÑA</Text>
              <View style={styles.grupoInputModal}>
                <Text style={styles.label}>Contraseña actual</Text>
                <TextInput style={[styles.inputModal, { fontFamily: undefined }]} value={contrasenaActual} onChangeText={setContrasenaActual} secureTextEntry />
              </View>

              <View style={styles.grupoInputModal}>
                <Text style={styles.label}>Nueva contraseña</Text>
                <TextInput style={[styles.inputModal, { fontFamily: undefined }]} value={nuevaContrasena} onChangeText={setNuevaContrasena} secureTextEntry />
              </View>

              <View style={styles.grupoInputModal}>
                <Text style={styles.label}>Repetir Contraseña</Text>
                <TextInput style={[styles.inputModal, { fontFamily: undefined }]} value={repetirContrasena} onChangeText={setRepetirContrasena} secureTextEntry />
              </View>

              <Pressable style={styles.botonAceptarModal} onPress={manejarCambiarContrasena} disabled={cargandoPassword}>
                <Text style={styles.textoBotonSecundario}>{cargandoPassword ? 'Cargando...' : 'Aceptar'}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  contenedorPantalla: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContenido: {
    paddingVertical: 50,
    paddingHorizontal: 30,
    alignItems: 'center',
    flexGrow: 1,
  },
  contenedorColumnas: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 1000,
    justifyContent: 'space-between',
  },
  contenedorColumnasMovil: {
    flexDirection: 'column',
    width: '100%',
  },
  columnaIzquierda: {
    flex: 1,
    maxWidth: 500,
    marginRight: 20,
  },
  columnaIzquierdaMovil: {
    maxWidth: '100%',
    marginRight: 0,
  },
  grupoInput: {
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#000000',
    marginBottom: 5,
  },
  filaInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#29166F', 
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    backgroundColor: '#FFFFFF',
  },
  inputBloqueado: {
    backgroundColor: '#F9F9F9',
    color: '#555555',
  },
  botonLapiz: {
    padding: 10,
    marginLeft: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconoEditar: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  textoFecha: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#000000',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  columnaDerecha: {
    flex: 1,
    maxWidth: 400,
    marginTop: 25, 
  },
  columnaDerechaMovil: {
    maxWidth: '100%',
    marginTop: 15,
  },
  botonAccion: {
    backgroundColor: '#29166F',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  espacioBotonIntermedio: {
    marginTop: 20,
  },
  espacioBotonCerrar: {
    marginTop: 20, 
  },
  textoBotonSecundario: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
  fondoModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contenedorModalCentrado: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  tituloModal: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    color: '#29166F',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 36,
  },
  tarjetaBlancaModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 30,
    width: '100%',
    elevation: 8,
  },
  grupoInputModal: {
    marginBottom: 20,
  },
  inputModal: {
    borderWidth: 1,
    borderColor: '#29166F',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    backgroundColor: '#FFFFFF',
  },
  botonAceptarModal: {
    backgroundColor: '#29166F',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  }
});