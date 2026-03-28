import React, { useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Image, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { AuthContext } from './auth-context';

export default function NavbarPrivado() {
  const auth = useContext(AuthContext);
  const router = useRouter();
  
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [busquedaAbierta, setBusquedaAbierta] = useState(false);
  
  const { width } = useWindowDimensions();
  const esMovil = width < 768;

  const handleCerrarSesion = async () => {
    setMenuAbierto(false);
    if (auth?.cerrarSesionContext) {
      await auth.cerrarSesionContext();
      router.replace('/login');
    }
  };

  const toggleMenu = () => {
    setMenuAbierto(!menuAbierto);
    if (busquedaAbierta) setBusquedaAbierta(false);
  };

  const toggleBusqueda = () => {
    setBusquedaAbierta(!busquedaAbierta);
    if (menuAbierto) setMenuAbierto(false);
  };

  return (
    <>
      <View style={[styles.navbar, Platform.OS === 'web' && !esMovil && styles.navbarWeb]}>
        
        <Link href="/catalogo" asChild>
          <Pressable style={!esMovil && styles.contenedorLogo}>
            <Image 
              source={require('@/assets/images/navbarDomitex.png')} 
              style={esMovil ? styles.logoMovil : styles.logoPc}
              resizeMode="contain"
            />
          </Pressable>
        </Link>

        {!esMovil ? (
          <>
            <View style={styles.contenedorBusqueda}>
              <TextInput 
                style={styles.inputBusqueda} 
                placeholder="Buscar artículos..." 
                placeholderTextColor="#999"
              />
              <Pressable style={styles.botonBuscar}>
                <Image 
                  source={require('@/assets/images/iconoLupa.png')} 
                  style={styles.iconoBusqueda} 
                  resizeMode="contain" 
                />
              </Pressable>
            </View>

            <View style={styles.contenedorAcciones}>
              <Link href="/catalogo" asChild>
                <Pressable><Text style={styles.textoCatalogo}>Catálogo</Text></Pressable>
              </Link>
              
              <Pressable style={styles.iconoAccion}>
                <Image 
                  source={require('@/assets/images/iconoCampana.png')} 
                  style={styles.iconoAccionImagen} 
                  resizeMode="contain" 
                />
              </Pressable>
              
              <Pressable style={styles.iconoAccion}>
                <Image 
                  source={require('@/assets/images/iconoCarrito.png')} 
                  style={styles.iconoAccionImagen} 
                  resizeMode="contain" 
                />
              </Pressable>

              <View style={styles.contenedorUsuario}>
                <Pressable style={styles.botonUsuario} onPress={() => setMenuAbierto(!menuAbierto)}>
                  <Text style={styles.textoUsuario}>Hola, {auth?.usuario?.nombre || 'Usuario'}</Text>
                  <Ionicons name={menuAbierto ? "chevron-up" : "chevron-down"} size={20} color="#000" />
                </Pressable>

                {menuAbierto && (
                  <View style={styles.menuDesplegable}>
                    <Link href="/perfil-usuario" asChild>
                      <Pressable style={styles.itemMenu} onPress={() => { setMenuAbierto(false); }}>
                        <Text style={styles.textoItemMenu}>Perfil de usuario</Text>
                      </Pressable>
                    </Link>
                    <Pressable style={styles.itemMenu} onPress={() => { setMenuAbierto(false); }}>
                      <Text style={styles.textoItemMenu}>Historial de compra</Text>
                    </Pressable>
                    <Pressable style={[styles.itemMenu, styles.itemMenuUltimo]} onPress={handleCerrarSesion}>
                      <Text style={styles.textoItemMenu}>Cerrar sesión</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          </>
        ) : (
          <View style={styles.contenedorAccionesMovil}>
            <Pressable style={styles.iconoAccionMovil}>
              <Image 
                source={require('@/assets/images/iconoCampana.png')} 
                style={styles.iconoAccionImagenMovil} 
                resizeMode="contain" 
              />
            </Pressable>
            <Pressable onPress={toggleMenu}>
              <Image source={require('@/assets/images/iconoMenu.png')} style={styles.iconoMenu} />
            </Pressable>
          </View>
        )}
      </View>

      {esMovil && menuAbierto && (
        <View style={styles.desplegableMovil}>
          <Link href="/perfil-usuario" asChild>
            <Pressable style={styles.itemMenuMovil} onPress={() => setMenuAbierto(false)}>
              <Text style={styles.textoItemMenu}>Perfil de usuario</Text>
            </Pressable>
          </Link>
          
          <Pressable style={styles.itemMenuMovil} onPress={() => setMenuAbierto(false)}>
            <Text style={styles.textoItemMenu}>Historial de compra</Text>
          </Pressable>

          <Pressable style={[styles.itemMenuMovil, styles.itemMenuUltimo]} onPress={handleCerrarSesion}>
            <Text style={styles.textoItemMenu}>Cerrar sesión</Text>
          </Pressable>
        </View>
      )}

      {esMovil && busquedaAbierta && (
        <View style={styles.contenedorBusquedaMovilFlotante}>
          <TextInput 
            style={styles.inputBusqueda} 
            placeholder="Buscar artículos..." 
            placeholderTextColor="#999"
          />
          <Pressable style={styles.botonBuscar}>
            <Image 
              source={require('@/assets/images/iconoLupa.png')} 
              style={styles.iconoBusqueda} 
              resizeMode="contain" 
            />
          </Pressable>
        </View>
      )}

      {esMovil && (
        <View style={styles.barraNavegacionInferior}>
          <Link href="/catalogo" asChild>
            <Pressable style={styles.itemBarraInferior} onPress={() => { setMenuAbierto(false); setBusquedaAbierta(false); }}>
              <Image source={require('@/assets/images/iconoInicio.png')} style={styles.iconoBarraInferior} resizeMode="contain" />
            </Pressable>
          </Link>

          <Pressable style={styles.itemBarraInferior} onPress={toggleBusqueda}>
            <Image source={require('@/assets/images/iconoBusqueda.png')} style={styles.iconoBarraInferior} resizeMode="contain" />
          </Pressable>

          <Link href="/carrito" asChild>
            <Pressable style={styles.itemBarraInferior} onPress={() => { setMenuAbierto(false); setBusquedaAbierta(false); }}>
              <Image source={require('@/assets/images/iconoCarrito.png')} style={styles.iconoBarraInferior} resizeMode="contain" />
            </Pressable>
          </Link>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  navbar: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
    width: '100%',
    zIndex: 999,
  },
  navbarWeb: {
    paddingHorizontal: 50, 
  },
  contenedorLogo: {
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoPc: {
    width: 250, 
    height: 60,
    flexShrink: 0,
  },
  logoMovil: {
    width: 200,
    height: 50,
  },
  contenedorBusqueda: {
    flex: 1,
    flexDirection: 'row',
    maxWidth: 500,
    height: 40,
    borderWidth: 2,
    borderColor: '#29166F',
    borderRadius: 8,
    marginHorizontal: 20,
    overflow: 'hidden',
    backgroundColor: '#FFF',
  },
  inputBusqueda: Platform.OS === 'web' ? {
    flex: 1,
    paddingHorizontal: 15,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    outlineStyle: 'none', 
  } as any : {
    flex: 1,
    paddingHorizontal: 15,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
  },
  botonBuscar: {
    backgroundColor: '#DB3632',
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconoBusqueda: {
    width: 20,
    height: 20,
  },
  contenedorAcciones: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  textoCatalogo: {
    fontFamily: 'Inter_400Regular',
    fontSize: 18,
    color: '#000',
  },
  iconoAccion: {
    padding: 5,
  },
  iconoAccionImagen: {
    width: 50,
    height: 50,
  },
  contenedorUsuario: {
    position: 'relative',
    zIndex: 1000,
  },
  botonUsuario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  textoUsuario: {
    fontFamily: 'Inter_400Regular',
    fontSize: 18,
    color: '#000',
  },
  menuDesplegable: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#29166F',
    width: 220,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5, 
    zIndex: 1000,
  },
  itemMenu: {
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#29166F',
    alignItems: 'center',
  },
  itemMenuUltimo: {
    borderBottomWidth: 0,
  },
  textoItemMenu: {
    fontFamily: 'Inter_400Regular',
    fontSize: 18,
    color: '#000',
    textAlign: 'center',
  },
  contenedorAccionesMovil: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  iconoAccionMovil: {
    padding: 5,
  },
  iconoAccionImagenMovil: {
    width: 40,
    height: 40,
  },
  iconoMenu: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  desplegableMovil: {
    position: 'absolute',
    top: 82, 
    right: 20,
    backgroundColor: '#FFFFFF',
    width: 250,
    borderColor: '#29166F',
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 1000,
  },
  itemMenuMovil: {
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#29166F',
    alignItems: 'center',
  },
  contenedorBusquedaMovilFlotante: {
    position: 'absolute',
    top: 90, 
    left: 20,
    right: 20,
    flexDirection: 'row',
    height: 45,
    borderWidth: 2,
    borderColor: '#29166F',
    borderRadius: 8,
    backgroundColor: '#FFF',
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 1000,
  },
  barraNavegacionInferior: Platform.OS === 'web' ? {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    zIndex: 1000,
  } as any : {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    zIndex: 1000,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  itemBarraInferior: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  iconoBarraInferior: {
    width: 40,
    height: 40,
  }
});