import { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { AuthContext } from "./auth-context";
import { useRouter } from "expo-router";

export default function Carrito() {
  const { width } = useWindowDimensions();
  const esMovil = width < 768;
  const auth = useContext(AuthContext);
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerCarrito = async () => {
      if (!auth?.usuario?.token) return;
      try {
        const urlApi =
          Platform.OS === "web"
            ? `http://localhost:8000/carrito`
            : `http://192.168.1.43:8000/carrito`;

        const respuesta = await fetch(urlApi, {
          headers: { Authorization: `Bearer ${auth.usuario.token}` },
        });

        if (respuesta.ok) {
          const datos = await respuesta.json();
          setItems(datos);
        }
      } catch (error) {
        console.error("Error al cargar carrito:", error);
      } finally {
        setCargando(false);
      }
    };
    obtenerCarrito();
  }, [auth?.usuario?.token]);

  const cambiarCantidad = async (itemId: string, nuevaCantidad: number) => {
    if (nuevaCantidad < 0) return;

    const itemActual = items.find(i => i.id === itemId);
    const diferencia = nuevaCantidad - (itemActual?.cantidad || 0);

    setItems((prevItems) =>
      nuevaCantidad === 0
        ? prevItems.filter((item) => item.id !== itemId)
        : prevItems.map((item) =>
            item.id === itemId ? { ...item, cantidad: nuevaCantidad } : item,
          ),
    );

    if (auth?.setCantidadCesta) {
      auth.setCantidadCesta((prev: number) => Math.max(0, prev + diferencia));
    }

    try {
      const urlApi =
        Platform.OS === "web"
          ? `http://localhost:8000/carrito/items/${itemId}`
          : `http://192.168.1.43:8000/carrito/items/${itemId}`;

      const respuesta = await fetch(urlApi, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth?.usuario?.token}`,
        },
        body: JSON.stringify({ cantidad: nuevaCantidad }),
      });

      if (respuesta.ok && auth?.refrescarCarrito) {
        auth.refrescarCarrito();
      }

    } catch (error) {
      console.error("Error al actualizar cantidad:", error);
    }
  };

  const manejarInputTexto = (itemId: string, texto: string) => {
    const numero = parseInt(texto.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(numero)) {
      cambiarCantidad(itemId, numero);
    }
  };

  const confirmarPedido = async () => {
    if (items.length === 0) return;

    try {
      const urlApi = Platform.OS === "web"
        ? `http://localhost:8000/pedidos/confirmar`
        : `http://192.168.1.43:8000/pedidos/confirmar`;

      const respuesta = await fetch(urlApi, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${auth?.usuario?.token}`,
        },
      });

      if (respuesta.ok) {
        const datos = await respuesta.json();
        
        setItems([]);
        if (auth?.setCantidadCesta) {
          auth.setCantidadCesta(0);
        }
        
        if (Platform.OS === "web") {
          window.alert(`¡Pedido ${datos.referencia} confirmado con éxito!`);
        } else {
          alert(`¡Pedido ${datos.referencia} confirmado con éxito!`);
        }
        
        router.push("/historial-compra");
      } else {
        const error = await respuesta.json();
        alert(`Error: ${error.detail}`);
      }
    } catch (error) {
      console.error("Error al confirmar pedido:", error);
      alert("Hubo un problema al procesar el pedido.");
    }
  };

  const precioTotal = items.reduce((total, item) => {
    return total + item.cantidad * item.articulos_medidas.precio;
  }, 0);
  
  const subtotal = precioTotal / 1.21;
  const iva = precioTotal - subtotal;

  if (cargando) {
    return (
      <View style={styles.contenedorCentro}>
        <ActivityIndicator size="large" color="#29166F" />
      </View>
    );
  }

  return (
    <View style={styles.contenedorFondo}>
      <ScrollView contentContainerStyle={styles.scrollContenido}>
        <Text style={styles.tituloPagina}>Mi Cesta</Text>

        {items.length === 0 ? (
          <View style={styles.contenedorVacio}>
            <Text style={styles.textoVacio}>Tu cesta está vacía.</Text>
            <Pressable
              style={styles.botonVolver}
              onPress={() => router.push("/catalogo")}
            >
              <Text style={styles.textoBotonVolver}>Ir al catálogo</Text>
            </Pressable>
          </View>
        ) : (
          <View style={[styles.contenedorListaYResumen, esMovil && styles.contenedorListaYResumenMovil]}>
            
            <View style={[styles.listaProductos, !esMovil && { flex: 1, marginRight: 30 }]}>
              {items.map((item) => {
                const articulo = item.articulos_medidas.articulos;
                const precioUnidad = item.articulos_medidas.precio;

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.tarjetaProducto,
                      esMovil && styles.tarjetaProductoMovil,
                    ]}
                  >  
                    <Pressable style={styles.botonEliminarX} onPress={() => cambiarCantidad(item.id, 0)}>
                        <Text style={styles.textoX}>✕</Text>
                    </Pressable>
                    <Image
                      source={{ uri: articulo.imagen_url }}
                      style={[styles.imagenProducto, esMovil && styles.imagenProductoMovil]}
                      resizeMode="contain"
                    />
                    <View style={[styles.infoProducto, esMovil && styles.infoProductoMovil]}>
                      <Text style={[styles.nombreProducto, esMovil && styles.textoCentradoMovil]} numberOfLines={2}>
                        {articulo.nombre}
                      </Text>
                      <Text style={[styles.textoMedida, esMovil && styles.textoCentradoMovil]}>
                        Medida: {item.articulos_medidas.medida}
                      </Text>
                      <Text style={[styles.precioUnitario, esMovil && styles.textoCentradoMovil]}>
                        {precioUnidad.toFixed(2).replace(".", ",")} € / Ud
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.contenedorCantidadDerecha,
                        esMovil && styles.contenedorCantidadMovil,
                      ]}
                    >
                      <View style={styles.selectorCantidad}>
                        <Pressable
                          onPress={() =>
                            cambiarCantidad(item.id, item.cantidad - 1)
                          }
                        >
                          <Image
                            source={require("@/assets/images/iconoMenos.png")}
                            style={styles.iconoCantidad}
                          />
                        </Pressable>

                        <TextInput
                          style={styles.inputCantidad}
                          value={String(item.cantidad)}
                          onChangeText={(texto) =>
                            manejarInputTexto(item.id, texto)
                          }
                          keyboardType="numeric"
                        />

                        <Pressable
                          onPress={() =>
                            cambiarCantidad(item.id, item.cantidad + 1)
                          }
                        >
                          <Image
                            source={require("@/assets/images/iconoMas.png")}
                            style={styles.iconoCantidad}
                          />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={[
              styles.tarjetaResumen, 
              esMovil && styles.tarjetaResumenMovil,
              Platform.OS === 'web' && !esMovil && { position: 'sticky', top: 20 } as any
            ]}>
              <Text style={styles.tituloResumen}>Resumen de compra</Text>

              <View style={styles.filaResumen}>
                <Text style={styles.textoFilaResumen}>Subtotal</Text>
                <Text style={styles.valorFilaResumen}>{subtotal.toFixed(2).replace(".", ",")} €</Text>
              </View>

              <View style={styles.filaResumen}>
                <Text style={styles.textoFilaResumen}>IVA (21%)</Text>
                <Text style={styles.valorFilaResumen}>{iva.toFixed(2).replace(".", ",")} €</Text>
              </View>

              <View style={styles.lineaSeparadora} />

              <View style={styles.filaTotal}>
                <Text style={styles.textoTotalLabel}>Total</Text>
                <Text style={styles.textoTotalPrecio}>
                  {precioTotal.toFixed(2).replace(".", ",")} €
                </Text>
              </View>

              <Pressable
                style={styles.botonConfirmar}
                onPress={confirmarPedido}
              >
                <Text style={styles.textoBotonConfirmar}>Confirmar pedido</Text>
              </Pressable>
            </View>

          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
    contenedorCentro: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FAFAFA",
    },
    contenedorFondo: { 
        flex: 1, 
        backgroundColor: "#FAFAFA" 
    },
    scrollContenido: { 
        padding: 20, 
        alignItems: "center", 
        paddingBottom: 100 
    },
    tituloPagina: {
        fontFamily: "Montserrat_700Bold",
        fontSize: 32,
        color: "#000",
        marginBottom: 30,
        width: "100%",
        maxWidth: 1200, 
        textAlign: "left",
    },
    contenedorVacio: { 
        alignItems: "center", 
        marginTop: 50 
    },
    textoVacio: {
        fontFamily: "Inter_400Regular",
        fontSize: 18,
        color: "#666",
        marginBottom: 20,
    },
    botonVolver: {
        backgroundColor: "#29166F",
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
    },
    textoBotonVolver: {
        color: "#FFF",
        fontFamily: "Montserrat_700Bold",
        fontSize: 16,
    },
    contenedorListaYResumen: {
        flexDirection: "row",
        width: "100%",
        maxWidth: 1200,
        alignItems: "flex-start", 
    },
    contenedorListaYResumenMovil: {
        flexDirection: "column",
    },
    listaProductos: {
        width: "100%",
    },
    tarjetaProducto: {
        flexDirection: "row",
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        borderWidth: 1,
        borderColor: "#EAEAEA",
    },
    tarjetaProductoMovil: {
        flexDirection: "column",
        alignItems: "center",
    },
    imagenProducto: {
        width: 100,
        height: 100,
        marginRight: 20,
    },
    imagenProductoMovil: {
        marginRight: 0,
        marginBottom: 15,
    },
    infoProducto: {
        flex: 1,
        justifyContent: "center",
    },
    infoProductoMovil: {
        width: '100%',
        alignItems: 'center',
    },
    nombreProducto: {
        fontFamily: "Montserrat_700Bold",
        fontSize: 18,
        color: "#000",
        marginBottom: 5,
    },
    textoMedida: {
        fontFamily: "Inter_400Regular",
        fontSize: 14,
        color: "#666",
        marginBottom: 5,
    },
    precioUnitario: {
        fontFamily: "Inter_700Bold",
        fontSize: 20,
        color: "#DB3632",
    },
    textoCentradoMovil: {
        textAlign: 'center',
    },
    contenedorCantidadDerecha: {
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 20,
        paddingLeft: 20,
        borderLeftWidth: 1,
        borderLeftColor: "#EEEEEE",
    },
    contenedorCantidadMovil: {
        marginLeft: 0,
        paddingLeft: 0,
        borderLeftWidth: 0,
        borderTopWidth: 1,
        borderTopColor: "#EEEEEE",
        width: "100%",
        marginTop: 15,
        paddingTop: 15,
        flexDirection: "row",
        justifyContent: "center",
    },
    selectorCantidad: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    iconoCantidad: {
        width: 32,
        height: 32,
    },
    inputCantidad: {
        borderWidth: 1,
        borderColor: "#29166F",
        borderRadius: 6,
        width: 50,
        height: 35,
        textAlign: "center",
        fontFamily: "Montserrat_700Bold",
        fontSize: 16,
        color: "#DB3632",
    },
    botonEliminarX: {
        position: 'absolute',
        top: 10,
        right: 15,
        zIndex: 10,
        padding: 5, 
    },
    textoX: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 20,
        color: '#DB3632', 
    },
    tarjetaResumen: {
        backgroundColor: "#FFF",
        padding: 25,
        borderRadius: 12,
        width: 350,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 5,
        borderWidth: 1,
        borderColor: "#EAEAEA",
    },
    tarjetaResumenMovil: {
        width: "100%",
        marginTop: 10,
    },
    tituloResumen: {
        fontFamily: "Montserrat_700Bold",
        fontSize: 20,
        color: "#000",
        marginBottom: 20,
    },
    filaResumen: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    textoFilaResumen: {
        fontFamily: "Inter_400Regular",
        fontSize: 16,
        color: "#666",
    },
    valorFilaResumen: {
        fontFamily: "Inter_400Regular",
        fontSize: 16,
        color: "#000",
    },
    lineaSeparadora: {
        height: 1,
        backgroundColor: "#EAEAEA",
        marginVertical: 15,
    },
    filaTotal: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 25,
    },
    textoTotalLabel: {
        fontFamily: "Montserrat_700Bold",
        fontSize: 22,
        color: "#000",
    },
    textoTotalPrecio: {
        fontFamily: "Montserrat_700Bold",
        fontSize: 26,
        color: "#DB3632",
    },
    botonConfirmar: {
        backgroundColor: "#29166F",
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: "center",
        width: "100%",
    },
    textoBotonConfirmar: {
        color: "#FFFFFF",
        fontFamily: "Montserrat_700Bold",
        fontSize: 18,
    },
});