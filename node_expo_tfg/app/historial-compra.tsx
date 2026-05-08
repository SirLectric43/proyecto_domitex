import { useState, useContext, useCallback, useEffect } from "react";
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
import { useRouter, useLocalSearchParams } from "expo-router";
import Head from "expo-router/head";
import { traducirError } from "@/utils/errores";
import { AlertaContext } from "./alerta-context";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export default function HistorialCompra() {
  const { width } = useWindowDimensions();
  const esMovil = width < 768;
  const auth = useContext(AuthContext);
  const router = useRouter();
  const { usuarioId } = useLocalSearchParams();
  const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "";
  const alerta = useContext(AlertaContext);

  const [pedidos, setPedidos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [descargandoId, setDescargandoId] = useState<string | null>(null);

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

  const formatForAPI = (dateStr: string) => {
    if (!dateStr) return "";
    if (dateStr.includes("/")) {
      const [dd, mm, yyyy] = dateStr.split("/");
      if (yyyy && yyyy.length === 4) return `${yyyy}-${mm}-${dd}`;
    }
    return dateStr;
  };

  const handleFechaChange = (text: string, setter: (val: string) => void) => {
    let cleaned = text.replace(/[^0-9]/g, "");
    let formatted = cleaned;
    if (cleaned.length > 2)
      formatted = cleaned.slice(0, 2) + "/" + cleaned.slice(2);
    if (cleaned.length > 4)
      formatted = formatted.slice(0, 5) + "/" + cleaned.slice(4, 8);
    setter(formatted);
  };

  const cargarPedidos = useCallback(async () => {
    setCargando(true);
    if (!auth?.usuario?.token) return;
    try {
      let urlApi = `${BASE_URL}/api/pedidos/historial?page=${paginaActual}&limit=15`;
      if (usuarioId) urlApi += `&usuario_id=${usuarioId}`;
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
        setPedidos(datos.data ? datos.data : Array.isArray(datos) ? datos : []);
        setTotalPaginas(datos.total_pages || 1);
      }
    } catch (e: any) {
      alerta?.mostrarAlerta("Error", traducirError(e.message));
    } finally {
      setCargando(false);
    }
  }, [
    BASE_URL,
    paginaActual,
    fechaInicio,
    fechaFin,
    filtroEstado,
    auth?.usuario?.token,
    usuarioId,
    alerta
  ]);

  useEffect(() => {
    cargarPedidos();
  }, [cargarPedidos]);

  const limpiarFiltros = () => {
    setFechaInicio("");
    setFechaFin("");
    setFiltroEstado("Todos");
    setPaginaActual(1);
  };

  const formatearFecha = (fechaISO: string) => {
    const d = new Date(fechaISO);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  };

  const generarAlbaranPDF = async (pedidoId: string, referencia: string, fechaIso: string, total: number) => {
    setDescargandoId(pedidoId);
    try {
      const respuesta = await fetch(`${BASE_URL}/api/pedidos/${pedidoId}`, {
        headers: { Authorization: `Bearer ${auth?.usuario?.token}` },
      });

      if (!respuesta.ok) throw new Error("Error al obtener datos");

      const detallePedido = await respuesta.json();
      const lineas = detallePedido.lineas_pedido || [];
      const subtotal = total / 1.21;
      const iva = total - subtotal;
      
      const nombreCliente = detallePedido.usuarios?.nombre 
        ? `${detallePedido.usuarios.nombre} ${detallePedido.usuarios.apellidos || ''}`.trim()
        : "Cliente";

      const filasHTML = lineas.map((linea: any) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #EEE;">${linea.cantidad}</td>
          <td style="padding: 12px; border-bottom: 1px solid #EEE;">${linea.articulos_medidas?.articulos?.nombre || "Articulo"} (${linea.articulos_medidas?.medida || ""})</td>
          <td style="padding: 12px; border-bottom: 1px solid #EEE; text-align: right;">${linea.precio_unitario.toFixed(2).replace('.', ',')} €</td>
          <td style="padding: 12px; border-bottom: 1px solid #EEE; text-align: right;">${(linea.cantidad * linea.precio_unitario).toFixed(2).replace('.', ',')} €</td>
        </tr>
      `).join("");

      const URL_LOGO = "https://xebkeeoavmhaxwftzlvm.supabase.co/storage/v1/object/public/articulos/logo_domitex.jpg";
      const logoHTML = URL_LOGO !== "https://xebkeeoavmhaxwftzlvm.supabase.co/storage/v1/object/public/articulos/logo_domitex.jpg" 
        ? `<img src="${URL_LOGO}" style="max-width: 250px; max-height: 80px;" />`
        : `<h1 style="color: #29166F; margin: 0; font-size: 40px;">DOMITEX</h1>`;

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="utf-8">
          <title>Albaran_${referencia}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; padding: 40px; margin: 0; }
            .cabecera { display: flex; justify-content: space-between; margin-bottom: 50px; }
            .datos-empresa { font-size: 14px; line-height: 1.6; color: #555; }
            .datos-cliente { font-size: 14px; text-align: right; line-height: 1.6; }
            .titulo { font-size: 24px; font-weight: bold; color: #29166F; border-bottom: 2px solid #29166F; padding-bottom: 10px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background-color: #29166F; color: white; padding: 12px; text-align: left; }
            .totales-caja { display: flex; justify-content: flex-end; }
            .totales-tabla { width: 300px; border-collapse: collapse; }
            .totales-tabla td { padding: 10px; border-bottom: 1px solid #EEE; }
            .total-final { font-weight: bold; color: #29166F; font-size: 18px; }
            .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #EEE; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="cabecera">
            <div>
              ${logoHTML}
              <div class="datos-empresa" style="margin-top: 20px;">
                <strong>Domitex Hogar S.L.</strong><br>
                Calle Emprendedores Nº20, 24, 17<br>
                41749 El Cuervo de Sevilla (Sevilla)<br>
                domitex@hotmail.es | 955 97 97 99
              </div>
            </div>
            <div class="datos-cliente">
              <h3 style="margin: 0 0 10px 0; color: #666; font-size: 16px;">DATOS DEL CLIENTE</h3>
              <strong>${nombreCliente}</strong>
            </div>
          </div>
          <div class="titulo">ALBARÁN DE PEDIDO</div>
          <p style="margin-bottom: 30px; font-size: 16px;">Referencia: <strong>${referencia}</strong> | Fecha: <strong>${formatearFecha(fechaIso)}</strong></p>
          <table>
            <thead>
              <tr>
                <th>Cant.</th>
                <th>Descripción</th>
                <th style="text-align: right;">P. Unit.</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>${filasHTML}</tbody>
          </table>
          <div class="totales-caja">
            <table class="totales-tabla">
              <tr><td>Subtotal</td><td style="text-align: right;">${subtotal.toFixed(2).replace('.', ',')} €</td></tr>
              <tr><td>IVA (21%)</td><td style="text-align: right;">${iva.toFixed(2).replace('.', ',')} €</td></tr>
              <tr class="total-final"><td style="border-bottom: none;">TOTAL</td><td style="border-bottom: none; text-align: right;">${total.toFixed(2).replace('.', ',')} €</td></tr>
            </table>
          </div>
          <div class="footer">
            Gracias por su compra. Documento generado electrónicamente.
          </div>
        </body>
        </html>
      `;

      if (Platform.OS === 'web') {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        iframe.contentDocument?.write(htmlContent);
        iframe.contentDocument?.close();
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print(); 
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 2000);
        }, 500);
      } else {
        const { uri } = await Print.printToFileAsync({ html: htmlContent, base64: false });
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: `Albaran_${referencia}` });
      }
    } catch (e: any) {
      alerta?.mostrarAlerta("Error", "No se pudo generar el documento: " + e);
    } finally {
      setDescargandoId(null);
    }
  };

  return (
    <View style={styles.contenedorFondo}>
      <ScrollView
        contentContainerStyle={styles.scrollContenido}
        keyboardShouldPersistTaps="handled"
      >
        <Head>
          <title>Historial | Domitex</title>
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
              <View style={{ flex: 1 }}>
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
                  <View style={styles.dropdownEstado}>
                    <ScrollView
                      nestedScrollEnabled
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
                )}
              </View>
            </View>
          </View>
          <View
            style={[
              styles.filaFiltrosConfig,
              { marginTop: 15 },
              esMovil && { flexDirection: "column" },
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
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              marginTop: 15,
            }}
          >
            <Pressable style={styles.botonLimpiar} onPress={limpiarFiltros}>
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
        ) : pedidos.length === 0 ? (
          <View style={styles.contenedorVacio}>
            <Text style={styles.textoVacio}>Sin pedidos.</Text>
          </View>
        ) : (
          <View style={styles.listaPedidos}>
            {pedidos.map((p) => (
              <View
                key={p.id}
                style={[
                  styles.tarjetaPedido,
                  esMovil && styles.tarjetaPedidoMovil,
                ]}
              >
                <View
                  style={[styles.infoPedido, esMovil && styles.infoPedidoMovil]}
                >
                  <Text style={styles.tituloPedido}>Pedido {p.referencia}</Text>
                  <Text
                    style={[
                      styles.valorEstado,
                      {
                        color: p.estado === "Pendiente" ? "#2196F3" : "#4CAF50",
                      },
                    ]}
                  >
                    {p.estado}
                  </Text>
                  <Text style={styles.totalPedido}>
                    Total: {(p.total || 0).toFixed(2).replace(".", ",")} €
                  </Text>
                </View>
                <View
                  style={[
                    styles.accionesPedido,
                    esMovil && styles.accionesPedidoMovil,
                  ]}
                >
                  <Text style={styles.fechaPedido}>
                    {formatearFecha(p.fecha_pedido)}
                  </Text>
                  <View style={styles.contenedorBotonesTarjeta}>
                    <Pressable
                      style={styles.botonSecundario}
                      disabled={descargandoId === p.id}
                      onPress={() =>
                        generarAlbaranPDF(
                          p.id,
                          p.referencia,
                          p.fecha_pedido,
                          p.total || 0,
                        )
                      }
                    >
                      {descargandoId === p.id ? (
                        <ActivityIndicator size="small" color="#29166F" />
                      ) : (
                        <Text style={styles.textoBotonSecundario}>
                          Descargar albarán
                        </Text>
                      )}
                    </Pressable>
                    <Pressable
                      style={styles.botonDetalles}
                      onPress={() =>
                        router.push({
                          pathname: "/ver-pedido",
                          params: { pedidoId: p.id },
                        })
                      }
                    >
                      <Text style={styles.textoBotonDetalles}>Ver pedido</Text>
                    </Pressable>
                  </View>
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
  contenedorFondo: { flex: 1, backgroundColor: "#FAFAFA" },
  scrollContenido: { padding: 20, alignItems: "center", paddingBottom: 100 },
  tituloPagina: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 32,
    color: "#000",
    marginBottom: 30,
    width: "100%",
    maxWidth: 900,
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
    backgroundColor: "#FFF",
  },
  selectEstado: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9F9F9",
    borderWidth: 1,
    borderColor: "#29166F",
    padding: 10,
    borderRadius: 6,
  },
  textoSelect: { color: "#29166F", fontWeight: "bold" },
  iconoFlecha: {
    width: 12,
    height: 12,
    transform: [{ rotate: "90deg" }],
    tintColor: "#29166F",
  },
  dropdownEstado: {
    position: "absolute",
    top: 45,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#29166F",
    borderRadius: 6,
    zIndex: 2000,
  },
  opcionEstado: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  textoOpcion: { fontSize: 14, color: "#333" },
  botonLimpiar: { backgroundColor: "#EEEEEE", padding: 10, borderRadius: 8 },
  textoBotonLimpiar: { color: "#333", fontWeight: "bold" },
  botonBuscar: {
    backgroundColor: "#29166F",
    padding: 10,
    borderRadius: 8,
    paddingHorizontal: 20,
  },
  textoBotonBuscar: { color: "#FFF", fontWeight: "bold" },
  contenedorVacio: { marginTop: 50 },
  textoVacio: { fontSize: 18, color: "#666" },
  listaPedidos: { width: "100%", maxWidth: 900 },
  tarjetaPedido: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 25,
    marginBottom: 20,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  tarjetaPedidoMovil: { flexDirection: "column" },
  infoPedido: { flex: 1 },
  infoPedidoMovil: { marginBottom: 20 },
  tituloPedido: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 22,
    color: "#000",
    marginBottom: 8,
  },
  valorEstado: { fontWeight: "bold", fontSize: 16, marginBottom: 5 },
  totalPedido: { fontSize: 16, color: "#333" },
  accionesPedido: { alignItems: "flex-end" },
  accionesPedidoMovil: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  fechaPedido: { fontSize: 16, color: "#999", marginBottom: 15 },
  contenedorBotonesTarjeta: { gap: 10, alignItems: "flex-end" },
  botonSecundario: {
    borderWidth: 1,
    borderColor: "#29166F",
    padding: 8,
    borderRadius: 8,
    width: 160,
    alignItems: "center",
  },
  textoBotonSecundario: {
    color: "#29166F",
    fontWeight: "bold",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  botonDetalles: {
    backgroundColor: "#29166F",
    padding: 10,
    borderRadius: 8,
    width: 160,
    alignItems: "center",
  },
  textoBotonDetalles: { color: "#FFFFFF", fontWeight: "bold" },
});
