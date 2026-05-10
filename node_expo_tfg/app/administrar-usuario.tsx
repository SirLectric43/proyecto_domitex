import { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Platform, Modal, Image, useWindowDimensions, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head'
import { AuthContext } from '../context/auth-context';
import { AlertaContext } from '../context/alerta-context';
import { traducirError } from '@/utils/errores';

export default function AdministrarUsuarioPage() {
  const { id } = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const esMovil = width < 768;
  const router = useRouter();
  const auth = useContext(AuthContext);
  const alerta = useContext(AlertaContext);
  const BASE_URL = process.env.EXPO_PUBLIC_API_URL || '';

  const [cargando, setCargando] = useState(true);
  const [datosUsuario, setDatosUsuario] = useState<any>(null);

  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [rol, setRol] = useState('');
  const [busquedaRol, setBusquedaRol] = useState('');

  const [modoEdicion, setModoEdicion] = useState(false);
  const [mostrarRoles, setMostrarRoles] = useState(false);
  const [modalBaja, setModalBaja] = useState(false);

  const rolesDisponibles = ["Cliente", "Admin", "Empleado"];
  const rolesFiltrados = rolesDisponibles.filter(r => r.toLowerCase().includes(busquedaRol.toLowerCase()));

  const formatearFecha = (fechaStr: string) => {
    if (!fechaStr) return '--';
    const d = new Date(fechaStr);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
  };

  const formatearFechaHora = (fechaStr: string) => {
    if (!fechaStr) return '--';
    const d = new Date(fechaStr);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const urlApi = `${BASE_URL}/api/usuarios/${id}`;
        const res = await fetch(urlApi, {
          headers: { 'Authorization': `Bearer ${auth?.usuario?.token}` }
        });
        const datos = await res.json();
        if (res.ok) {
          setDatosUsuario(datos);
          setNombre(datos.nombre || '');
          setApellidos(datos.apellidos || '');
          setCorreo(datos.correo || '');
          setTelefono(datos.telefono || '');
          setDireccion(datos.direccion || '');
          const r = datos.rol ? datos.rol.charAt(0).toUpperCase() + datos.rol.slice(1) : '';
          setRol(r);
          setBusquedaRol(r);
        }
      } catch (e: any) {
        const mensajeError = traducirError(e.message);
        alerta?.mostrarAlerta("Error", mensajeError);
      } finally {
        setCargando(false);
      }
    };
    if (id) cargarPerfil();
  }, [id, auth?.usuario?.token, BASE_URL, alerta]);

  const manejarBotonEdicion = async () => {
    if (modoEdicion) {
      try {
        const urlApi = `${BASE_URL}/api/admin/usuarios/${id}`;
        const res = await fetch(urlApi, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth?.usuario?.token}`
          },
          body: JSON.stringify({ nombre, apellidos, telefono, direccion, rol: rol.toLowerCase() })
        });
        if (res.ok) {
          if (id === auth?.usuario?.usuario_id) {
            if (auth?.iniciarSesionContext && auth.usuario?.token && auth.usuario?.rol) {
              await auth.iniciarSesionContext(nombre, auth.usuario.token, auth.usuario.usuario_id, auth.usuario.rol);
            }
          }
          setModoEdicion(false);
          alerta?.mostrarAlerta("Éxito", "Usuario actualizado correctamente.");
        } else {
          alerta?.mostrarAlerta("Error", "Error al actualizar el usuario");
        }
      } catch (e: any) {
        const mensajeError = traducirError(e.message);
        alerta?.mostrarAlerta("Error", mensajeError);
      }
    } else {
      setModoEdicion(true);
    }
  };

  const manejarBaja = async () => {
    try {
      const urlApi = `${BASE_URL}/api/admin/usuarios/${id}`;
      const res = await fetch(urlApi, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${auth?.usuario?.token}` }
      });
      if (res.ok) {
        setModalBaja(false);
        router.push('/gestion-usuarios');
      }
    } catch (e: any) {
        const mensajeError = traducirError(e.message);
        alerta?.mostrarAlerta("Error", "Error de conexión: " + mensajeError);
    }
  };

  if (cargando) {
    return (
      <View style={[styles.contenedorFondo, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#29166F" />
      </View>
    );
  }

  return (
    <View style={styles.contenedorFondo}>
      <ScrollView contentContainerStyle={styles.scrollContenido} keyboardShouldPersistTaps="handled">
        <Head>
            <title>Administrar usuario | Domitex</title>
        </Head>
        <View style={[styles.tarjetaBlanca, esMovil && styles.tarjetaBlancaMovil]}>
          
          <View style={[styles.cabecera, esMovil && styles.cabeceraMovil]}>
            <Text style={[styles.tituloPagina, esMovil && styles.tituloPaginaMovil]}>Administrar Usuario</Text>
            
            {!esMovil && (
              <Pressable 
                style={({ hovered }) => [
                  { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8, backgroundColor: hovered ? '#F0F0F0' : 'transparent' }
                ]}
                onPress={manejarBotonEdicion}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 22, color: '#29166F' }}>
                  {modoEdicion ? 'Guardar cambios' : 'Editar'}
                </Text>
                <Image 
                  source={modoEdicion ? require('@/assets/images/iconoGuardar.png') : require('@/assets/images/iconoEditar.png')} 
                  style={{ width: 45, height: 45, resizeMode: 'contain' }} 
                />
              </Pressable>
            )}
          </View>

          <View style={[styles.layoutGrid, esMovil && styles.layoutGridMovil]}>
            
            <View style={styles.columnaIzquierda}>
              <View style={styles.grupoInput}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput 
                  style={[styles.input, !modoEdicion && styles.inputBloqueado, esMovil && styles.inputMovil]} 
                  value={nombre} 
                  onChangeText={setNombre} 
                  editable={modoEdicion}
                />
              </View>

              <View style={styles.grupoInput}>
                <Text style={styles.label}>Apellidos</Text>
                <TextInput 
                  style={[styles.input, !modoEdicion && styles.inputBloqueado, esMovil && styles.inputMovil]} 
                  value={apellidos} 
                  onChangeText={setApellidos} 
                  editable={modoEdicion}
                />
              </View>

              <View style={styles.grupoInput}>
                <Text style={styles.label}>Correo electrónico</Text>
                <View style={[styles.filaInput, esMovil && styles.filaInputMovil]}>
                  <TextInput 
                    style={[styles.input, styles.inputBloqueado, esMovil && styles.inputMovil]} 
                    value={correo} 
                    editable={false}
                  />
                  <View style={styles.botonLapiz}>
                    <Image source={require('@/assets/images/iconoCandado.png')} style={[styles.iconoEditar, esMovil && styles.iconoEditarMovil]} />
                  </View>
                </View>
              </View>

              <View style={styles.grupoInput}>
                <Text style={styles.label}>Teléfono</Text>
                <TextInput 
                  style={[styles.input, !modoEdicion && styles.inputBloqueado, esMovil && styles.inputMovil]} 
                  value={telefono} 
                  onChangeText={setTelefono} 
                  editable={modoEdicion}
                />
              </View>

              <View style={styles.grupoInput}>
                <Text style={styles.label}>Dirección</Text>
                <TextInput 
                  style={[styles.input, !modoEdicion && styles.inputBloqueado, esMovil && styles.inputMovil]} 
                  value={direccion} 
                  onChangeText={setDireccion} 
                  editable={modoEdicion}
                />
              </View>
              
              <View style={[styles.grupoInput, { zIndex: 10 }]}>
                <Text style={styles.label}>Rol de usuario</Text>
                <TextInput 
                  style={[styles.input, !modoEdicion && styles.inputBloqueado, esMovil && styles.inputMovil, mostrarRoles && { zIndex: 101, position: 'relative' }]} 
                  value={busquedaRol} 
                  onChangeText={(text) => { setBusquedaRol(text); setMostrarRoles(true); }}
                  onFocus={() => modoEdicion && setMostrarRoles(true)}
                  placeholder="Buscar rol..."
                  editable={modoEdicion}
                />
                {mostrarRoles && modoEdicion && (
                  <>
                    <Pressable style={styles.overlayCerrar} onPress={() => { setMostrarRoles(false); setBusquedaRol(rol); }} />
                    <View style={styles.cajaOpciones}>
                      <ScrollView style={{maxHeight: 180}} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                        {rolesFiltrados.map(r => (
                          <Pressable key={r} style={styles.opcion} onPress={() => { setRol(r); setBusquedaRol(r); setMostrarRoles(false); }}>
                            <Text style={styles.textoOpcion}>{r}</Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  </>
                )}
              </View>
            </View>

            <View style={styles.columnaDerecha}>
              <View style={styles.cajaInfo}>
                <Text style={styles.labelInfo}>Fecha de registro</Text>
                <Text style={styles.valorInfo}>{formatearFecha(datosUsuario?.fecha_registro)}</Text>
              </View>

              <View style={styles.cajaInfo}>
                <Text style={styles.labelInfo}>Último acceso</Text>
                <Text style={styles.valorInfo}>{formatearFechaHora(datosUsuario?.ultimo_acceso)}</Text>
              </View>

              {!esMovil && (
                <View style={styles.contenedorBotones}>
                  <Pressable style={styles.botonOpcion} onPress={() => router.push({ pathname: '/historial-compra', params: { usuarioId: id } })}>
                    <Text style={styles.textoBotonOpcion}>Historial de compra</Text>
                  </Pressable>

                  <Pressable style={[styles.botonOpcion, styles.botonRojo]} onPress={() => setModalBaja(true)}>
                    <Text style={[styles.textoBotonOpcion, styles.textoRojo]}>Dar de baja al usuario</Text>
                  </Pressable>
                </View>
              )}
            </View>

          </View>
        </View>

        {esMovil && (
          <View style={styles.contenedorAccionesMovil}>
            <Pressable 
              style={[styles.botonOpcion, { backgroundColor: '#29166F' }]} 
              onPress={manejarBotonEdicion}
            >
              <Text style={[styles.textoBotonOpcion, { color: '#FFF' }]}>
                {modoEdicion ? 'Guardar cambios' : 'Editar usuario'}
              </Text>
            </Pressable>

            <Pressable style={styles.botonOpcion} onPress={() => router.push({ pathname: '/historial-compra', params: { usuarioId: id } })}>
              <Text style={styles.textoBotonOpcion}>Historial de compra</Text>
            </Pressable>

            <Pressable style={[styles.botonOpcion, styles.botonRojo]} onPress={() => setModalBaja(true)}>
              <Text style={[styles.textoBotonOpcion, styles.textoRojo]}>Dar de baja al usuario</Text>
            </Pressable>
          </View>
        )}

      </ScrollView>

      <Modal visible={modalBaja} transparent animationType="fade">
        <View style={styles.fondoModal}>
          <View style={styles.contenedorModalCentrado}>
            <View style={styles.tarjetaBlancaModal}>
              <Text style={styles.tituloModal}>¿Eliminar usuario?</Text>
              <Text style={{textAlign: 'center', marginBottom: 20, fontFamily: 'Inter_400Regular', fontSize: 16}}>Esta acción es permanente y borrará todos los datos asociados.</Text>
              <View style={{flexDirection: 'row', gap: 15}}>
                <Pressable style={[styles.botonModal, {backgroundColor: '#EEE', flex: 1}]} onPress={() => setModalBaja(false)}>
                  <Text style={[styles.textoBotonModal, {color: '#000'}]}>Cancelar</Text>
                </Pressable>
                <Pressable style={[styles.botonModal, {backgroundColor: '#DB3632', flex: 1}]} onPress={manejarBaja}>
                  <Text style={styles.textoBotonModal}>Eliminar</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedorFondo: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContenido: {
    paddingTop: 50,
    paddingBottom: Platform.OS === "web" ? 50 : 80,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  tarjetaBlanca: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 1000,
    borderRadius: 12,
    padding: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  tarjetaBlancaMovil: {
    padding: 20,
  },
  cabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  cabeceraMovil: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  tituloPagina: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 40,
    color: '#29166F',
  },
  tituloPaginaMovil: {
    fontSize: 28,
  },
  layoutGrid: {
    flexDirection: 'row',
    gap: 60,
  },
  layoutGridMovil: {
    flexDirection: 'column',
    gap: 30,
  },
  columnaIzquierda: {
    flex: 1.5,
  },
  columnaDerecha: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  grupoInput: {
    marginBottom: 25,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#000000',
    marginBottom: 8,
  },
  filaInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  filaInputMovil: {
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#29166F',
    borderRadius: 4,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 18,
    fontFamily: 'Inter_400Regular',
    backgroundColor: '#FFFFFF',
    color: '#000',
  },
  inputMovil: {
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  inputBloqueado: {
    backgroundColor: '#F5F5F5',
    borderColor: '#CCC',
    color: '#666',
  },
  botonLapiz: {
    padding: 5,
  },
  iconoEditar: {
    width: 45,
    height: 45,
    resizeMode: 'contain',
  },
  iconoEditarMovil: {
    width: 30,
    height: 30,
  },
  cajaInfo: {
    marginBottom: 30,
  },
  labelInfo: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#666666',
    marginBottom: 5,
  },
  valorInfo: {
    fontFamily: 'Inter_400Regular',
    fontSize: 20,
    color: '#000000',
  },
  contenedorBotones: {
    marginTop: 20,
    gap: 15,
  },
  contenedorAccionesMovil: {
    flexDirection: 'column',
    width: '100%',
    marginTop: 20,
    gap: 15,
  },
  botonOpcion: {
    backgroundColor: '#EEEEEE',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBotonOpcion: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#333333',
  },
  botonRojo: {
    backgroundColor: '#DB3632',
  },
  textoRojo: {
    color: '#FFFFFF',
  },
  overlayCerrar: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    top: -2000, bottom: -2000, left: -2000, right: -2000,
    zIndex: 100,
  } as any,
  cajaOpciones: {
    position: 'absolute',
    top: 75, left: 0, right: 0,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#29166F',
    zIndex: 1000,
    elevation: 5,
  },
  opcion: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  textoOpcion: {
    fontSize: 16,
    color: '#333',
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
  },
  tarjetaBlancaModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 30,
    elevation: 8,
  },
  tituloModal: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: '#29166F',
    textAlign: 'center',
    marginBottom: 15,
  },
  botonModal: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBotonModal: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#FFF',
  }
});