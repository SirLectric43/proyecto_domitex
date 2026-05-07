import { useState, useEffect, useContext, useCallback } from "react";
import { View, Text, TextInput, StyleSheet, Pressable, Image, Platform, useWindowDimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter, usePathname } from 'expo-router';
import { AuthContext } from './auth-context';
import { traducirError } from '@/utils/errores';
import { AlertaContext } from './alerta-context';

export default function NavbarPrivado() {
  const auth = useContext(AuthContext);
  const router = useRouter();
  const pathname = usePathname();
  const alerta = useContext(AlertaContext);
  
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [busquedaAbierta, setBusquedaAbierta] = useState(false);
  const [notificacionesAbiertas, setNotificacionesAbiertas] = useState(false);
  
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<any[]>([]);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);

  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const cantidadNoLeidas = notificaciones.filter(n => !n.leida).length;

  const { width } = useWindowDimensions();
  const esMovil = width < 768;
  const BASE_URL = process.env.EXPO_PUBLIC_API_URL || '';

  const rutasPrincipales = ['/catalogo', '/panel-administrador', '/gestion-pedidos', '/gestion-usuarios'];
  const mostrarBotonVolver = esMovil && !rutasPrincipales.includes(pathname);

  const esAdmin = auth?.usuario?.rol === 'admin';

  useEffect(() => {
    if (busqueda.trim().length < 2) {
      setResultados([]);
      setMostrarDropdown(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const urlApi = `${BASE_URL}/api/articulos/buscar?q=${encodeURIComponent(busqueda)}`;
          
        const respuesta = await fetch(urlApi, {
          headers: auth?.usuario?.token ? { 'Authorization': `Bearer ${auth.usuario.token}` } : {}
        });
        
        if (respuesta.ok) {
          const datos = await respuesta.json();
          setResultados(datos);
          setMostrarDropdown(true);
        }
      } catch (e: any) {
        const mensajeError = traducirError(e.message);
        alerta?.mostrarAlerta("Error", mensajeError);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [busqueda, BASE_URL, alerta, auth?.usuario?.token]);

  const cargarNotificaciones = useCallback(async () => {
    if (!auth?.usuario?.token || esAdmin) return;
    try {
      const urlApi = `${BASE_URL}/api/notificaciones`;
        
      const respuesta = await fetch(urlApi, {
        headers: { 'Authorization': `Bearer ${auth.usuario.token}` }
      });
      
      if (respuesta.ok) {
        const datos = await respuesta.json();
        setNotificaciones(datos);
      }
    } catch (e: any) {
        const mensajeError = traducirError(e.message);
        alerta?.mostrarAlerta("Error", mensajeError);
    }
  }, [auth?.usuario?.token, esAdmin, BASE_URL, alerta]);

  useEffect(() => {
    cargarNotificaciones();
  }, [cargarNotificaciones]);

  const marcarComoLeidas = async () => {
    if (!auth?.usuario?.token || cantidadNoLeidas === 0 || esAdmin) return;
    try {
      const urlApi = `${BASE_URL}/api/notificaciones/marcar-leidas`;
        
      await fetch(urlApi, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${auth.usuario.token}` }
      });
      
      setNotificaciones(notificaciones.map(n => ({ ...n, leida: true })));
    } catch (e: any) {
      const mensajeError = traducirError(e.message);
      alerta?.mostrarAlerta("Error", mensajeError);
    }
  };

  const limpiarNotificaciones = async () => {
    if (!auth?.usuario?.token || esAdmin) return;
    try {
      const urlApi = `${BASE_URL}/api/notificaciones/limpiar`;
        
      const respuesta = await fetch(urlApi, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${auth.usuario.token}` }
      });
      
      if (respuesta.ok) {
        setNotificaciones([]);
      }
    } catch (e: any) {
        const mensajeError = traducirError(e.message);
        alerta?.mostrarAlerta("Error", mensajeError);
    }
  };

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
    if (notificacionesAbiertas) setNotificacionesAbiertas(false);
  };

  const toggleBusqueda = () => {
    setBusquedaAbierta(!busquedaAbierta);
    if (menuAbierto) setMenuAbierto(false);
    if (notificacionesAbiertas) setNotificacionesAbiertas(false);
    if (busquedaAbierta) {
      setBusqueda('');
      setMostrarDropdown(false);
    }
  };

  const toggleNotificaciones = () => {
    setNotificacionesAbiertas(!notificacionesAbiertas);
    if (!notificacionesAbiertas && cantidadNoLeidas > 0) {
      marcarComoLeidas();
    }
    if (menuAbierto) setMenuAbierto(false);
    if (busquedaAbierta) setBusquedaAbierta(false);
  };

  const irAlArticulo = (id: string) => {
    setBusqueda('');
    setMostrarDropdown(false);
    setBusquedaAbierta(false);
    router.push({ pathname: '/vista-articulo', params: { id } });
  };

  const irAlPedido = (pedidoId: string | null) => {
    setNotificacionesAbiertas(false);
    if (pedidoId) {
      router.push('/historial-compra');
    }
  };

  const formatearFecha = (fechaStr: string) => {
    const d = new Date(fechaStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <>
      {(menuAbierto || mostrarDropdown || notificacionesAbiertas) && (
        <Pressable 
          style={styles.overlayCerrar} 
          onPress={() => {
            setMenuAbierto(false);
            setMostrarDropdown(false);
            setNotificacionesAbiertas(false);
          }}
        />
      )}

      <View style={[styles.navbar, Platform.OS === 'web' && !esMovil && styles.navbarWeb]}>
        
        <View style={styles.contenedorIzquierda}>
          {mostrarBotonVolver && (
            <Pressable onPress={() => router.back()} style={styles.botonVolverMovil}>
              <Ionicons name="arrow-back" size={28} color="#29166F" />
            </Pressable>
          )}
          <Link href="/catalogo" asChild>
            <Pressable style={!esMovil && styles.contenedorLogo}>
              <Image 
                source={require('@/assets/images/navbarDomitex.png')} 
                style={[esMovil ? styles.logoMovil : styles.logoPc, mostrarBotonVolver && styles.logoMovilReducido]}
                resizeMode="contain"
              />
            </Pressable>
          </Link>
        </View>

        {!esMovil ? (
          <>
            <View style={[styles.contenedorBusqueda, mostrarDropdown && { overflow: 'visible', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }]}>
              <TextInput 
                style={styles.inputBusqueda} 
                placeholder="Buscar artículos..." 
                placeholderTextColor="#999"
                value={busqueda}
                onChangeText={setBusqueda}
              />
              <Pressable style={styles.botonBuscar}>
                <Image 
                  source={require('@/assets/images/iconoLupa.png')} 
                  style={styles.iconoBusqueda} 
                  resizeMode="contain" 
                />
              </Pressable>

              {mostrarDropdown && (
                <View style={styles.dropdownBuscadorPc}>
                  {resultados.length > 0 ? (
                    resultados.map((articulo) => (
                      <Pressable key={articulo.id} style={styles.itemResultado} onPress={() => irAlArticulo(articulo.id)}>
                        <Image source={{ uri: articulo.imagen_url }} style={styles.imagenMiniatura} />
                        <Text style={styles.textoResultado} numberOfLines={1}>{articulo.nombre}</Text>
                      </Pressable>
                    ))
                  ) : (
                    <Text style={styles.textoSinResultados}>No se encontraron artículos.</Text>
                  )}
                </View>
              )}
            </View>

            <View style={styles.contenedorAcciones}>
              {(auth?.usuario?.rol === 'admin' || auth?.usuario?.rol === 'empleado') && (
                <Link href="/panel-administrador" asChild>
                  <Pressable><Text style={styles.textoCatalogo}>Panel Admin</Text></Pressable>
                </Link>
              )}
              
              <Link href="/catalogo" asChild>
                <Pressable><Text style={styles.textoCatalogo}>Catálogo</Text></Pressable>
              </Link>
              
              {!esAdmin && (
                <View style={styles.contenedorRelativo}>
                  <Pressable style={styles.contenedorIconoConBadge} onPress={toggleNotificaciones}>
                    <Image 
                      source={require('@/assets/images/iconoCampana.png')} 
                      style={styles.iconoAccionImagen} 
                      resizeMode="contain" 
                    />
                    {cantidadNoLeidas > 0 ? (
                      <View style={styles.badgeCarrito}>
                        <Text style={styles.textoBadge}>
                          {cantidadNoLeidas > 99 ? '99+' : cantidadNoLeidas}
                        </Text>
                      </View>
                    ) : null}
                  </Pressable>

                  {notificacionesAbiertas && (
                    <View style={styles.menuDesplegableCampana}>
                      <View style={styles.cabeceraNotificaciones}>
                        <Text style={styles.tituloNotificaciones}>Notificaciones</Text>
                        {notificaciones.length > 0 && (
                          <Pressable onPress={limpiarNotificaciones}>
                            <Text style={styles.textoLimpiarNotificaciones}>Limpiar</Text>
                          </Pressable>
                        )}
                      </View>
                      <ScrollView style={styles.scrollNotificaciones}>
                        {notificaciones.length > 0 ? (
                          notificaciones.map((notif) => (
                            <Pressable 
                              key={notif.id} 
                              style={[styles.itemNotificacion, !notif.leida && styles.itemNotificacionNueva]}
                              onPress={() => irAlPedido(notif.pedido_id)}
                            >
                              <Text style={styles.textoNotificacionTitulo}>{notif.titulo}</Text>
                              <Text style={styles.textoNotificacionMensaje}>{notif.mensaje}</Text>
                              <Text style={styles.textoNotificacionFecha}>{formatearFecha(notif.fecha_creacion)}</Text>
                            </Pressable>
                          ))
                        ) : (
                          <Text style={styles.textoSinNotificaciones}>No tienes notificaciones.</Text>
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}
              
              {!esAdmin && (
                <Link href="/carrito" asChild>
                  <Pressable style={styles.contenedorIconoConBadge} onPress={() => setNotificacionesAbiertas(false)}>
                    <Image 
                      source={require('@/assets/images/iconoCarrito.png')} 
                      style={styles.iconoAccionImagen} 
                      resizeMode="contain" 
                    />
                    {auth?.cantidadCesta && auth.cantidadCesta > 0 ? (
                      <View style={styles.badgeCarrito}>
                        <Text style={styles.textoBadge}>
                          {auth.cantidadCesta > 99 ? '99+' : auth.cantidadCesta}
                        </Text>
                      </View>
                    ) : null}
                  </Pressable>
                </Link>
              )}

              <View style={styles.contenedorRelativo}>
                <Pressable style={styles.botonUsuario} onPress={toggleMenu}>
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
                    {!esAdmin && (
                      <Link href="/historial-compra" asChild>
                        <Pressable style={styles.itemMenu} onPress={() => { setMenuAbierto(false); }}>
                          <Text style={styles.textoItemMenu}>Historial de compra</Text>
                        </Pressable>
                      </Link>
                    )}
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
            {!esAdmin && (
              <View style={styles.contenedorRelativo}>
                <Pressable style={styles.contenedorIconoConBadgeMovil} onPress={toggleNotificaciones}>
                  <Image 
                    source={require('@/assets/images/iconoCampana.png')} 
                    style={styles.iconoAccionImagenMovil} 
                    resizeMode="contain" 
                  />
                  {cantidadNoLeidas > 0 ? (
                    <View style={styles.badgeCarrito}>
                      <Text style={styles.textoBadge}>
                        {cantidadNoLeidas > 99 ? '99+' : cantidadNoLeidas}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>

                {notificacionesAbiertas && (
                  <View style={styles.menuDesplegableCampanaMovil}>
                    <View style={styles.cabeceraNotificaciones}>
                      <Text style={styles.tituloNotificaciones}>Notificaciones</Text>
                      {notificaciones.length > 0 && (
                        <Pressable onPress={limpiarNotificaciones}>
                          <Text style={styles.textoLimpiarNotificaciones}>Limpiar</Text>
                        </Pressable>
                      )}
                    </View>
                    <ScrollView style={styles.scrollNotificaciones}>
                      {notificaciones.length > 0 ? (
                        notificaciones.map((notif) => (
                          <Pressable 
                            key={notif.id} 
                            style={[styles.itemNotificacion, !notif.leida && styles.itemNotificacionNueva]}
                            onPress={() => irAlPedido(notif.pedido_id)}
                          >
                            <Text style={styles.textoNotificacionTitulo}>{notif.titulo}</Text>
                            <Text style={styles.textoNotificacionMensaje}>{notif.mensaje}</Text>
                            <Text style={styles.textoNotificacionFecha}>{formatearFecha(notif.fecha_creacion)}</Text>
                          </Pressable>
                        ))
                      ) : (
                        <Text style={styles.textoSinNotificaciones}>No tienes notificaciones.</Text>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}
            <Pressable onPress={toggleMenu}>
              <Image source={require('@/assets/images/iconoMenu.png')} style={styles.iconoMenu} />
            </Pressable>
          </View>
        )}
      </View>

      {esMovil && menuAbierto && (
        <View style={styles.desplegableMovil}>
          {(auth?.usuario?.rol === 'admin' || auth?.usuario?.rol === 'empleado') && (
            <Link href="/panel-administrador" asChild>
              <Pressable style={styles.itemMenuMovil} onPress={() => setMenuAbierto(false)}>
                <Text style={styles.textoItemMenu}>Panel Admin</Text>
              </Pressable>
            </Link>
          )}
          
          <Link href="/perfil-usuario" asChild>
            <Pressable style={styles.itemMenuMovil} onPress={() => setMenuAbierto(false)}>
              <Text style={styles.textoItemMenu}>Perfil de usuario</Text>
            </Pressable>
          </Link>
          
          {!esAdmin && (
            <Link href="/historial-compra" asChild>
              <Pressable style={styles.itemMenuMovil} onPress={() => setMenuAbierto(false)}>
                <Text style={styles.textoItemMenu}>Historial de compra</Text>
              </Pressable>
            </Link>
          )}
          
          <Pressable style={[styles.itemMenuMovil, styles.itemMenuUltimo]} onPress={handleCerrarSesion}>
            <Text style={styles.textoItemMenu}>Cerrar sesión</Text>
          </Pressable>
        </View>
      )}

      {esMovil && busquedaAbierta && (
        <View style={[styles.contenedorBusquedaMovilFlotante, mostrarDropdown && { overflow: 'visible', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }]}>
          <TextInput 
            style={styles.inputBusqueda} 
            placeholder="Buscar artículos..." 
            placeholderTextColor="#999"
            value={busqueda}
            onChangeText={setBusqueda}
          />
          <Pressable style={styles.botonBuscar}>
            <Image 
              source={require('@/assets/images/iconoLupa.png')} 
              style={styles.iconoBusqueda} 
              resizeMode="contain" 
            />
          </Pressable>

          {mostrarDropdown && (
            <View style={styles.dropdownBuscadorMovil}>
              {resultados.length > 0 ? (
                resultados.map((articulo) => (
                  <Pressable key={articulo.id} style={styles.itemResultado} onPress={() => irAlArticulo(articulo.id)}>
                    <Image source={{ uri: articulo.imagen_url }} style={styles.imagenMiniatura} />
                    <Text style={styles.textoResultado} numberOfLines={1}>{articulo.nombre}</Text>
                  </Pressable>
                ))
              ) : (
                <Text style={styles.textoSinResultados}>No se encontraron artículos.</Text>
              )}
            </View>
          )}
        </View>
      )}

      {esMovil && (
        <View style={styles.barraNavegacionInferior}>
          <Link href="/catalogo" asChild>
            <Pressable style={styles.itemBarraInferior} onPress={() => { setMenuAbierto(false); setBusquedaAbierta(false); setNotificacionesAbiertas(false); }}>
              <Image source={require('@/assets/images/iconoInicio.png')} style={styles.iconoBarraInferior} resizeMode="contain" />
            </Pressable>
          </Link>

          <Pressable style={styles.itemBarraInferior} onPress={toggleBusqueda}>
            <Image source={require('@/assets/images/iconoBusqueda.png')} style={styles.iconoBarraInferior} resizeMode="contain" />
          </Pressable>

          {!esAdmin && (
            <Link href="/carrito" asChild>
              <Pressable style={styles.itemBarraInferior} onPress={() => { setMenuAbierto(false); setBusquedaAbierta(false); setNotificacionesAbiertas(false); }}>
                <View style={styles.contenedorIconoConBadge}>
                  <Image source={require('@/assets/images/iconoCarrito.png')} style={styles.iconoBarraInferior} resizeMode="contain" />
                  {auth?.cantidadCesta && auth.cantidadCesta > 0 ? (
                    <View style={styles.badgeCarrito}>
                      <Text style={styles.textoBadge}>
                        {auth.cantidadCesta > 99 ? '99+' : auth.cantidadCesta}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            </Link>
          )}
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
  contenedorIzquierda: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botonVolverMovil: {
    marginRight: 10,
    padding: 5,
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
  logoMovilReducido: {
    width: 160, 
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
  contenedorRelativo: {
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
  menuDesplegableCampana: {
    position: 'absolute',
    top: 55,
    right: -10,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#29166F',
    width: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5, 
    zIndex: 1000,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cabeceraNotificaciones: {
    backgroundColor: '#29166F',
    paddingVertical: 12,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tituloNotificaciones: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  textoLimpiarNotificaciones: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
  scrollNotificaciones: {
    maxHeight: 350,
  },
  itemNotificacion: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
  },
  itemNotificacionNueva: {
    backgroundColor: '#F5F5FA',
  },
  textoNotificacionTitulo: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#000',
    marginBottom: 4,
  },
  textoNotificacionMensaje: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  textoNotificacionFecha: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#999',
  },
  textoSinNotificaciones: {
    padding: 20,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#666',
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
  contenedorIconoConBadgeMovil: {
    position: 'relative',
    padding: 5,
  },
  iconoAccionImagenMovil: {
    width: 40,
    height: 40,
  },
  menuDesplegableCampanaMovil: {
    position: 'absolute',
    top: 55,
    right: -40,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#29166F',
    width: 280,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5, 
    zIndex: 1000,
    borderRadius: 8,
    overflow: 'hidden',
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
  },
  dropdownBuscadorPc: {
    position: 'absolute',
    top: 38,
    left: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#29166F',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    zIndex: 1000,
  },
  dropdownBuscadorMovil: {
    position: 'absolute',
    top: 43,
    left: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#29166F',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    zIndex: 1000,
  },
  itemResultado: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
  },
  imagenMiniatura: {
    width: 40,
    height: 40,
    marginRight: 15,
    resizeMode: 'contain',
  },
  textoResultado: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#000',
  },
  textoSinResultados: {
    padding: 15,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
  },
  contenedorIconoConBadge: {
    position: 'relative',
    padding: 5,
  },
  badgeCarrito: {
    position: 'absolute',
    top: -2,
    right: -5,
    backgroundColor: '#DB3632',
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  textoBadge: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
    textAlign: 'center',
  },
  overlayCerrar: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    top: Platform.OS === 'web' ? 0 : -1000,
    bottom: Platform.OS === 'web' ? 0 : -1000,
    left: Platform.OS === 'web' ? 0 : -1000,
    right: Platform.OS === 'web' ? 0 : -1000,
    zIndex: 998,
    backgroundColor: 'transparent',
    cursor: 'default',
  } as any,
});