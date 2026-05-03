import { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { AuthContext } from './auth-context';
import { router } from 'expo-router';
import { AlertaContext } from './alerta-context';

export default function GestionUsuariosPage() {
  const auth = useContext(AuthContext);
  const alerta = useContext(AlertaContext);
  
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [usuarioABorrar, setUsuarioABorrar] = useState<string | null>(null);

  const cargarUsuarios = async () => {
    try {
      const urlApi = Platform.OS === 'web' 
        ? `http://localhost:8000/usuarios` 
        : `http://192.168.1.43:8000/usuarios`; 
      
      const respuesta = await fetch(urlApi, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth?.usuario?.token}`
        }
      });
      const datos = await respuesta.json();

      if (respuesta.ok) {
        setUsuarios(datos);
      }
    } catch (error) {
      alerta?.mostrarAlerta("Error", String(error));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (auth?.usuario?.token) {
      cargarUsuarios();
    }
  }, [auth?.usuario?.token]);

  const confirmarBaja = async () => {
    if (!usuarioABorrar) return;
    
    try {
      const urlApi = Platform.OS === 'web' 
        ? `http://localhost:8000/usuarios/${usuarioABorrar}` 
        : `http://192.168.1.43:8000/usuarios/${usuarioABorrar}`; 
      
      const respuesta = await fetch(urlApi, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${auth?.usuario?.token}`
        }
      });
      
      if (respuesta.ok) {
        setUsuarios(usuarios.filter(u => u.id !== usuarioABorrar));
        setModalVisible(false);
        setUsuarioABorrar(null);
      } else {
        const errorData = await respuesta.json();
        alerta?.mostrarAlerta("Error", errorData.detail || 'No se pudo eliminar');
      }
    } catch (error) {
      alerta?.mostrarAlerta("Error", String(error));
    }
  };

  const abrirModalBaja = (id: string) => {
    setUsuarioABorrar(id);
    setModalVisible(true);
  };

  const formatearFecha = (fechaIso: string) => {
    if (!fechaIso) return 'Nunca';
    const fecha = new Date(fechaIso);
    return fecha.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (cargando) {
    return (
      <View style={styles.contenedorCarga}>
        <ActivityIndicator size="large" color="#29166F" />
      </View>
    );
  }

  return (
    <View style={styles.contenedorFondo}>
      <ScrollView contentContainerStyle={styles.scrollContenido}>
        <Text style={styles.tituloPagina}>Gestión de usuarios</Text>

        <View style={styles.gridUsuarios}>
          {usuarios.map(u => (
            <View key={u.id} style={styles.tarjetaUsuario}>
              <View style={styles.infoContenedor}>
                <Text style={styles.nombreUsuario}>{u.nombre} {u.apellidos}</Text>
                <Text style={styles.infoUsuario}>Rol: {u.rol}</Text>
                <Text style={styles.infoUsuario}>Último acceso: {formatearFecha(u.ultimo_acceso)}</Text>
              </View>

              <View style={styles.contenedorBotones}>
                <Pressable 
                  style={styles.botonAdministrar}
                  onPress={() => router.push({ pathname: '/administrar-usuario', params: { id: u.id } })}
                >
                  <Text style={styles.textoBotonAdministrar}>Administrar</Text>
                </Pressable>
                <Pressable style={styles.botonBaja} onPress={() => abrirModalBaja(u.id)}>
                  <Text style={styles.textoBotonBaja}>Dar de baja</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
        
        <Pressable style={styles.botonCrearUsuario} onPress={() => router.push('/crear-usuario')}>
          <Text style={styles.textoBotonCrear}>Crear nuevo usuario</Text>
        </Pressable>
      </ScrollView>

      {modalVisible && (
        <View style={styles.overlayModal}>
          <View style={styles.cajaModal}>
            <Text style={styles.textoModal}>¿Estás seguro de que deseas dar de baja a este usuario?</Text>
            <View style={styles.botonesModal}>
              <Pressable style={styles.botonCancelarModal} onPress={() => setModalVisible(false)}>
                <Text style={styles.textoCancelarModal}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.botonConfirmarModal} onPress={confirmarBaja}>
                <Text style={styles.textoConfirmarModal}>Sí</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedorCarga: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#FAFAFA' 
  },
  contenedorFondo: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContenido: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    paddingBottom: 80,
  },
  tituloPagina: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 32,
    color: '#29166F',
    marginBottom: 40,
    width: '100%',
    maxWidth: 800,
    textAlign: 'left',
  },
  gridUsuarios: {
    width: '100%',
    maxWidth: 800,
    gap: 20,
  },
  tarjetaUsuario: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    width: '100%',
  },
  infoContenedor: {
    marginBottom: 20,
  },
  nombreUsuario: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#29166F',
    marginBottom: 8,
  },
  infoUsuario: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#333333',
    marginBottom: 4,
  },
  contenedorBotones: {
    flexDirection: 'row',
    gap: 15,
  },
  botonAdministrar: {
    backgroundColor: '#EEEEEE',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  textoBotonAdministrar: {
    color: '#333333',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  botonBaja: {
    backgroundColor: '#FFEEED',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD3D1',
  },
  textoBotonBaja: {
    color: '#DB3632',
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  botonCrearUsuario: {
    backgroundColor: '#29166F',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 6,
    marginTop: 40,
    alignItems: 'center',
    width: '100%',
    maxWidth: 800,
  },
  textoBotonCrear: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  overlayModal: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  } as any,
  cajaModal: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  textoModal: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 26,
  },
  botonesModal: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
  },
  botonCancelarModal: {
    backgroundColor: '#EEEEEE',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  textoCancelarModal: {
    color: '#333333',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  botonConfirmarModal: {
    backgroundColor: '#DB3632',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  textoConfirmarModal: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
});