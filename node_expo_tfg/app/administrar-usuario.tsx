import { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Platform, Modal, Image, useWindowDimensions, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AuthContext } from './auth-context';

export default function AdministrarUsuarioPage() {
  const { id } = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const esMovil = width < 768;
  const router = useRouter();
  const auth = useContext(AuthContext);

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
        const urlApi = Platform.OS === 'web' ? `http://localhost:8000/usuarios/${id}` : `http://192.168.1.43:8000/usuarios/${id}`;
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
      } catch (e) {
        alert(e);
      } finally {
        setCargando(false);
      }
    };
    if (id) cargarPerfil();
  }, [id, auth?.usuario?.token]);

  const manejarBotonEdicion = async () => {
    if (modoEdicion) {
      try {
        const urlApi = Platform.OS === 'web' ? `http://localhost:8000/admin/usuarios/${id}` : `http://192.168.1.43:8000/admin/usuarios/${id}`;
        const res = await fetch(urlApi, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth?.usuario?.token}`
          },
          body: JSON.stringify({ nombre, apellidos, telefono, direccion, rol: rol.toLowerCase() })
        });
        if (res.ok) {
          setModoEdicion(false);
        } else {
          alert("Error al actualizar");
        }
      } catch (e) {
        alert("Error de conexión: " + e);
      }
    } else {
      setModoEdicion(true);
    }
  };

  const manejarBaja = async () => {
    try {
      const urlApi = Platform.OS === 'web' ? `http://localhost:8000/admin/usuarios/${id}` : `http://192.168.1.43:8000/admin/usuarios/${id}`;
      const res = await fetch(urlApi, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${auth?.usuario?.token}` }
      });
      if (res.ok) {
        setModalBaja(false);
        router.push('/gestion-usuarios');
      }
    } catch (e) {
      alert("Error de conexión: " + e);
    }
  };

  if (cargando) return <ActivityIndicator size="large" color="#29166F" style={{ flex: 1, marginTop: 100 }} />;

  return (
    <View style={styles.contenedorFondo}>
      <ScrollView contentContainerStyle={styles.scrollContenido} keyboardShouldPersistTaps="handled">
        <View style={styles.tarjetaBlanca}>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
            <Text style={[styles.tituloPagina, { marginBottom: 0 }]}>Administrar Usuario</Text>
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
          </View>

          <View style={[styles.layoutGrid, esMovil && styles.layoutGridMovil]}>
            
            <View style={styles.columnaIzquierda}>
              <View style={styles.grupoInput}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput 
                  style={[styles.input, !modoEdicion && styles.inputBloqueado]} 
                  value={nombre} 
                  onChangeText={setNombre} 
                  editable={modoEdicion}
                />
              </View>

              <View style={styles.grupoInput}>
                <Text style={styles.label}>Apellidos</Text>
                <TextInput 
                  style={[styles.input, !modoEdicion && styles.inputBloqueado]} 
                  value={apellidos} 
                  onChangeText={setApellidos} 
                  editable={modoEdicion}
                />
              </View>

              <View style={styles.grupoInput}>
                <Text style={styles.label}>Correo electrónico</Text>
                <View style={styles.filaInput}>
                  <TextInput 
                    style={[styles.input, styles.inputBloqueado]} 
                    value={correo} 
                    editable={false}
                  />
                  <View style={styles.botonLapiz}>
                    <Image source={require('@/assets/images/iconoCandado.png')} style={styles.iconoEditar} />
                  </View>
                </View>
              </View>

              <View style={styles.grupoInput}>
                <Text style={styles.label}>Teléfono</Text>
                <TextInput 
                  style={[styles.input, !modoEdicion && styles.inputBloqueado]} 
                  value={telefono} 
                  onChangeText={setTelefono} 
                  editable={modoEdicion}
                />
              </View>

              <View style={styles.grupoInput}>
                <Text style={styles.label}>Dirección</Text>
                <TextInput 
                  style={[styles.input, !modoEdicion && styles.inputBloqueado]} 
                  value={direccion} 
                  onChangeText={setDireccion} 
                  editable={modoEdicion}
                />
              </View>
              
              <View style={[styles.grupoInput, { zIndex: 10 }]}>
                <Text style={styles.label}>Rol de usuario</Text>
                <TextInput 
                  style={[styles.input, !modoEdicion && styles.inputBloqueado, mostrarRoles && { zIndex: 101, position: 'relative' }]} 
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

              <View style={styles.contenedorBotones}>
                <Pressable style={styles.botonOpcion} onPress={() => router.push({ pathname: '/historial-compra', params: { usuarioId: id } })}>
                  <Text style={styles.textoBotonOpcion}>Historial de compra</Text>
                </Pressable>

                <Pressable style={[styles.botonOpcion, styles.botonRojo]} onPress={() => setModalBaja(true)}>
                  <Text style={[styles.textoBotonOpcion, styles.textoRojo]}>Dar de baja al usuario</Text>
                </Pressable>
              </View>
            </View>

          </View>
        </View>
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
    paddingVertical: 50,
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
  tituloPagina: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 40,
    color: '#29166F',
    marginBottom: 40,
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
  botonOpcion: {
    borderWidth: 2,
    borderColor: '#29166F',
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  textoBotonOpcion: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#29166F',
  },
  botonRojo: {
    borderColor: '#DB3632',
  },
  textoRojo: {
    color: '#DB3632',
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
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  textoBotonModal: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#FFF',
  }
});