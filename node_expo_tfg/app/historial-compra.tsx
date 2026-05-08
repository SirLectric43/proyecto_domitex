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
import { useRouter } from "expo-router";
import Head from "expo-router/head";
import { traducirError } from "@/utils/errores";
import { AlertaContext } from "./alerta-context";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

export default function HistorialCompra() {
  const { width } = useWindowDimensions();
  const esMovil = width < 768;
  const auth = useContext(AuthContext);
  const router = useRouter();
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
        setPedidos(datos.data ? datos.data : Array.isArray(datos) ? datos : []);
        setTotalPaginas(datos.total_pages || 1);
      }
    } catch (e: any) {
        const mensajeError = traducirError(e.message);
        alerta?.mostrarAlerta("Error", mensajeError);
    } finally {
      setCargando(false);
    }
  }, [BASE_URL, paginaActual, fechaInicio, fechaFin, filtroEstado, auth?.usuario?.token, alerta]);

  useEffect(() => {
    cargarPedidos();
  }, [cargarPedidos, auth?.usuario?.token]);

  const limpiarFiltros = () => {
    setFechaInicio("");
    setFechaFin("");
    setFiltroEstado("Todos");
    setPaginaActual(1);
  };

  const formatearFecha = (fechaISO: string) => {
    const fecha = new Date(fechaISO);
    const dia = fecha.getDate().toString().padStart(2, "0");
    const mes = (fecha.getMonth() + 1).toString().padStart(2, "0");
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
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
            .titulo { font-size: 24px; font-weight: bold; color: #29166F; border-bottom: 2px solid #29166F; padding-bottom: 10px; margin-bottom: 20px; }
            .tabla-items { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .tabla-items th { background-color: #29166F; color: white; padding: 12px; text-align: left; }
            .totales-tabla { width: 300px; border-collapse: collapse; }
            .totales-tabla td { padding: 10px; border-bottom: 1px solid #EEE; }
            .total-final { font-weight: bold; color: #29166F; font-size: 18px; }
            .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #EEE; padding-top: 20px; }
          </style>
        </head>
        <body>
          <table style="width: 100%; margin-bottom: 50px; border: none;">
            <tr>
              <td style="vertical-align: top; width: 60%;">
                ${logoHTML}
                <div style="font-size: 14px; line-height: 1.6; color: #555; margin-top: 20px;">
                  <strong>Domitex Hogar S.L.</strong><br>
                  Calle Emprendedores Nº20, 24, 17<br>
                  41749 El Cuervo de Sevilla (Sevilla)<br>
                  domitex@hotmail.es | 955 97 97 99
                </div>
              </td>
              <td style="vertical-align: top; width: 40%; text-align: right;">
                <h3 style="margin: 0 0 10px 0; color: #666; font-size: 16px;">DATOS DEL CLIENTE</h3>
                <strong style="font-size: 14px;">${auth?.usuario?.nombre || "Cliente"}</strong>
              </td>
            </tr>
          </table>

          <div class="titulo">ALBARÁN DE PEDIDO</div>
          <p style="margin-bottom: 30px; font-size: 16px;">Referencia: <strong>${referencia}</strong> | Fecha: <strong>${formatearFecha(fechaIso)}</strong></p>

          <table class="tabla-items">
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

          <table style="width: 100%; border: none;">
            <tr>
              <td style="width: 50%;"></td>
              <td style="width: 50%;" align="right">
                <table class="totales-tabla" style="float: right;">
                  <tr><td style="text-align: left;">Subtotal</td><td style="text-align: right;">${subtotal.toFixed(2).replace('.', ',')} €</td></tr>
                  <tr><td style="text-align: left;">IVA (21%)</td><td style="text-align: right;">${iva.toFixed(2).replace('.', ',')} €</td></tr>
                  <tr class="total-final"><td style="border-bottom: none; text-align: left;">TOTAL</td><td style="border-bottom: none; text-align: right;">${total.toFixed(2).replace('.', ',')} €</td></tr>
                </table>
              </td>
            </tr>
          </table>

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
          setTimeout(() => { document.body.removeChild(iframe); }, 2000);
        }, 500);
      } else {
        const { uri } = await Print.printToFileAsync({ html: htmlContent, base64: false });
        const fs = FileSystem as any; 
        
        const nuevaRuta = `${fs.cacheDirectory}Albaran_${referencia}.pdf`;
        
        await fs.copyAsync({
          from: uri,
          to: nuevaRuta
        });

        const sePuedeCompartir = await Sharing.isAvailableAsync();
        if (!sePuedeCompartir) {
          alerta?.mostrarAlerta("Error", "Tu dispositivo no soporta la descarga de archivos.");
          return;
        }

        await Sharing.shareAsync(nuevaRuta, { 
          UTI: 'com.adobe.pdf', 
          mimeType: 'application/pdf', 
          dialogTitle: `Albarán ${referencia}` 
        });
      }
    } catch (e: any) {
      alerta?.mostrarAlerta("Error", "No se pudo generar el documento: " + e);
    } finally {
      setDescargandoId(null);
    }
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
            <Pressable style={styles.botonBuscar} onPress={cargarPedidos}>
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
                    <View style={styles.contenedorBotonesTarjeta}>
                      <Pressable
                        style={styles.botonSecundario}
                        disabled={descargandoId === pedido.id}
                        onPress={() => generarAlbaranPDF(pedido.id, pedido.referencia, pedido.fecha_pedido, totalSeguro)}
                      >
                        {descargandoId === pedido.id ? (
                          <ActivityIndicator size="small" color="#29166F" />
                        ) : (
                          <Text style={styles.textoBotonSecundario}>Descargar albarán</Text>
                        )}
                      </Pressable>
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
    marginBottom: 30,
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
    alignItems: "flex-end",
  },
  fechaPedido: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#999",
    marginBottom: 15,
  },
  contenedorBotonesTarjeta: {
    alignItems: 'flex-end',
    gap: 10,
  },
  botonSecundario: {
    backgroundColor: "#F9F9F9",
    borderWidth: 1,
    borderColor: "#29166F",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    width: 175,
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
  },
  textoBotonSecundario: {
    color: "#29166F",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  botonDetalles: {
    backgroundColor: "#29166F",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: 175,
    alignItems: 'center',
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