import { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { AuthContext } from "./auth-context";
import { useRouter } from "expo-router";

export default function HistorialCompra() {
  const { width } = useWindowDimensions();
  const esMovil = width < 768;
  const auth = useContext(AuthContext);
  const router = useRouter();
  const BASE_URL = process.env.EXPO_PUBLIC_API_URL || '';
  
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerPedidos = async () => {
      if (!auth?.usuario?.token) return;
      try {
        const urlApi = `${BASE_URL}/api/pedidos/historial`;

        const respuesta = await fetch(urlApi, {
          headers: { Authorization: `Bearer ${auth.usuario.token}` },
        });

        if (respuesta.ok) {
          const datos = await respuesta.json();
          setPedidos(datos);
        }
      } catch (error) {
        console.error("Error al cargar historial:", error);
      } finally {
        setCargando(false);
      }
    };
    obtenerPedidos();
  }, [auth?.usuario?.token]);

  const formatearFecha = (fechaISO: string) => {
    const fecha = new Date(fechaISO);
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
  };

  const getColorEstado = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'completado':
      case 'entregado':
        return '#4CAF50';
      case 'en preparación':
      case 'preparando':
        return '#FF9800'; 
      case 'pendiente':
        return '#2196F3'; 
      case 'cancelado':
        return '#DB3632'; 
      default:
        return '#666666'; 
    }
  };

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
        <Text style={styles.tituloPagina}>Historial de Compras</Text>

        {pedidos.length === 0 ? (
          <View style={styles.contenedorVacio}>
            <Text style={styles.textoVacio}>Aún no has realizado ninguna compra.</Text>
            <Pressable
              style={styles.botonVolver}
              onPress={() => router.push("/catalogo")}
            >
              <Text style={styles.textoBotonVolver}>Ir al catálogo</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.listaPedidos}>
            {pedidos.map((pedido) => (
              <View 
                key={pedido.id} 
                style={[
                  styles.tarjetaPedido, 
                  esMovil && styles.tarjetaPedidoMovil
                ]}
              >
                <View style={[styles.infoPedido, esMovil && styles.infoPedidoMovil]}>
                  <Text style={styles.tituloPedido}>Pedido {pedido.referencia}</Text>
                  <View style={styles.contenedorEstado}>
                    <Text style={styles.etiquetaEstado}>Estado: </Text>
                    <Text style={[styles.valorEstado, { color: getColorEstado(pedido.estado) }]}>
                      {pedido.estado}
                    </Text>
                  </View>
                  <Text style={styles.totalPedido}>Total: {pedido.total?.toFixed(2).replace('.', ',')} €</Text>
                </View>

                <View style={[styles.accionesPedido, esMovil && styles.accionesPedidoMovil]}>
                  <Text style={styles.fechaPedido}>{formatearFecha(pedido.fecha_pedido)}</Text>
                  <Pressable 
                    style={styles.botonDetalles}
                    onPress={() => router.push({ pathname: "/ver-pedido", params: { pedidoId: pedido.id } })}
                  >
                    <Text style={styles.textoBotonDetalles}>Detalles de pedido</Text>
                  </Pressable>
                </View>
              </View>
            ))}
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
    backgroundColor: "#FAFAFA",
  },
  scrollContenido: {
    padding: 20,
    alignItems: "center",
    paddingBottom: 100,
  },
  tituloPagina: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 32,
    color: "#000",
    marginBottom: 30,
    width: "100%",
    maxWidth: 900,
    textAlign: "left",
  },
  contenedorVacio: {
    alignItems: "center",
    marginTop: 50,
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
  listaPedidos: {
    width: "100%",
    maxWidth: 900,
  },
  tarjetaPedido: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 25,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  tarjetaPedidoMovil: {
    flexDirection: "column",
    alignItems: "flex-start",
    padding: 20,
  },
  infoPedido: {
    flex: 1,
  },
  infoPedidoMovil: {
    width: "100%",
    marginBottom: 20,
  },
  tituloPedido: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 22,
    color: "#000",
    marginBottom: 8,
  },
  contenedorEstado: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  etiquetaEstado: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#666",
  },
  valorEstado: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 16,
  },
  totalPedido: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#333",
  },
  accionesPedido: {
    alignItems: "flex-end",
  },
  accionesPedidoMovil: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fechaPedido: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#999",
    marginBottom: 15,
  },
  botonDetalles: {
    backgroundColor: "#29166F",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  textoBotonDetalles: {
    color: "#FFFFFF",
    fontFamily: "Montserrat_700Bold",
    fontSize: 14,
  },
});