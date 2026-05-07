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
  Platform,
  TextInput,
} from "react-native";
import { AuthContext } from "./auth-context";
import { useRouter } from "expo-router";
import Head from "expo-router/head";

export default function HistorialCompra() {
  const { width } = useWindowDimensions();
  const esMovil = width < 768;
  const auth = useContext(AuthContext);
  const router = useRouter();
  const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "";

  const [pedidos, setPedidos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [dropdownAbierto, setDropdownAbierto] = useState(false);

  const estadosFiltro = [
    "Todos",
    "Pendiente",
    "Validado",
    "En preparación",
    "Pausado",
    "Completado",
    "Entregado",
    "Cancelado",
  ];

  // Conversor: De DD/MM/YYYY (Usuario) a YYYY-MM-DD (API)
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

  // Máscara: Añade las barras / automáticamente mientras escribes
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

  const cargarPedidos = async () => {
    setCargando(true);
    if (!auth?.usuario?.token) return;
    try {
      let urlApi = `${BASE_URL}/api/pedidos/historial?page=${paginaActual}&limit=15`;
      if (fechaInicio.length === 10)
        urlApi += `&fecha_inicio=${formatForAPI(fechaInicio)}`;
      if (fechaFin.length === 10)
        urlApi += `&fecha_fin=${formatForAPI(fechaFin)}`;
      if (filtroEstado !== "Todos")
        urlApi += `&estado=${encodeURIComponent(filtroEstado)}`;

      const respuesta = await fetch(urlApi, {
        headers: { Authorization: `Bearer ${auth.usuario.token}` },
      });

      if (respuesta.ok) {
        const datos = await respuesta.json();
        setPedidos(datos.data || []);
        setTotalPaginas(datos.total_pages || 1);
      }
    } catch (error) {
      console.error("Error al cargar historial:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPedidos();
  }, [auth?.usuario?.token, paginaActual]);

  const aplicarFiltros = () => {
    if (paginaActual === 1) {
      cargarPedidos();
    } else {
      setPaginaActual(1);
    }
  };

  const limpiarFiltros = () => {
    setFechaInicio("");
    setFechaFin("");
    setFiltroEstado("Todos");
    setPaginaActual(1);
  };

  const renderSelectEstado = () => (
    <View style={{ flex: 1, zIndex: dropdownAbierto ? 2000 : 1 }}>
      <Pressable
        style={styles.selectEstado}
        onPress={() => setDropdownAbierto(!dropdownAbierto)}
      >
        <Text style={styles.textoSelect}>{filtroEstado}</Text>
        <Image
          source={require("@/assets/images/iconoFlechaDer.png")}
          style={styles.iconoFlecha}
        />
      </Pressable>
      {dropdownAbierto && (
        <>
          <Pressable
            style={styles.overlayCerrar}
            onPress={() => setDropdownAbierto(false)}
          />
          <View style={styles.dropdownEstado}>
            <ScrollView
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 200 }}
            >
              {estadosFiltro.map((est) => (
                <Pressable
                  key={est}
                  style={styles.opcionEstado}
                  onPress={() => {
                    setFiltroEstado(est);
                    setDropdownAbierto(false);
                  }}
                >
                  <Text style={styles.textoOpcion}>{est}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </>
      )}
    </View>
  );

  const formatearFecha = (fechaISO: string) => {
    const fecha = new Date(fechaISO);
    return `${fecha.getDate().toString().padStart(2, "0")}/${(fecha.getMonth() + 1).toString().padStart(2, "0")}/${fecha.getFullYear()}`;
  };

  const getColorEstado = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case "completado":
      case "entregado":
        return "#4CAF50";
      case "validado":
        return "#009688";
      case "en preparación":
      case "preparando":
        return "#FF9800";
      case "pendiente":
        return "#2196F3";
      case "pausado":
        return "#607D8B";
      case "cancelado":
        return "#DB3632";
      default:
        return "#666666";
    }
  };

  return (
    <View style={styles.contenedorFondo}>
      <ScrollView
        contentContainerStyle={styles.scrollContenido}
        keyboardShouldPersistTaps="handled"
      >
        <Head>
          <title>Historial de compra | Domitex</title>
        </Head>
        <Text style={styles.tituloPagina}>Historial de Compras</Text>

        <View style={styles.cajaFiltros}>
          <View
            style={[
              styles.filaFiltrosConfig,
              esMovil && { flexDirection: "column" },
              { zIndex: 1000 },
            ]}
          >
            <View style={[styles.grupoFiltro, { zIndex: 1000 }]}>
              <Text style={styles.labelFiltro}>Estado:</Text>
              {renderSelectEstado()}
            </View>
          </View>
          <View
            style={[
              styles.filaFiltrosConfig,
              esMovil && { flexDirection: "column" },
              { zIndex: 1, marginTop: 15 },
            ]}
          >
            <View style={styles.grupoFiltro}>
              <Text style={styles.labelFiltro}>Desde:</Text>
              <TextInput
                style={styles.inputFiltro}
                placeholder="DD/MM/YYYY"
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
                value={fechaFin}
                onChangeText={(t) => handleFechaChange(t, setFechaFin)}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
          </View>
          <View
            style={[styles.filaBotonesFiltro, { zIndex: 1, marginTop: 15 }]}
          >
            <Pressable
              style={[styles.botonLimpiar, { marginRight: 10 }]}
              onPress={limpiarFiltros}
            >
              <Text style={styles.textoBotonLimpiar}>Limpiar</Text>
            </Pressable>
            <Pressable style={styles.botonBuscar} onPress={aplicarFiltros}>
              <Text style={styles.textoBotonBuscar}>Buscar</Text>
            </Pressable>
          </View>
        </View>

        {cargando ? (
          <ActivityIndicator
            size="large"
            color="#29166F"
            style={{ marginVertical: 80 }}
          />
        ) : pedidos.length === 0 ? (
          <View style={styles.contenedorVacio}>
            <Text style={styles.textoVacio}>
              No se encontraron pedidos con esos filtros.
            </Text>
            <Pressable
              style={styles.botonVolver}
              onPress={() => router.push("/catalogo")}
            >
              <Text style={styles.textoBotonVolver}>Ir al catálogo</Text>
            </Pressable>
          </View>
        ) : (
          <View style={[styles.listaPedidos, { zIndex: 1 }]}>
            {pedidos.map((pedido) => {
              const totalSeguro = pedido.total ? pedido.total : 0;
              return (
                <View
                  key={pedido.id}
                  style={[
                    styles.tarjetaPedido,
                    esMovil && styles.tarjetaPedidoMovil,
                  ]}
                >
                  <View
                    style={[
                      styles.infoPedido,
                      esMovil && styles.infoPedidoMovil,
                    ]}
                  >
                    <Text style={styles.tituloPedido}>
                      Pedido {pedido.referencia}
                    </Text>
                    <View style={styles.contenedorEstado}>
                      <Text style={styles.etiquetaEstado}>Estado: </Text>
                      <Text
                        style={[
                          styles.valorEstado,
                          { color: getColorEstado(pedido.estado) },
                        ]}
                      >
                        {pedido.estado}
                      </Text>
                    </View>
                    <Text style={styles.totalPedido}>
                      Total: {totalSeguro.toFixed(2).replace(".", ",")} €
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.accionesPedido,
                      esMovil && styles.accionesPedidoMovil,
                    ]}
                  >
                    <Text style={styles.fechaPedido}>
                      {formatearFecha(pedido.fecha_pedido)}
                    </Text>
                    <Pressable
                      style={styles.botonDetalles}
                      onPress={() =>
                        router.push({
                          pathname: "/ver-pedido",
                          params: { pedidoId: pedido.id },
                        })
                      }
                    >
                      <Text style={styles.textoBotonDetalles}>
                        Detalles de pedido
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}

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
  contenedorFondo: { flex: 1, backgroundColor: "#FAFAFA" },
  scrollContenido: { padding: 20, alignItems: "center", paddingBottom: 100 },
  tituloPagina: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 32,
    color: "#000",
    marginBottom: 20,
    width: "100%",
    maxWidth: 900,
    textAlign: "left",
  },
  cajaFiltros: {
    width: "100%",
    maxWidth: 900,
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    marginBottom: 30,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    zIndex: 10,
  },
  filaFiltrosConfig: { flexDirection: "row" },
  grupoFiltro: { flex: 1, flexDirection: "row", alignItems: "center" },
  labelFiltro: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#333",
    width: 55,
    marginRight: 10,
  },
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
    maxHeight: 200,
  },
  opcionEstado: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  textoOpcion: { fontFamily: "Inter_400Regular", fontSize: 14, color: "#333" },
  overlayCerrar: {
    position: Platform.OS === "web" ? "fixed" : "absolute",
    top: -2000,
    bottom: -2000,
    left: -2000,
    right: -2000,
    zIndex: 1000,
  } as any,
  filaBotonesFiltro: { flexDirection: "row", justifyContent: "flex-end" },
  botonLimpiar: {
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
  botonBuscar: {
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
  contenedorVacio: { alignItems: "center", marginTop: 50 },
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
  listaPedidos: { width: "100%", maxWidth: 900, zIndex: 1 },
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
  infoPedido: { flex: 1 },
  infoPedidoMovil: { width: "100%", marginBottom: 20 },
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
  valorEstado: { fontFamily: "Montserrat_700Bold", fontSize: 16 },
  totalPedido: { fontFamily: "Inter_400Regular", fontSize: 16, color: "#333" },
  accionesPedido: { alignItems: "flex-end" },
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
