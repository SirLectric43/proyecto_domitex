import { useState, useEffect, useContext, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Image,
} from "react-native";
import { AuthContext } from "./auth-context";
import { router } from "expo-router";
import Head from "expo-router/head";
import { AlertaContext } from "./alerta-context";
import { traducirError } from "@/utils/errores";

export default function GestionUsuariosPage() {
  const auth = useContext(AuthContext);
  const alerta = useContext(AlertaContext);
  const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "";

  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [usuarioABorrar, setUsuarioABorrar] = useState<string | null>(null);

  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const [busquedaNombre, setBusquedaNombre] = useState("");
  const [filtroRol, setFiltroRol] = useState("Todos");

  const roles = ["Todos", "Admin", "Empleado", "Cliente"];

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);
    try {
      let urlApi = `${BASE_URL}/api/usuarios?page=${paginaActual}&limit=20`;
      if (busquedaNombre.trim() !== "")
        urlApi += `&nombre=${encodeURIComponent(busquedaNombre)}`;
      if (filtroRol !== "Todos")
        urlApi += `&rol=${encodeURIComponent(filtroRol)}`;

      const respuesta = await fetch(urlApi, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${auth?.usuario?.token}`,
        },
      });
      const datos = await respuesta.json();

      if (respuesta.ok) {
        setUsuarios(
          datos.data ? datos.data : Array.isArray(datos) ? datos : [],
        );
        setTotalPaginas(datos.total_pages || 1);
      }
    } catch (e: any) {
      const mensajeError = traducirError(e.message);
      alerta?.mostrarAlerta("Error", mensajeError);
    } finally {
      setCargando(false);
    }
  }, [BASE_URL, paginaActual, busquedaNombre, filtroRol, auth?.usuario?.token, alerta]);

  useEffect(() => {
    if (!auth?.usuario?.token) return;

    const nombreLen = busquedaNombre.trim().length;

    if (nombreLen > 0 && nombreLen < 3) {
      return;
    }

    const timeoutId = setTimeout(() => {
      if (paginaActual === 1) {
        cargarUsuarios();
      } else {
        setPaginaActual(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [cargarUsuarios, auth?.usuario?.token, busquedaNombre, paginaActual]);

  const confirmarBaja = async () => {
    if (!usuarioABorrar) return;

    try {
      const urlApi = `${BASE_URL}/api/usuarios/${usuarioABorrar}`;

      const respuesta = await fetch(urlApi, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${auth?.usuario?.token}`,
        },
      });

      if (respuesta.ok) {
        setUsuarios(usuarios.filter((u) => u.id !== usuarioABorrar));
        setModalVisible(false);
        setUsuarioABorrar(null);
        if (usuarios.length === 1 && paginaActual > 1) {
          setPaginaActual(paginaActual - 1);
        } else {
          cargarUsuarios();
        }
      } else {
        const errorData = await respuesta.json();
        alerta?.mostrarAlerta(
          "Error",
          errorData.detail || "No se pudo eliminar",
        );
      }
    } catch (e: any) {
      const mensajeError = traducirError(e.message);
      alerta?.mostrarAlerta("Error", mensajeError);
    }
  };

  const abrirModalBaja = (id: string) => {
    setUsuarioABorrar(id);
    setModalVisible(true);
  };

  const formatearFecha = (fechaIso: string) => {
    if (!fechaIso) return "Nunca";
    const fecha = new Date(fechaIso);
    return fecha.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View style={styles.contenedorFondo}>
      <ScrollView
        contentContainerStyle={styles.scrollContenido}
        keyboardShouldPersistTaps="handled"
      >
        <Head>
          <title>Gestión de usuarios | Domitex</title>
        </Head>
        <Text style={styles.tituloPagina}>Gestión de usuarios</Text>

        <View style={styles.cajaFiltros}>
          <TextInput
            style={[styles.inputBusqueda, { marginBottom: 15 }]}
            placeholder="Buscar por nombre..."
            placeholderTextColor="#999"
            value={busquedaNombre}
            onChangeText={setBusquedaNombre}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {roles.map((r, index) => (
              <Pressable
                key={r}
                style={[
                  styles.botonRol,
                  filtroRol === r && styles.botonRolActivo,
                  { marginRight: index === roles.length - 1 ? 0 : 10 },
                ]}
                onPress={() => setFiltroRol(r)}
              >
                <Text
                  style={[
                    styles.textoRol,
                    filtroRol === r && styles.textoRolActivo,
                  ]}
                >
                  {r}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {cargando ? (
          <ActivityIndicator
            size="large"
            color="#29166F"
            style={{ marginVertical: 80 }}
          />
        ) : (
          <View style={styles.gridUsuarios}>
            {usuarios.length === 0 && (
              <Text style={styles.textoVacio}>No se encontraron usuarios.</Text>
            )}
            {usuarios.map((u) => (
              <View key={u.id} style={styles.tarjetaUsuario}>
                <View style={styles.infoContenedor}>
                  <Text style={styles.nombreUsuario}>
                    {u.nombre} {u.apellidos}
                  </Text>
                  <Text style={styles.infoUsuario}>Rol: {u.rol}</Text>
                  <Text style={styles.infoUsuario}>
                    Último acceso: {formatearFecha(u.ultimo_acceso)}
                  </Text>
                </View>

                <View style={styles.contenedorBotones}>
                  <Pressable
                    style={styles.botonAdministrar}
                    onPress={() =>
                      router.push({
                        pathname: "/administrar-usuario",
                        params: { id: u.id },
                      })
                    }
                  >
                    <Text style={styles.textoBotonAdministrar}>
                      Administrar
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.botonBaja}
                    onPress={() => abrirModalBaja(u.id)}
                  >
                    <Text style={styles.textoBotonBaja}>Dar de baja</Text>
                  </Pressable>
                </View>
              </View>
            ))}

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

        <Pressable
          style={styles.botonCrearUsuario}
          onPress={() => router.push("/crear-usuario")}
        >
          <Text style={styles.textoBotonCrear}>Crear nuevo usuario</Text>
        </Pressable>
      </ScrollView>

      {modalVisible && (
        <View style={styles.overlayModal}>
          <View style={styles.cajaModal}>
            <Text style={styles.textoModal}>
              ¿Estás seguro de que deseas dar de baja a este usuario?
            </Text>
            <View style={styles.botonesModal}>
              <Pressable
                style={styles.botonCancelarModal}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.textoCancelarModal}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={styles.botonConfirmarModal}
                onPress={confirmarBaja}
              >
                <Text style={styles.textoConfirmarModal}>Sí</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedorCarga: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  contenedorFondo: { flex: 1, backgroundColor: "#FAFAFA" },
  scrollContenido: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    paddingBottom: 80,
  },
  tituloPagina: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 32,
    color: "#29166F",
    marginBottom: 40,
    width: "100%",
    maxWidth: 800,
    textAlign: "left",
  },
  cajaFiltros: {
    width: "100%",
    maxWidth: 800,
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
  },
  inputBusqueda: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 8,
    padding: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    backgroundColor: "#F9F9F9",
  },
  botonRol: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    borderWidth: 1,
    borderColor: "#DDD",
  },
  botonRolActivo: { backgroundColor: "#29166F", borderColor: "#29166F" },
  textoRol: { fontFamily: "Inter_600SemiBold", color: "#666", fontSize: 14 },
  textoRolActivo: { color: "#FFF" },
  botonBuscar: {
    backgroundColor: "#29166F",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  textoBotonBuscar: {
    color: "#FFF",
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  gridUsuarios: { width: "100%", maxWidth: 800, gap: 20 },
  tarjetaUsuario: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    width: "100%",
  },
  infoContenedor: { marginBottom: 20 },
  nombreUsuario: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: "#29166F",
    marginBottom: 8,
  },
  infoUsuario: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#333333",
    marginBottom: 4,
  },
  contenedorBotones: { flexDirection: "row", gap: 15 },
  botonAdministrar: {
    backgroundColor: "#EEEEEE",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  textoBotonAdministrar: {
    color: "#333333",
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  botonBaja: {
    backgroundColor: "#DB3632",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  textoBotonBaja: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  botonCrearUsuario: {
    backgroundColor: "#29166F",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 40,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: 800,
  },
  textoBotonCrear: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  overlayModal: {
    position: Platform.OS === "web" ? "fixed" : "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  } as any,
  cajaModal: {
    backgroundColor: "#FFFFFF",
    padding: 30,
    borderRadius: 12,
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  textoModal: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: "#000000",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 26,
  },
  botonesModal: { flexDirection: "row", gap: 15, width: "100%" },
  botonCancelarModal: {
    backgroundColor: "#EEEEEE",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    flex: 1,
    alignItems: "center",
  },
  textoCancelarModal: {
    color: "#333333",
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  botonConfirmarModal: {
    backgroundColor: "#DB3632",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    flex: 1,
    alignItems: "center",
  },
  textoConfirmarModal: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  contenedorPaginacion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    width: "100%",
    maxWidth: 800,
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
  textoVacio: {
    fontFamily: "Inter_400Regular",
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginVertical: 20,
  },
});