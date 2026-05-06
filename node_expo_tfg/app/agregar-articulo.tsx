import { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, Image, Platform, useWindowDimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { AuthContext } from './auth-context';
import { AlertaContext } from './alerta-context';

export default function AgregarArticuloPage() {
  const { width } = useWindowDimensions();
  const esMovil = width < 768;
  const router = useRouter();
  const auth = useContext(AuthContext);
  const alerta = useContext(AlertaContext);
  const BASE_URL = process.env.EXPO_PUBLIC_API_URL || '';

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [busquedaCategoria, setBusquedaCategoria] = useState('');
  const [imagenUri, setImagenUri] = useState<string | null>(null);
  const [imagenBase64, setImagenBase64] = useState<string | null>(null);
  
  const [medidas, setMedidas] = useState([
    { id: Date.now().toString(), medida: '', precio: '', stock: '', disponible: true }
  ]);
  const [guardando, setGuardando] = useState(false);

  const [categoriasLista, setCategoriasLista] = useState<any[]>([]);
  const [mostrarCategorias, setMostrarCategorias] = useState(false);
  const [creandoCategoria, setCreandoCategoria] = useState(false);
  const [nuevaCategoriaTexto, setNuevaCategoriaTexto] = useState('');

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const urlApi = `${BASE_URL}/api/categorias`;
        const res = await fetch(urlApi);
        if (res.ok) {
          const data = await res.json();
          setCategoriasLista(data);
        }
      } catch (e) {}
    };
    fetchCategorias();
  }, []);

  const categoriasFiltradas = categoriasLista.filter(c => 
    c.nombre.toLowerCase().includes(busquedaCategoria.toLowerCase())
  );

  const guardarNuevaCategoria = async () => {
    if (!nuevaCategoriaTexto.trim()) return;
    try {
      const urlApi = `${BASE_URL}/api/categorias`;
      const res = await fetch(urlApi, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth?.usuario?.token}`
        },
        body: JSON.stringify({ nombre: nuevaCategoriaTexto })
      });
      if (res.ok) {
        const data = await res.json();
        setCategoriasLista([...categoriasLista, data]);
        setCategoria(data.id);
        setBusquedaCategoria(data.nombre);
        setCreandoCategoria(false);
        setNuevaCategoriaTexto('');
        setMostrarCategorias(false);
      } else {
        alerta?.mostrarAlerta("Error", "No se pudo crear la categoría");
      }
    } catch (e) {}
  };

  const seleccionarImagen = async () => {
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!resultado.canceled) {
      setImagenUri(resultado.assets[0].uri);
      setImagenBase64(resultado.assets[0].base64 || null);
    }
  };

  const agregarMedida = () => {
    setMedidas([...medidas, { id: Date.now().toString(), medida: '', precio: '', stock: '', disponible: true }]);
  };

  const actualizarMedida = (id: string, campo: string, valor: any) => {
    setMedidas(medidas.map(m => m.id === id ? { ...m, [campo]: valor } : m));
  };

  const eliminarMedida = (id: string) => {
    if (medidas.length > 1) {
      setMedidas(medidas.filter(m => m.id !== id));
    }
  };

  const manejarGuardarArticulo = async () => {
    if (!nombre || !categoria || !descripcion) {
      alerta?.mostrarAlerta("Error", "Por favor rellena el nombre, selecciona una categoría y añade la descripción.");
      return;
    }

    for (let m of medidas) {
      if (!m.medida || !m.precio || !m.stock) {
        alerta?.mostrarAlerta("Error", "Todas las variantes deben tener medida, precio y stock rellenados.");
        return;
      }
    }

    if (!auth?.usuario?.token) {
      alerta?.mostrarAlerta("Error", "No tienes permisos para realizar esta acción.");
      return;
    }

    setGuardando(true);

    try {
      const urlApi = `${BASE_URL}/api/articulos`;
      
      const medidasFormateadas = medidas.map(m => ({
        medida: m.medida,
        precio: parseFloat(m.precio),
        stock: parseInt(m.stock, 10),
        disponible: m.disponible
      }));

      const bodyJSON = {
        nombre: nombre,
        descripcion: descripcion,
        categoria: categoria,
        imagen_base64: imagenBase64,
        medidas: medidasFormateadas
      };

      const respuesta = await fetch(urlApi, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.usuario.token}`
        },
        body: JSON.stringify(bodyJSON)
      });

      const datos = await respuesta.json();

      if (respuesta.ok) {
        alerta?.mostrarAlerta("Éxito", "El artículo se ha guardado correctamente en el catálogo.");
        router.back();
      } else {
        alerta?.mostrarAlerta("Error", datos.detail || "Hubo un error al guardar el artículo.");
      }
    } catch (error) {
      alerta?.mostrarAlerta("Error", "Problema de conexión con el servidor.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View style={styles.contenedorFondo}>
      <ScrollView contentContainerStyle={styles.scrollContenido} keyboardShouldPersistTaps="handled">
        <View style={styles.contenedorFormulario}>
          
          <Text style={styles.tituloPagina}>Añadir nuevo artículo</Text>

          <View style={[styles.contenedorPrincipal, esMovil && styles.contenedorPrincipalMovil]}>
            
            <View style={styles.columnaImagen}>
              <View style={styles.cajaImagen}>
                <Image 
                  source={imagenUri ? { uri: imagenUri } : require('@/assets/images/placeholder.png')} 
                  style={styles.imagenPrevia} 
                  resizeMode="contain" 
                />
              </View>
              <Pressable style={styles.botonSubirImagen} onPress={seleccionarImagen}>
                <Text style={styles.textoBotonSecundario}>Subir Fotografía</Text>
              </Pressable>
            </View>

            <View style={styles.columnaDatos}>
              <View style={styles.grupoInput}>
                <Text style={styles.label}>Nombre del artículo</Text>
                <TextInput 
                  style={styles.input} 
                  value={nombre} 
                  onChangeText={setNombre} 
                  placeholder="Ej: Juego de sábanas coralina"
                />
              </View>

              <View style={[styles.grupoInput, { zIndex: 10 }]}>
                <Text style={styles.label}>Categoría</Text>
                <TextInput 
                  style={[styles.input, mostrarCategorias && { zIndex: 101, position: 'relative' }]} 
                  value={busquedaCategoria} 
                  onChangeText={(text) => {
                    setBusquedaCategoria(text);
                    setMostrarCategorias(true);
                    if (categoria) setCategoria('');
                  }}
                  onFocus={() => {
                    setMostrarCategorias(true);
                    setCreandoCategoria(false);
                  }}
                  placeholder="Buscar o seleccionar categoría..."
                />

                {mostrarCategorias && (
                  <>
                    <Pressable 
                      style={styles.overlayCerrar} 
                      onPress={() => {
                        setMostrarCategorias(false);
                        setCreandoCategoria(false);
                        setBusquedaCategoria(categoria ? (categoriasLista.find(c => c.id === categoria)?.nombre || '') : '');
                      }}
                    />
                    <View style={styles.cajaOpcionesCategoria}>
                      <ScrollView style={{maxHeight: 180}} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                        {categoriasFiltradas.map(cat => (
                          <Pressable 
                            key={cat.id} 
                            style={styles.opcionCategoria} 
                            onPress={() => { 
                              setCategoria(cat.id); 
                              setBusquedaCategoria(cat.nombre);
                              setMostrarCategorias(false); 
                              setCreandoCategoria(false); 
                            }}
                          >
                            <Text style={{fontFamily: 'Inter_400Regular', fontSize: 16, color: '#333'}}>{cat.nombre}</Text>
                          </Pressable>
                        ))}
                        
                        {!creandoCategoria ? (
                          <Pressable 
                            style={[styles.opcionCategoria, {backgroundColor: '#F9F9F9'}]} 
                            onPress={() => {
                              setCreandoCategoria(true);
                              setNuevaCategoriaTexto(busquedaCategoria);
                            }}
                          >
                            <Text style={{fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#29166F'}}>+ Añadir nueva categoría</Text>
                          </Pressable>
                        ) : (
                          <View style={[styles.opcionCategoria, {backgroundColor: '#F9F9F9'}]}>
                            <View style={styles.filaNuevaCategoria}>
                              <TextInput 
                                style={[styles.input, {flex: 1, height: 45}]} 
                                placeholder="Nombre de la categoría" 
                                value={nuevaCategoriaTexto} 
                                onChangeText={setNuevaCategoriaTexto} 
                                autoFocus
                              />
                              <Pressable style={styles.botonGuardarMini} onPress={guardarNuevaCategoria}>
                                <Text style={{color: '#FFF', fontFamily: 'Inter_600SemiBold', fontSize: 14}}>Guardar</Text>
                              </Pressable>
                            </View>
                            <Pressable onPress={() => setCreandoCategoria(false)} style={{marginTop: 10}}>
                              <Text style={{color: '#DB3632', fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'right'}}>Cancelar</Text>
                            </Pressable>
                          </View>
                        )}
                      </ScrollView>
                    </View>
                  </>
                )}
              </View>

              <View style={[styles.grupoInput, { zIndex: 1 }]}>
                <Text style={styles.label}>Descripción</Text>
                <TextInput 
                  style={[styles.input, styles.inputArea]} 
                  value={descripcion} 
                  onChangeText={setDescripcion} 
                  multiline={true}
                  numberOfLines={4}
                  placeholder="Describe los detalles, materiales, etc."
                />
              </View>
            </View>
          </View>

          <View style={styles.seccionMedidas}>
            <View style={styles.cabeceraMedidas}>
              <Text style={styles.subtituloPagina}>Variantes y Precios</Text>
              <Pressable style={styles.botonAnadirMedida} onPress={agregarMedida}>
                <Text style={styles.textoBotonSecundario}>+ Añadir medida</Text>
              </Pressable>
            </View>

            <View style={[styles.titulosColumnasMedidas, esMovil && styles.ocultarEnMovil]}>
              <Text style={[styles.tituloColumna, { flex: 2 }]}>Medida</Text>
              <Text style={[styles.tituloColumna, { flex: 1 }]}>Precio (€)</Text>
              <Text style={[styles.tituloColumna, { flex: 1 }]}>Stock</Text>
              <View style={styles.espacioBotonX} />
            </View>

            {medidas.map((item, index) => (
              <View key={item.id} style={[styles.filaMedida, esMovil && styles.filaMedidaMovil]}>
                <TextInput 
                  style={[styles.input, esMovil ? styles.inputMovilAncho : { flex: 2 }]} 
                  value={item.medida} 
                  onChangeText={(texto) => actualizarMedida(item.id, 'medida', texto)} 
                  placeholder="Ej: Cama 90cm"
                />
                <TextInput 
                  style={[styles.input, esMovil ? styles.inputMovilMitad : { flex: 1 }]} 
                  value={item.precio} 
                  onChangeText={(texto) => actualizarMedida(item.id, 'precio', texto)} 
                  placeholder="0.00"
                  keyboardType="numeric"
                />
                <TextInput 
                  style={[styles.input, esMovil ? styles.inputMovilMitad : { flex: 1 }]} 
                  value={item.stock} 
                  onChangeText={(texto) => actualizarMedida(item.id, 'stock', texto)} 
                  placeholder="0"
                  keyboardType="numeric"
                />
                
                <View style={styles.filaAccionesVariante}>
                  <Pressable 
                    style={[styles.botonDisponible, item.disponible ? styles.botonDisponibleActivo : styles.botonDisponibleInactivo]}
                    onPress={() => actualizarMedida(item.id, 'disponible', !item.disponible)}
                  >
                    <Text style={[styles.textoDisponible, item.disponible ? styles.textoDisponibleActivo : styles.textoDisponibleInactivo]}>
                      {item.disponible ? 'Disponible' : 'Agotado'}
                    </Text>
                  </Pressable>

                  <Pressable 
                    style={[styles.botonEliminarFila, medidas.length === 1 && { opacity: 0.3 }]} 
                    onPress={() => eliminarMedida(item.id)}
                    disabled={medidas.length === 1}
                  >
                    <Text style={styles.textoBotonEliminar}>X</Text>
                  </Pressable>
                </View>

              </View>
            ))}
          </View>

          {!esMovil && (
            <View style={styles.contenedorAcciones}>
              <Pressable style={styles.botonCancelar} onPress={() => router.push('/catalogo')} disabled={guardando}>
                <Text style={styles.textoBotonSecundario}>Cancelar</Text>
              </Pressable>
              <Pressable 
                style={[styles.botonGuardar, guardando && { opacity: 0.7 }]} 
                onPress={manejarGuardarArticulo}
                disabled={guardando}
              >
                <Text style={styles.textoBotonGuardar}>{guardando ? 'Guardando...' : 'Guardar Artículo'}</Text>
              </Pressable>
            </View>
          )}
        </View>

        {esMovil && (
          <View style={styles.contenedorAccionesMovil}>
            <Pressable style={styles.botonCancelarMovil} onPress={() => router.push('/catalogo')} disabled={guardando}>
              <Text style={styles.textoBotonSecundario}>Cancelar</Text>
            </Pressable>
            <Pressable 
              style={[styles.botonGuardarMovil, guardando && { opacity: 0.7 }]} 
              onPress={manejarGuardarArticulo}
              disabled={guardando}
            >
              <Text style={styles.textoBotonGuardar}>{guardando ? 'Guardando...' : 'Guardar Artículo'}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
  contenedorFormulario: {
    width: '100%',
    maxWidth: 1000,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  tituloPagina: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 32,
    color: '#29166F',
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 15,
  },
  subtituloPagina: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 22,
    color: '#000000',
  },
  contenedorPrincipal: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 40,
  },
  contenedorPrincipalMovil: {
    flexDirection: 'column',
  },
  columnaImagen: {
    flex: 1,
    alignItems: 'center',
    gap: 15,
  },
  columnaDatos: {
    flex: 2,
    gap: 20,
  },
  cajaImagen: {
    width: '100%',
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: '#EEEEEE',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    overflow: 'hidden',
  },
  imagenPrevia: {
    width: '100%',
    height: '100%',
  },
  grupoInput: {
    width: '100%',
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 6,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    backgroundColor: '#FFFFFF',
    color: '#000000',
    minWidth: 0,
  },
  inputArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  overlayCerrar: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    top: Platform.OS === 'web' ? 0 : -2000,
    bottom: Platform.OS === 'web' ? 0 : -2000,
    left: Platform.OS === 'web' ? 0 : -2000,
    right: Platform.OS === 'web' ? 0 : -2000,
    zIndex: 100,
    backgroundColor: 'transparent',
    cursor: 'default',
  } as any,
  cajaOpcionesCategoria: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderTopWidth: 0,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    position: 'absolute',
    top: 75,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  opcionCategoria: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  filaNuevaCategoria: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  botonGuardarMini: {
    backgroundColor: '#29166F',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 6,
    justifyContent: 'center',
  },
  seccionMedidas: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 30,
  },
  cabeceraMedidas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    gap: 15,
  },
  titulosColumnasMedidas: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 10,
    paddingHorizontal: 5,
    width: '100%',
  },
  tituloColumna: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#666666',
  },
  espacioBotonX: {
    width: 160,
  },
  filaMedida: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
    alignItems: 'center',
    width: '100%',
  },
  filaMedidaMovil: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#F9F9F9',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  inputMovilAncho: {
    width: '100%',
  },
  inputMovilMitad: {
    width: '47%',
  },
  ocultarEnMovil: {
    display: 'none',
  },
  filaAccionesVariante: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: 160,
  },
  botonDisponible: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
  },
  botonDisponibleActivo: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  botonDisponibleInactivo: {
    backgroundColor: '#FFEEED',
    borderColor: '#DB3632',
  },
  textoDisponible: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  textoDisponibleActivo: {
    color: '#4CAF50',
  },
  textoDisponibleInactivo: {
    color: '#DB3632',
  },
  botonEliminarFila: {
    width: 40,
    height: 48,
    backgroundColor: '#FFEEED',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFD3D1',
  },
  textoBotonEliminar: {
    color: '#DB3632',
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  botonSubirImagen: {
    backgroundColor: '#EEEEEE',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    width: '100%',
    alignItems: 'center',
  },
  botonAnadirMedida: {
    backgroundColor: '#EEEEEE',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
  },
  contenedorAcciones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 15,
    marginTop: 40,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 30,
  },
  contenedorAccionesMovil: {
    flexDirection: 'column',
    width: '100%',
    marginTop: 20,
    gap: 15,
  },
  botonCancelar: {
    backgroundColor: '#EEEEEE',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonCancelarMovil: {
    backgroundColor: '#EEEEEE',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  textoBotonSecundario: {
    color: '#333333',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  botonGuardar: {
    backgroundColor: '#29166F',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 150,
  },
  botonGuardarMovil: {
    backgroundColor: '#29166F',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  textoBotonGuardar: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  }
});