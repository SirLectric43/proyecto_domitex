import { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ScrollView, Image, ActivityIndicator, TextInput, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AuthContext } from './auth-context';

export default function VistaArticuloPage() {
  const { id } = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const esMovil = width < 768;
  const auth = useContext(AuthContext);

  const [articulo, setArticulo] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  
  const [medidaSeleccionada, setMedidaSeleccionada] = useState<any>(null);
  const [cantidad, setCantidad] = useState("1");

  useEffect(() => {
    const obtenerDetalle = async () => {
      try {
        const urlApi = Platform.OS === 'web' 
          ? `http://localhost:8000/articulos/${id}` 
          : `http://192.168.1.43:8000/articulos/${id}`; 
        
        const respuesta = await fetch(urlApi, {
          headers: auth?.usuario?.token ? { 'Authorization': `Bearer ${auth.usuario.token}` } : {}
        });
        const datos = await respuesta.json();

        if (respuesta.ok) {
          setArticulo(datos);
          if (datos.medidas && datos.medidas.length > 0) {
            setMedidaSeleccionada(datos.medidas[0]);
          }
        }
      } catch (error) {
        console.error("Error al cargar artículo:", error);
      } finally {
        setCargando(false);
      }
    };
    if (id) obtenerDetalle();
  }, [id]);

  const manejarCantidad = (texto: string) => {
    const numero = texto.replace(/[^0-9]/g, '');
    setCantidad(numero);
  };

  const incrementar = () => setCantidad(String(Number(cantidad || 0) + 1));
  const decrementar = () => setCantidad(String(Math.max(1, Number(cantidad || 0) - 1)));

  const anadirAlCarrito = () => {
    if (!medidaSeleccionada) return;
    const cantNum = Number(cantidad);
    if (cantNum <= 0) return alert("Introduce una cantidad válida");
    
    alert(`Añadido al carrito:\n${cantNum}x ${articulo.nombre} (${medidaSeleccionada.medida})`);
  };

  if (cargando) {
    return (
      <View style={styles.contenedorCarga}>
        <ActivityIndicator size="large" color="#29166F" />
      </View>
    );
  }

  if (!articulo) return <Text style={{marginTop: 100, textAlign: 'center'}}>Artículo no encontrado.</Text>;

  return (
    <View style={styles.contenedorFondo}>
      <ScrollView contentContainerStyle={styles.scrollContenido}>
        <View style={styles.tarjetaPrincipal}>
          <View style={[styles.layoutGrid, esMovil && styles.layoutGridMovil]}>
            <View style={[styles.columnaIzquierda, esMovil && styles.columnaIzquierdaMovil]}>
              <Image source={{ uri: articulo.imagen_url }} style={styles.imagen} resizeMode="contain" />
              {!esMovil && (
                <Pressable style={styles.botonCarrito} onPress={anadirAlCarrito}>
                  <Text style={styles.textoBotonCarrito}>Añadir a la cesta</Text>
                </Pressable>
              )}
            </View>
            <View style={styles.columnaDerecha}>
              <Text style={styles.titulo}>{articulo.nombre}</Text>
              <View style={[styles.filaContenidoRow, esMovil && styles.filaContenidoCol]}>
                <View style={styles.cajaDescripcion}>
                  <Text style={styles.descripcion}>{articulo.descripcion}</Text>
                </View>
                <View style={styles.cajaCantidad}>
                  <Text style={styles.etiqueta}>Cantidad:</Text>
                  <View style={styles.selectorCantidad}>
                    <Pressable onPress={decrementar}>
                      <Image source={require('@/assets/images/iconoMenos.png')} style={styles.iconoCantidad} />
                    </Pressable>
                    <TextInput 
                      style={styles.inputCantidad}
                      value={cantidad}
                      onChangeText={manejarCantidad}
                      keyboardType="numeric"
                    />
                    <Pressable onPress={incrementar}>
                      <Image source={require('@/assets/images/iconoMas.png')} style={styles.iconoCantidad} />
                    </Pressable>
                  </View>
                  <Text style={styles.precio}>
                    {medidaSeleccionada ? `${medidaSeleccionada.precio.toFixed(2).replace('.', ',')} €` : '-- €'}
                  </Text>
                  <Text style={styles.textoUnitario}>(Precio unitario)</Text>
                </View>
              </View>
              <View style={styles.cajaMedidas}>
                <Text style={styles.etiqueta}>Medidas:</Text>
                <View style={styles.contenedorBotonesMedida}>
                  {articulo.medidas?.map((med: any) => (
                    <Pressable 
                      key={med.id} 
                      style={[styles.botonMedida, medidaSeleccionada?.id === med.id && styles.botonMedidaActivo]}
                      onPress={() => setMedidaSeleccionada(med)}
                    >
                      <Text style={[styles.textoMedida, medidaSeleccionada?.id === med.id && styles.textoMedidaActivo]}>
                        {med.medida}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </View>
          {esMovil && (
            <Pressable style={[styles.botonCarrito, { marginTop: 30 }]} onPress={anadirAlCarrito}>
              <Text style={styles.textoBotonCarrito}>Añadir a la cesta</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedorCarga: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#FFF' 
  },
  contenedorFondo: { 
    flex: 1, 
    backgroundColor: 
    '#FAFAFA' 
  },
  scrollContenido: { 
    padding: 20, 
    alignItems: 'center', 
    paddingBottom: 100 
  },
  tarjetaPrincipal: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 1100,
    borderRadius: 12,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginTop: 20,
  },
  layoutGrid: { 
    flexDirection: 'row', 
    gap: 40 
  },
  layoutGridMovil: { 
    flexDirection: 'column', 
    gap: 20 
  },
  columnaIzquierda: { 
    width: 350, 
    alignItems: 'center' 
  },
  columnaIzquierdaMovil: { 
    width: '100%' 
  },
  imagen: { 
    width: '100%', 
    height: 350, 
    marginBottom: 30 
  },
  botonCarrito: {
    backgroundColor: '#29166F',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  textoBotonCarrito: { 
    color: '#FFFFFF', 
    fontFamily: 'Montserrat_700Bold', 
    fontSize: 18 
  },
  columnaDerecha: { 
    flex: 1 
  },
  titulo: { 
    fontFamily: 'Montserrat_700Bold', 
    fontSize: 32, 
    color: '#000', 
    marginBottom: 20, 
    textAlign: 'center' 
  },
  filaContenidoRow: { 
    flexDirection: 'row', 
    gap: 30, 
    marginBottom: 30 
  },
  filaContenidoCol: { 
    flexDirection: 'column-reverse', 
    gap: 20 
  },
  cajaDescripcion: { 
    flex: 2, 
    paddingRight: 20 
  },
  descripcion: { 
    fontFamily: 'Inter_400Regular', 
    fontSize: 16, 
    color: '#333', 
    lineHeight: 24, 
    textAlign: 'justify' 
  },
  cajaCantidad: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'flex-start' 
  },
  etiqueta: { 
    fontFamily: 'Inter_400Regular', 
    fontSize: 18, 
    color: '#000', 
    marginBottom: 15 
  },
  selectorCantidad: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 15, 
    marginBottom: 20 
  },
  iconoCantidad: { 
    width: 40, 
    height: 40 
  },
  inputCantidad: {
    borderWidth: 1,
    borderColor: '#29166F',
    borderRadius: 8,
    width: 60,
    height: 40,
    textAlign: 'center',
    fontFamily: 'Montserrat_700Bold',
    fontSize: 20,
    color: '#DB3632',
  },
  precio: { 
    fontFamily: 'Montserrat_700Bold', 
    fontSize: 28, 
    color: '#DB3632', 
    marginTop: 10 
  },
  cajaMedidas: { 
    width: '100%', 
    alignItems: 'center' 
  },
  contenedorBotonesMedida: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'center', 
    gap: 15
  },
  botonMedida: {
    borderWidth: 1,
    borderColor: '#29166F',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
  },
  botonMedidaActivo: { 
    backgroundColor: '#29166F' 
  },
  textoMedida: { 
    fontFamily: 'Montserrat_700Bold', 
    fontSize: 20, 
    color: '#29166F' 
  },
  textoMedidaActivo: { 
    color: '#FFF' 
  },
  textoUnitario: { 
    fontFamily: 'Inter_400Regular', 
    fontSize: 12, 
    color: '#666666', 
    marginTop: 2 
  },
});