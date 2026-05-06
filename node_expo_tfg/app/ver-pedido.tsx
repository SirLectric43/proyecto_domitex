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
  useWindowDimensions,
} from "react-native";
import { AuthContext } from "./auth-context";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function VerPedido() {
  const { pedidoId } = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const esMovil = width < 768;
  const auth = useContext(AuthContext);
  const router = useRouter();
  const BASE_URL = process.env.EXPO_PUBLIC_API_URL || '';
  
  const [pedido, setPedido] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerDetallePedido = async () => {
      if (!auth?.usuario?.token || !pedidoId) return;
      try {
        const urlApi = `${BASE_URL}/api/pedidos/${pedidoId}`;

        const respuesta = await fetch(urlApi, {
          headers: { Authorization: `Bearer ${auth.usuario.token}` },
        });

        if (respuesta.ok) {
          const datos = await respuesta.json();
          setPedido(datos);
        } else {
          router.replace("/historial-compra");
        }
      } catch (error) {
        console.error("Error al cargar detalle del pedido:", error);
      } finally {
        setCargando(false);
      }
    };
    obtenerDetallePedido();
  }, [auth?.usuario?.token, pedidoId]);

  const getColorEstado = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'completado':
      case 'entregado': return '#4CAF50';
      case 'en preparación':
      case 'preparando': return '#FF9800';
      case 'cancelado': return '#DB3632';
      default: return '#2196F3';
    }
  };

  if (cargando) {
    return (
      <View style={styles.contenedorCentro}>
        <ActivityIndicator size="large" color="#29166F" />
      </View>
    );
  }

  if (!pedido) return null;

  const subtotal = pedido.total / 1.21;
  const iva = pedido.total - subtotal;

  return (
    <View style={styles.contenedorFondo}>
      <ScrollView contentContainerStyle={styles.scrollContenido}>
        <Text style={styles.tituloPagina}>Pedido {pedido.referencia}</Text>

        <View style={[styles.contenedorListaYResumen, esMovil && styles.contenedorListaYResumenMovil]}>
          
          <View style={[styles.listaProductos, !esMovil && { flex: 1, marginRight: 30 }]}>
            {pedido.lineas_pedido?.map((linea: any, index: number) => {
              const articulo = linea.articulos_medidas.articulos;
              const medida = linea.articulos_medidas.medida;

              return (
                <View
                  key={index}
                  style={[styles.tarjetaProducto, esMovil && styles.tarjetaProductoMovil]}
                >  
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
                      Medida: {medida}
                    </Text>
                    <Text style={[styles.precioUnitario, esMovil && styles.textoCentradoMovil]}>
                      {linea.precio_unitario.toFixed(2).replace(".", ",")} € / Ud
                    </Text>
                  </View>

                  <View style={[styles.contenedorCantidadDerecha, esMovil && styles.contenedorCantidadMovil]}>
                    <Text style={styles.etiquetaCantidad}>Cantidad</Text>
                    <View style={styles.cajaCantidadEstatica}>
                      <Text style={styles.textoCantidadEstatica}>{linea.cantidad}</Text>
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
                {pedido.total.toFixed(2).replace(".", ",")} €
              </Text>
            </View>

            <View style={styles.contenedorEstado}>
              <Text style={styles.textoFilaResumen}>Estado del pedido:</Text>
              <Text style={[styles.textoEstadoValor, { color: getColorEstado(pedido.estado) }]}>
                {pedido.estado}
              </Text>
            </View>

            <Pressable
              style={styles.botonVolver}
              onPress={() => router.push("/historial-compra")}
            >
              <Text style={styles.textoBotonVolver}>Volver al historial</Text>
            </Pressable>
          </View>

        </View>
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
        flexDirection: "column",
        alignItems: "center",
    },
    etiquetaCantidad: {
        fontFamily: "Inter_400Regular",
        fontSize: 14,
        color: "#666",
        marginBottom: 8,
    },
    cajaCantidadEstatica: {
        backgroundColor: '#F5F5F5',
        borderWidth: 2,
        borderColor: '#29166F',
        borderRadius: 8,
        minWidth: 50,
        paddingVertical: 8,
        paddingHorizontal: 15,
        alignItems: 'center',
    },
    textoCantidadEstatica: {
        fontFamily: "Montserrat_700Bold",
        fontSize: 18,
        color: "#DB3632",
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
        marginBottom: 15,
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
    contenedorEstado: {
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "#F9F9F9",
        padding: 15,
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#EAEAEA",
    },
    textoEstadoValor: {
        fontFamily: "Montserrat_700Bold",
        fontSize: 20,
        marginTop: 5,
    },
    botonVolver: {
        backgroundColor: "#29166F",
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: "center",
        width: "100%",
    },
    textoBotonVolver: {
        color: "#FFFFFF",
        fontFamily: "Montserrat_700Bold",
        fontSize: 18,
    },
});