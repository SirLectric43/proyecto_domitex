import { useState, useEffect, useContext, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Image,
  useWindowDimensions,
  TextInput,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Head from "expo-router/head";
import { AuthContext } from "./auth-context";
import { AlertaContext } from "./alerta-context";
import { traducirError } from "@/utils/errores";

export default function VerPedidoAdminPage() {
  const { id } = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const esMovil = width < 768;
  const router = useRouter();
  const auth = useContext(AuthContext);
  const alerta = useContext(AlertaContext);
  const BASE_URL = process.env.EXPO_PUBLIC_API_URL || '';

  const [pedido, setPedido] = useState<any>(null);
  const [lineas, setLineas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargarDetallePedido = useCallback(async () => {
    try {
      const urlApi = `${BASE_URL}/api/pedidos/${id}`;

      const res = await fetch(urlApi, {
        headers: { Authorization: `Bearer ${auth?.usuario?.token}` },
      });
      const datos = await res.json();
      if (res.ok) {
        setPedido(datos);
        const lineasPreparadas = datos.lineas_pedido.map((l: any) => ({
          ...l,
          preparados: l.cantidad_servida || 0,
        }));
        setLineas(lineasPreparadas);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  }, [BASE_URL, id, auth?.usuario?.token]);

  useEffect(() => {
    if (id && auth?.usuario?.token) cargarDetallePedido();
  }, [id, auth?.usuario?.token, cargarDetallePedido]);

  const actualizarCantidadLocal = (index: number, nuevaCantidad: string) => {
    const num = parseInt(nuevaCantidad.replace(/[^0-9]/g, "")) || 0;
    const nuevasLineas = [...lineas];
    const tope = nuevasLineas[index].cantidad;
    nuevasLineas[index].preparados = Math.min(Math.max(0, num), tope);
    setLineas(nuevasLineas);
  };

  const modificarContador = (index: number, delta: number) => {
    const nuevasLineas = [...lineas];
    const actual = nuevasLineas[index].preparados;
    const tope = nuevasLineas[index].cantidad;
    const resultado = actual + delta;
    if (resultado >= 0 && resultado <= tope) {
      nuevasLineas[index].preparados = resultado;
      setLineas(nuevasLineas);
    }
  };

  const guardarCambios = async () => {
    setGuardando(true);
    try {
      const urlApi = `${BASE_URL}/api/admin/pedidos/${id}/lineas`;

      const payload = {
        lineas: lineas.map((l) => ({ id: l.id, preparados: l.preparados })),
      };

      const res = await fetch(urlApi, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth?.usuario?.token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alerta?.mostrarAlerta("Éxito", "Cantidades guardadas con éxito.");
      } else {
        alerta?.mostrarAlerta("Error", "Error al guardar los cambios.");
      }
    } catch (e: any) {
      const mensajeError = traducirError(e.message);
      alerta?.mostrarAlerta("Error", "Error al conectar con el servidor: " + mensajeError);
    } finally {
      setGuardando(false);
    }
  };

  const marcarCompletado = async () => {
    try {
      const urlApi = `${BASE_URL}/api/admin/pedidos/${id}/estado`;

      const res = await fetch(urlApi, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth?.usuario?.token}`,
        },
        body: JSON.stringify({ estado: "Completado" }),
      });

      if (res.ok) {
        router.back();
      }
    } catch (e: any) {
      const mensajeError = traducirError(e.message);
      alerta?.mostrarAlerta("Error", "Error al conectar con el servidor: " + mensajeError);
    }
  };

  if (cargando)
    return (
      <ActivityIndicator
        size="large"
        color="#29166F"
        style={{ flex: 1, marginTop: 100 }}
      />
    );

  return (
    <View style={styles.contenedorFondo}>
      <ScrollView contentContainerStyle={[styles.scrollContenido, esMovil && styles.scrollContenidoMovil]}>
        <Head>
            <title>Ver pedido (Administración) - {pedido.referencia} | Domitex</title>
        </Head>
        <View style={[styles.tarjetaContenedora, esMovil && styles.tarjetaContenedoraMovil]}>
          <View style={[styles.cabecera, esMovil && styles.cabeceraMovil]}>
            <View>
              <Text style={styles.tituloPedido}>
                Pedido Nº{pedido?.referencia}
              </Text>
              <Text style={styles.subtitulo}>
                Estado:{" "}
                <Text style={{ color: "#29166F" }}>{pedido?.estado}</Text>
              </Text>
            </View>
          </View>

          <View style={styles.divisor} />

          <View style={styles.tabla}>
            <View style={[styles.filaCabecera, esMovil && styles.ocultar]}>
              <Text style={[styles.textoCabecera, { flex: 2 }]}>Artículo</Text>
              <Text
                style={[styles.textoCabecera, { flex: 1, textAlign: "center" }]}
              >
                Medida
              </Text>
              <Text
                style={[styles.textoCabecera, { flex: 1, textAlign: "center" }]}
              >
                Preparados / Total
              </Text>
            </View>

            {lineas.map((item, index) => (
              <View key={index} style={[styles.filaArticulo, esMovil && styles.filaArticuloMovil]}>
                {!esMovil ? (
                  <>
                    <View style={styles.celdaArticulo}>
                      <Image
                        source={{
                          uri: item.articulos_medidas?.articulos?.imagen_url,
                        }}
                        style={styles.imagenMini}
                      />
                      <Text style={styles.nombreArticulo}>
                        {item.articulos_medidas?.articulos?.nombre}
                      </Text>
                    </View>

                    <Text
                      style={[styles.textoCelda, { flex: 1, textAlign: "center" }]}
                    >
                      {item.articulos_medidas?.medida}
                    </Text>
                  </>
                ) : (
                  <View style={styles.celdaMovil}>
                    <View style={styles.textosArticuloMovil}>
                      <Text style={styles.nombreArticulo}>
                        {item.articulos_medidas?.articulos?.nombre}
                      </Text>
                      <Text style={styles.textoCeldaMovil}>
                        Medida: {item.articulos_medidas?.medida}
                      </Text>
                    </View>
                    <Image
                      source={{
                        uri: item.articulos_medidas?.articulos?.imagen_url,
                      }}
                      style={styles.imagenGrandeMovil}
                    />
                  </View>
                )}

                <View style={[styles.celdaContador, esMovil && styles.celdaContadorMovil]}>
                  {esMovil && <Text style={styles.etiquetaMovil}>Preparados:</Text>}
                  <View style={styles.controlador}>
                    <Pressable onPress={() => modificarContador(index, -1)}>
                      <Image
                        source={require("@/assets/images/iconoMenos.png")}
                        style={styles.iconoAccion}
                      />
                    </Pressable>

                    <TextInput
                      style={styles.inputCantidad}
                      value={item.preparados.toString()}
                      onChangeText={(val) =>
                        actualizarCantidadLocal(index, val)
                      }
                      keyboardType="numeric"
                    />

                    <Pressable onPress={() => modificarContador(index, 1)}>
                      <Image
                        source={require("@/assets/images/iconoMas.png")}
                        style={styles.iconoAccion}
                      />
                    </Pressable>
                  </View>
                  <Text style={styles.textoTotal}>/ {item.cantidad}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.piePedido}>
            <Pressable style={styles.botonVolver} onPress={() => router.back()}>
              <Text style={styles.textoBotonVolver}>Volver a gestión</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      <View style={[styles.contenedorBotones, esMovil && styles.contenedorBotonesMovil]}>
        <Pressable
          style={[styles.botonCompletar, guardando && { opacity: 0.7 }, !esMovil && { flex: 1 }, esMovil && styles.botonFull]}
          onPress={guardarCambios}
          disabled={guardando}
        >
          <Text style={styles.textoBotonCompletar}>
            {guardando ? "Guardando..." : "Guardar cambios"}
          </Text>
        </Pressable>
        <Pressable style={[styles.botonCompletar, !esMovil && { flex: 1 }, esMovil && styles.botonFull]} onPress={marcarCompletado}>
          <Text style={styles.textoBotonCompletar}>
            Marcar como completado
          </Text>
        </Pressable>
      </View>
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
    maxWidth: 1000,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 30,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  cabecera: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  contenedorBotones: {
    flexDirection: "row",
    justifyContent: "center",
    padding: 20,
    gap: 15,
    width: "100%",
    maxWidth: 1000,
    alignSelf: "center",
  },
  tituloPedido: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 32,
    color: "#000",
  },
  subtitulo: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: "#666",
    marginTop: 5,
  },
  botonCompletar: {
    backgroundColor: '#29166F',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBotonCompletar: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  divisor: { height: 1, backgroundColor: "#EEE", marginBottom: 30 },
  tabla: { width: "100%" },
  filaCabecera: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#F0F0F0",
    paddingBottom: 15,
    marginBottom: 15,
  },
  textoCabecera: {
    fontFamily: "Inter_600SemiBold",
    color: "#999",
    fontSize: 14,
    textTransform: "uppercase",
  },
  filaArticulo: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F9F9F9",
  },
  celdaArticulo: { flexDirection: "row", alignItems: "center", gap: 15, flex: 2 },
  imagenMini: {
    width: 75,
    height: 75,
    borderRadius: 6,
    backgroundColor: "#F5F5F5",
  },
  nombreArticulo: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#000",
    flex: 1,
  },
  textoCelda: { fontFamily: "Inter_400Regular", fontSize: 16, color: "#333" },
  celdaContador: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    flex: 1,
  },
  controlador: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 5,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  iconoAccion: { width: 28, height: 28 },
  inputCantidad: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 18,
    color: "#29166F",
    textAlign: "center",
    width: 40,
    padding: 0,
  },
  textoTotal: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: "#999" },
  piePedido: { marginTop: 40, alignItems: "flex-start" },
  botonVolver: { paddingVertical: 10 },
  textoBotonVolver: {
    fontFamily: "Inter_600SemiBold",
    color: "#666",
    fontSize: 16,
    textDecorationLine: "underline",
  },

  scrollContenidoMovil: {
    paddingHorizontal: 15,
    paddingVertical: 20,
  },
  tarjetaContenedoraMovil: {
    padding: 20,
  },
  cabeceraMovil: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 15,
  },
  contenedorBotonesMovil: {
    flexDirection: "column",
    width: "100%",
  },
  botonFull: {
    width: "100%",
    alignItems: "center",
  },
  ocultar: {
    display: "none",
  },
  filaArticuloMovil: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 20,
    paddingVertical: 20,
  },
  celdaMovil: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  textosArticuloMovil: {
    flex: 1,
    paddingRight: 10,
    justifyContent: "center",
  },
  imagenGrandeMovil: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
  },
  textoCeldaMovil: {
    marginTop: 5,
    textAlign: "left",
    fontFamily: "Inter_600SemiBold",
    color: "#666",
    fontSize: 15,
  },
  celdaContadorMovil: {
    width: "100%",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  etiquetaMovil: {
    fontFamily: "Inter_600SemiBold",
    color: "#666",
    fontSize: 16,
    marginBottom: 5,
  },
});