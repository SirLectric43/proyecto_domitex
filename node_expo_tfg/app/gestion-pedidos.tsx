import { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  ActivityIndicator,
  Image,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "./auth-context";
import { AlertaContext } from "./alerta-context";
import { traducirError } from "@/utils/errores";

export default function GestionPedidosPage() {
  const { width } = useWindowDimensions();
  const esMovil = width < 768;
  const router = useRouter();
  const auth = useContext(AuthContext);
  const alerta = useContext(AlertaContext);
  const BASE_URL = process.env.EXPO_PUBLIC_API_URL || '';

  const [pedidos, setPedidos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [ordenFecha, setOrdenFecha] = useState<"desc" | "asc">("desc");
  const [pedidoAbierto, setPedidoAbierto] = useState<string | null>(null);

  const filtros = [
    "Todos",
    "Pendiente",
    "Validado",
    "En preparación",
    "Pausado",
    "Completado",
    "Entregado",
  ];
  const estadosParaSelect = [
    "Validado",
    "En preparación",
    "Pausado",
    "Completado",
    "Entregado",
  ];

  const cargarPedidos = async () => {
    setCargando(true);
    try {
      const urlApi = `${BASE_URL}/api/admin/pedidos?estado=${filtroEstado}&orden=${ordenFecha}`;

      const res = await fetch(urlApi, {
        headers: { Authorization: `Bearer ${auth?.usuario?.token}` },
      });
      const datos = await res.json();
      if (res.ok) setPedidos(datos);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (auth?.usuario?.token) cargarPedidos();
  }, [filtroEstado, ordenFecha]);

  const actualizarEstado = async (id: string, nuevoEstado: string) => {
    setPedidoAbierto(null);
    setPedidos((pedidosPrevios) =>
      pedidosPrevios.map((pedido) =>
        pedido.id === id ? { ...pedido, estado: nuevoEstado } : pedido
      )
    );

    try {
      const urlApi = `${BASE_URL}/api/admin/pedidos/${id}/estado`;

      const res = await fetch(urlApi, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth?.usuario?.token}`,
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (!res.ok) {
        cargarPedidos();
      }
    } catch (e: any) {
      cargarPedidos();
      const mensajeError = traducirError(e.message);
      alerta?.mostrarAlerta("Error", mensajeError);
    }
  };

  const formatearFecha = (fechaStr: string) => {
    const d = new Date(fechaStr);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
  };

  return (
    <View style={styles.contenedorFondo}>
      <ScrollView
        contentContainerStyle={styles.scrollContenido}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.tarjetaContenedora}>
          <Text style={styles.tituloPagina}>Gestión de pedidos</Text>

          <View style={styles.contenedorControles}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filaFiltros}
            >
              {filtros.map((f) => (
                <Pressable
                  key={f}
                  style={[
                    styles.botonFiltro,
                    filtroEstado === f && styles.botonFiltroActivo,
                  ]}
                  onPress={() => setFiltroEstado(f)}
                >
                  <Text
                    style={[
                      styles.textoFiltro,
                      filtroEstado === f && styles.textoFiltroActivo,
                    ]}
                  >
                    {f === "En preparación"
                      ? "Preparación"
                      : f === "Pendiente"
                        ? "Pendientes"
                        : f === "Validado"
                          ? "Validados"
                          : f === "Completado"
                            ? "Completados"
                            : f === "Entregado"
                              ? "Entregados"
                              : f}
                  </Text>
                </Pressable>
              ))}
              <Pressable
                style={styles.botonOrden}
                onPress={() =>
                  setOrdenFecha(ordenFecha === "desc" ? "asc" : "desc")
                }
              >
                <Text style={styles.textoOrden}>
                  {ordenFecha === "desc"
                    ? "Más recientes primero ↓"
                    : "Más antiguos primero ↑"}
                </Text>
              </Pressable>
            </ScrollView>
          </View>

          {cargando ? (
            <ActivityIndicator
              size="large"
              color="#29166F"
              style={{ marginTop: 50 }}
            />
          ) : (
            <View style={styles.listaPedidos}>
              {pedidos.map((pedido) => (
                <View
                  key={pedido.id}
                  style={[
                    styles.tarjetaPedido,
                    esMovil && styles.tarjetaPedidoMovil,
                    { zIndex: pedidoAbierto === pedido.id ? 100 : 1 },
                  ]}
                >
                  <View style={[styles.colIzquierda, esMovil && styles.colIzquierdaMovil]}>
                    <Text style={styles.referencia}>
                      Pedido Nº{pedido.referencia}
                    </Text>
                    <Text style={styles.fecha}>
                      Fecha: {formatearFecha(pedido.fecha_pedido)}
                    </Text>
                    <Text style={styles.cliente}>
                      {pedido.usuarios?.nombre} {pedido.usuarios?.apellidos}
                    </Text>
                  </View>

                  <View style={[styles.colDerecha, esMovil && styles.colDerechaMovil]}>
                    <View
                      style={{
                        zIndex: pedidoAbierto === pedido.id ? 1001 : 1,
                        width: "100%",
                      }}
                    >
                      {pedido.estado === "Pendiente" ? (
                        <Pressable
                          style={styles.botonValidar}
                          onPress={() =>
                            actualizarEstado(pedido.id, "Validado")
                          }
                        >
                          <Text style={styles.textoBotonValidar}>
                            Validar pedido
                          </Text>
                        </Pressable>
                      ) : (
                        <View>
                          <Pressable
                            style={styles.selectEstado}
                            onPress={() =>
                              setPedidoAbierto(
                                pedidoAbierto === pedido.id ? null : pedido.id,
                              )
                            }
                          >
                            <Text style={styles.textoSelect}>
                              {pedido.estado}
                            </Text>
                            <Image
                              source={require("@/assets/images/iconoFlechaDer.png")}
                              style={styles.iconoFlecha}
                            />
                          </Pressable>

                          {pedidoAbierto === pedido.id && (
                            <>
                              <Pressable
                                style={styles.overlayCerrar}
                                onPress={() => setPedidoAbierto(null)}
                              />
                              <View style={styles.dropdownEstado}>
                                <ScrollView 
                                  nestedScrollEnabled={true} 
                                  keyboardShouldPersistTaps="handled"
                                >
                                  {estadosParaSelect.map((est) => (
                                    <Pressable
                                      key={est}
                                      style={styles.opcionEstado}
                                      onPress={() =>
                                        actualizarEstado(pedido.id, est)
                                      }
                                    >
                                      <Text style={styles.textoOpcion}>
                                        {est}
                                      </Text>
                                    </Pressable>
                                  ))}
                                </ScrollView>
                              </View>
                            </>
                          )}
                        </View>
                      )}
                    </View>

                    <Pressable
                      style={styles.botonVer}
                      onPress={() =>
                        router.push({
                          pathname: "/ver-pedido-admin",
                          params: { id: pedido.id },
                        })
                      }
                    >
                      <Text style={styles.textoBotonVer}>Ver pedido</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
              {pedidos.length === 0 && (
                <Text style={styles.textoVacio}>
                  No se han encontrado pedidos.
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedorFondo: { flex: 1, backgroundColor: "#FAFAFA" },
  scrollContenido: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  tarjetaContenedora: {
    width: "100%",
    maxWidth: 1100,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 30,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  tituloPagina: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 32,
    color: "#29166F",
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    paddingBottom: 15,
  },
  contenedorControles: { marginBottom: 30, gap: 20 },
  filaFiltros: { gap: 10, paddingBottom: 5 },
  botonFiltro: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    borderWidth: 1,
    borderColor: "#DDD",
  },
  botonFiltroActivo: { backgroundColor: "#29166F", borderColor: "#29166F" },
  textoFiltro: { fontFamily: "Inter_600SemiBold", color: "#666", fontSize: 14 },
  textoFiltroActivo: { color: "#FFF" },
  botonOrden: { alignSelf: "flex-end" },
  textoOrden: {
    fontFamily: "Inter_600SemiBold",
    color: "#29166F",
    fontSize: 15,
    marginBottom: 9,
    marginLeft: 10,
  },
  listaPedidos: { gap: 20 },
  tarjetaPedido: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  tarjetaPedidoMovil: {
    flexDirection: "column",
  },
  colIzquierda: { flex: 1, justifyContent: "center", gap: 5 },
  colIzquierdaMovil: { width: "100%", marginBottom: 15 },
  referencia: { fontFamily: "Montserrat_700Bold", fontSize: 20, color: "#000" },
  fecha: { fontFamily: "Inter_400Regular", fontSize: 16, color: "#666" },
  cliente: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#29166F",
    marginTop: 5,
  },
  colDerecha: { width: 200, gap: 15, alignItems: "flex-end" },
  colDerechaMovil: { width: "100%", alignItems: "stretch" },
  botonValidar: {
    backgroundColor: '#29166F',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  textoBotonValidar: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  selectEstado: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9F9F9",
    borderWidth: 1,
    borderColor: "#29166F",
    width: "100%",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
  },
  textoSelect: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#29166F",
  },
  iconoFlecha: {
    width: 12,
    height: 12,
    transform: [{ rotate: "90deg" }],
    tintColor: "#29166F",
  },
  dropdownEstado: {
    position: "absolute",
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#29166F",
    borderRadius: 6,
    elevation: 5,
    zIndex: 2000,
    maxHeight: 300,
  },
  opcionEstado: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  textoOpcion: { fontFamily: "Inter_400Regular", fontSize: 14, color: "#333" },
  botonVer: {
    backgroundColor: '#EEEEEE',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  textoBotonVer: {
    color: '#333333',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  overlayCerrar: {
    position: Platform.OS === "web" ? "fixed" : "absolute",
    top: -2000,
    bottom: -2000,
    left: -2000,
    right: -2000,
    zIndex: 1000,
  },
  textoVacio: {
    textAlign: "center",
    marginTop: 40,
    fontFamily: "Inter_400Regular",
    color: "#999",
    fontSize: 18,
  },
});