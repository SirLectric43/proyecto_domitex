import { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  Image,
} from "react-native";
import { AuthContext } from "./auth-context";
import { useRouter } from "expo-router";
import Head from "expo-router/head";

export default function HistorialCompra() {
  const { width } = useWindowDimensions();
  const esMovil = width < 768;
  const auth = useContext(AuthContext);
  const router = useRouter();
  const BASE_URL = process.env.EXPO_PUBLIC_API_URL || '';
  
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  useEffect(() => {
    const obtenerPedidos = async () => {
      setCargando(true);
      if (!auth?.usuario?.token) return;
      try {
        const urlApi = `${BASE_URL}/api/pedidos/historial?page=${paginaActual}&limit=15`;

        const respuesta = await fetch(urlApi, {
          headers: { Authorization: `Bearer ${auth.usuario.token}` },
        });

        if (respuesta.ok) {
          const datos = await respuesta.json();
          setPedidos(datos.data);
          setTotalPaginas(datos.total_pages);
        }
      } catch (error) {
        console.error("Error al cargar historial:", error);
      } finally {
        setCargando(false);
      }
    };
    obtenerPedidos();
  }, [auth?.usuario?.token, paginaActual]);

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

  if (cargando && pedidos.length === 0) {
    return (
      <View style={styles.contenedorCentro}>
        <Head>
            <title>Historial de compra | Domitex</title>
        </Head>
        <ActivityIndicator size="large" color="#29166F" />
      </View>
    );
  }

  return (
    <View style={styles.contenedorFondo}>
      <ScrollView contentContainerStyle={styles.scrollContenido}>
        <Head>
            <title>Historial de compra | Domitex</title>
        </Head>
        <Text style={styles.tituloPagina}>Historial de Compras</Text>

        {pedidos.length === 0 && !cargando ? (
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
            {cargando && <ActivityIndicator size="large" color="#29166F" style={{marginBottom: 20}} />}
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

            {totalPaginas > 1 && (
              <View style={styles.contenedorPaginacion}>
                <Pressable 
                  style={[styles.botonPaginacion, paginaActual === 1 && styles.botonPaginacionDeshabilitado]}
                  onPress={() => setPaginaActual(p => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                >
                  <Image source={require('@/assets/images/iconoFlechaIzq.png')} style={styles.iconoPaginacion} resizeMode="contain" />
                </Pressable>
                <Text style={styles.textoPaginacion}>Página {paginaActual} de {totalPaginas}</Text>
                <Pressable 
                  style={[styles.botonPaginacion, paginaActual === totalPaginas && styles.botonPaginacionDeshabilitado]}
                  onPress={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual === totalPaginas}
                >
                  <Image source={require('@/assets/images/iconoFlechaDer.png')} style={styles.iconoPaginacion} resizeMode="contain" />
                </Pressable>
              </View>
            )}
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
  contenedorPaginacion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 20,
    width: '100%'
  },
  botonPaginacion: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonPaginacionDeshabilitado: {
    opacity: 0.4,
  },
  iconoPaginacion: {
    width: 20,
    height: 20,
    tintColor: '#29166F',
  },
  textoPaginacion: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#29166F',
  }
});