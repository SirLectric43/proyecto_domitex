import { useState, useEffect, useContext, useCallback } from "react";
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
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import Head from "expo-router/head";
import { AuthContext } from "../context/auth-context";
import { AlertaContext } from "../context/alerta-context";
import { traducirError } from "@/utils/errores";

export default function GestionPedidosPage() {
  const { width } = useWindowDimensions();
  const esMovil = width < 768;
  const router = useRouter();
  const auth = useContext(AuthContext);
  const alerta = useContext(AlertaContext);
  const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "";

  const [pedidos, setPedidos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [ordenFecha, setOrdenFecha] = useState<"desc" | "asc">("desc");
  const [pedidoAbierto, setPedidoAbierto] = useState<string | null>(null);

  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const [busquedaRef, setBusquedaRef] = useState("");
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [filtroRol, setFiltroRol] = useState("Todos");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const roles = ["Todos", "Admin", "Empleado", "Cliente"];
  const filtros = [
    "Todos",
    "Pendiente",
    "Validado",
    "En preparación",
    "Pausado",
    "Completado",
    "Entregado",
    "Cancelado",
  ];
  const estadosParaSelect = [
    "Validado",
    "En preparación",
    "Pausado",
    "Completado",
    "Entregado",
    "Cancelado",
  ];

  const formatForAPI = (dateStr: string) => {
    if (!dateStr) return "";
    if (dateStr.includes("/")) {
      const [dd, mm, yyyy] = dateStr.split("/");
      if (yyyy && yyyy.length === 4) {
        return `${yyyy}-${mm}-${dd}`;
      }
    }
    return dateStr;
  };

  const handleFechaChange = (text: string, setter: (val: string) => void) => {
    let cleaned = text.replace(/[^0-9]/g, "");
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = cleaned.slice(0, 2) + "/" + cleaned.slice(2);
    }
    if (cleaned.length > 4) {
      formatted = formatted.slice(0, 5) + "/" + cleaned.slice(4, 8);
    }
    setter(formatted);
  };

  const cargarPedidos = useCallback(async () => {
    setCargando(true);
    try {
      let urlApi = `${BASE_URL}/api/admin/pedidos?estado=${filtroEstado}&orden=${ordenFecha}&page=${paginaActual}&limit=20`;
      if (busquedaRef.trim())
        urlApi += `&referencia=${encodeURIComponent(busquedaRef)}`;
      if (busquedaCliente.trim())
        urlApi += `&cliente=${encodeURIComponent(busquedaCliente)}`;
      if (filtroRol !== "Todos")
        urlApi += `&rol=${encodeURIComponent(filtroRol)}`;
      if (fechaInicio.length === 10)
        urlApi += `&fecha_inicio=${formatForAPI(fechaInicio)}`;
      if (fechaFin.length === 10)
        urlApi += `&fecha_fin=${formatForAPI(fechaFin)}`;

      const res = await fetch(urlApi, {
        headers: { Authorization: `Bearer ${auth?.usuario?.token}` },
      });
      const datos = await res.json();
      if (res.ok) {
        setPedidos(datos.data ? datos.data : Array.isArray(datos) ? datos : []);
        setTotalPaginas(datos.total_pages || 1);
      }
    } catch (e: any) {
        const mensajeError = traducirError(e.message);
        alerta?.mostrarAlerta("Error", mensajeError);
    } finally {
      setCargando(false);
    }
  }, [BASE_URL, filtroEstado, ordenFecha, paginaActual, busquedaRef, busquedaCliente, filtroRol, fechaInicio, fechaFin, auth?.usuario?.token, alerta]);

  useEffect(() => {
    if (!auth?.usuario?.token) return;

    const refLen = busquedaRef.trim().length;
    const cliLen = busquedaCliente.trim().length;

    if ((refLen > 0 && refLen < 3) || (cliLen > 0 && cliLen < 3)) {
      return;
    }

    const timeoutId = setTimeout(() => {
      if (paginaActual === 1) {
        cargarPedidos();
      } else {
        setPaginaActual(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [cargarPedidos, auth?.usuario?.token, busquedaRef, busquedaCliente, paginaActual]);

  const limpiarFiltrosAvanzados = () => {
    setBusquedaRef("");
    setBusquedaCliente("");
    setFiltroRol("Todos");
    setFechaInicio("");
    setFechaFin("");
    setPaginaActual(1);
  };

  const actualizarEstado = async (id: string, nuevoEstado: string) => {
    setPedidoAbierto(null);
    setPedidos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, estado: nuevoEstado } : p)),
    );
    try {
      const res = await fetch(`${BASE_URL}/api/admin/pedidos/${id}/estado`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth?.usuario?.token}`,
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (!res.ok) cargarPedidos();
    } catch (e: any) {
      cargarPedidos();
      alerta?.mostrarAlerta("Error", traducirError(e.message));
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
        <Head>
          <title>Gestión de pedidos | Domitex</title>
        </Head>
        <View style={styles.tarjetaContenedora}>
          <Text style={styles.tituloPagina}>Gestión de pedidos</Text>

          <View style={styles.contenedorControles}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {filtros.map((f, index) => (
                <Pressable
                  key={f}
                  style={[
                    styles.botonFiltro,
                    filtroEstado === f && styles.botonFiltroActivo,
                    { marginRight: index === filtros.length - 1 ? 0 : 10 },
                  ]}
                  onPress={() => {
                    setFiltroEstado(f);
                    setPaginaActual(1);
                  }}
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
                              : f === "Cancelado"
                                ? "Cancelados"
                                : f}
                  </Text>
                </Pressable>
              ))}
              <Pressable
                style={styles.botonOrden}
                onPress={() => {
                  setOrdenFecha(ordenFecha === "desc" ? "asc" : "desc");
                  setPaginaActual(1);
                }}
              >
                <Text style={styles.textoOrden}>
                  {ordenFecha === "desc" ? "Más recientes ↓" : "Más antiguos ↑"}
                </Text>
              </Pressable>
            </ScrollView>
          </View>

          <View style={styles.cajaBusqueda}>
            <View
              style={[
                styles.filaBusqueda,
                esMovil && { flexDirection: "column" },
              ]}
            >
              <TextInput
                style={[
                  styles.inputFiltro,
                  !esMovil && { marginRight: 15 },
                  esMovil && { marginBottom: 15 },
                ]}
                placeholder="Nº Referencia..."
                placeholderTextColor="#999"
                value={busquedaRef}
                onChangeText={setBusquedaRef}
              />
              <TextInput
                style={styles.inputFiltro}
                placeholder="Nombre del cliente..."
                placeholderTextColor="#999"
                value={busquedaCliente}
                onChangeText={setBusquedaCliente}
              />
            </View>
            <View
              style={[
                styles.filaBusqueda,
                esMovil && { flexDirection: "column" },
                { marginTop: 15 },
              ]}
            >
              <View style={styles.grupoFiltro}>
                <Text style={styles.labelFiltro}>Desde:</Text>
                <TextInput
                  style={styles.inputFiltro}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#999"
                  value={fechaInicio}
                  onChangeText={(t) => handleFechaChange(t, setFechaInicio)}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
              <View
                style={[
                  styles.grupoFiltro,
                  !esMovil && { marginLeft: 15 },
                  esMovil && { marginTop: 15 },
                ]}
              >
                <Text style={styles.labelFiltro}>Hasta:</Text>
                <TextInput
                  style={styles.inputFiltro}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#999"
                  value={fechaFin}
                  onChangeText={(t) => handleFechaChange(t, setFechaFin)}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
            </View>
            <View style={[styles.grupoFiltroScroll, { marginTop: 15 }]}>
              <Text style={[styles.labelFiltro, { marginRight: 10 }]}>
                Rol:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {roles.map((r, index) => (
                  <Pressable
                    key={r}
                    style={[
                      styles.botonRol,
                      filtroRol === r && styles.botonRolActivo,
                      { marginRight: index === roles.length - 1 ? 0 : 8 },
                    ]}
                    onPress={() => setFiltroRol(r)}
                  >
                    <Text
                      style={[
                        styles.textoRolPill,
                        filtroRol === r && styles.textoRolActivo,
                      ]}
                    >
                      {r}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            <View style={[styles.filaBotonesAvanzados, { marginTop: 15 }]}>
              <Pressable
                style={[styles.botonLimpiarAvanzado, { marginRight: 10 }]}
                onPress={limpiarFiltrosAvanzados}
              >
                <Text style={styles.textoBotonLimpiar}>Limpiar</Text>
              </Pressable>
            </View>
          </View>

          {cargando ? (
            <ActivityIndicator
              size="large"
              color="#29166F"
              style={{ marginVertical: 80 }}
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
                  <View
                    style={[
                      styles.colIzquierda,
                      esMovil && styles.colIzquierdaMovil,
                    ]}
                  >
                    <Text style={styles.referencia}>
                      Pedido Nº{pedido.referencia}
                    </Text>
                    <Text style={styles.fecha}>
                      Fecha: {formatearFecha(pedido.fecha_pedido)}
                    </Text>
                    <Text style={styles.cliente}>
                      {pedido.usuarios?.nombre} {pedido.usuarios?.apellidos}{" "}
                      <Text style={{ color: "#999", fontSize: 12 }}>
                        ({pedido.usuarios?.rol})
                      </Text>
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.colDerecha,
                      esMovil && styles.colDerechaMovil,
                    ]}
                  >
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
                                  style={{ maxHeight: 200 }}
                                >
                                  {estadosParaSelect.map((est) => (
                                    <Pressable
                                      key={est}
                                      style={styles.opcionEstado}
                                      onPress={() =>
                                        actualizarEstado(pedido.id, est)
                                      }
                                    >
                                      <Text
                                        style={[
                                          styles.textoOpcion,
                                          {
                                            fontFamily: "Inter_600SemiBold",
                                          },
                                        ]}
                                      >
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
                  No se han encontrado pedidos con esos filtros.
                </Text>
              )}

              {totalPaginas > 1 && (
                <View style={styles.contenedorPaginacion}>
                  <Pressable
                    style={[
                      styles.botonPaginacion,
                      paginaActual === 1 && styles.botonPaginacionDeshabilitado,
                    ]}
                    onPress={() => setPaginaActual((p) => Math.max(1, p - 1))}
                    disabled={paginaActual === 1}
                  >
                    <Image
                      source={require("@/assets/images/iconoFlechaIzq.png")}
                      style={styles.iconoPaginacion}
                      resizeMode="contain"
                    />
                  </Pressable>
                  <Text style={styles.textoPaginacion}>
                    Página {paginaActual} de {totalPaginas}
                  </Text>
                  <Pressable
                    style={[
                      styles.botonPaginacion,
                      paginaActual === totalPaginas &&
                        styles.botonPaginacionDeshabilitado,
                    ]}
                    onPress={() =>
                      setPaginaActual((p) => Math.min(totalPaginas, p + 1))
                    }
                    disabled={paginaActual === totalPaginas}
                  >
                    <Image
                      source={require("@/assets/images/iconoFlechaDer.png")}
                      style={styles.iconoPaginacion}
                      resizeMode="contain"
                    />
                  </Pressable>
                </View>
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
  contenedorControles: { marginBottom: 30 },
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
  botonOrden: { alignSelf: "flex-end", marginLeft: 15, paddingVertical: 8 },
  textoOrden: {
    fontFamily: "Inter_600SemiBold",
    color: "#29166F",
    fontSize: 14,
  },

  cajaBusqueda: {
    backgroundColor: "#F9F9F9",
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    marginBottom: 30,
  },
  filaBusqueda: { flexDirection: "row" },
  inputFiltro: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 8,
    padding: 10,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    backgroundColor: "#FFF",
  },
  grupoFiltro: { flex: 1, flexDirection: "row", alignItems: "center" },
  grupoFiltroScroll: { flexDirection: "row", alignItems: "center" },
  labelFiltro: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#333",
    marginRight: 10,
  },
  botonRol: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#DDD",
  },
  botonRolActivo: { backgroundColor: "#29166F", borderColor: "#29166F" },
  textoRolPill: { fontFamily: "Inter_400Regular", color: "#666", fontSize: 12 },
  textoRolActivo: { color: "#FFF" },
  filaBotonesAvanzados: { flexDirection: "row", justifyContent: "flex-end" },
  botonLimpiarAvanzado: {
    backgroundColor: "#EEEEEE",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  textoBotonLimpiar: {
    color: "#333",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  botonBuscarAvanzado: {
    backgroundColor: "#29166F",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  textoBotonBuscar: {
    color: "#FFF",
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },

  listaPedidos: {},
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
    marginBottom: 20,
  },
  tarjetaPedidoMovil: { flexDirection: "column" },
  colIzquierda: { flex: 1, justifyContent: "center", marginBottom: 5 },
  colIzquierdaMovil: { width: "100%", marginBottom: 15 },
  referencia: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 20,
    color: "#000",
    marginBottom: 5,
  },
  fecha: { fontFamily: "Inter_400Regular", fontSize: 16, color: "#666" },
  cliente: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#29166F",
    marginTop: 5,
  },
  colDerecha: { width: 200, alignItems: "flex-end" },
  colDerechaMovil: { width: "100%", alignItems: "stretch" },
  botonValidar: {
    backgroundColor: "#29166F",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 15,
  },
  textoBotonValidar: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
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
    marginBottom: 15,
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
    backgroundColor: "#EEEEEE",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  textoBotonVer: {
    color: "#333333",
    fontFamily: "Inter_600SemiBold",
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
  contenedorPaginacion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    width: "100%",
  },
  botonPaginacion: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
  },
  botonPaginacionDeshabilitado: { opacity: 0.4 },
  iconoPaginacion: { width: 20, height: 20, tintColor: "#29166F" },
  textoPaginacion: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#29166F",
  },
});