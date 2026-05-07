import { useState, useEffect, useContext, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  Image,
  useWindowDimensions,
  ActivityIndicator,
  FlatList,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { Link, useRouter } from "expo-router";
import Head from "expo-router/head";
import { AuthContext } from "./auth-context";
import { AlertaContext } from "./alerta-context";
import { traducirError } from "@/utils/errores";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TarjetaArticulo = ({ articulo, anchoTarjeta, esMovil, hovered }: any) => (
  <View
    style={[
      styles.tarjetaArticulo,
      { width: anchoTarjeta },
      !esMovil && { marginRight: 0 },
      hovered && styles.tarjetaHover,
    ]}
  >
    <Image
      source={{ uri: articulo.imagen_url }}
      style={styles.imagenArticulo}
      resizeMode="contain"
    />
    <Text style={styles.nombreArticulo} numberOfLines={2}>
      {articulo.nombre}
    </Text>
  </View>
);

export default function CatalogoPage() {
  const { width } = useWindowDimensions();
  const esMovil = width < 768;
  const auth = useContext(AuthContext);
  const router = useRouter();
  const alerta = useContext(AlertaContext);
  const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "";

  const [catalogoAgrupado, setCatalogoAgrupado] = useState<any>({});
  const [cargando, setCargando] = useState(true);

  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const scrollRefs = useRef<any>({});
  const [indicesCatalogo, setIndicesCatalogo] = useState<any>({});
  const [categoriasExpandidas, setCategoriasExpandidas] = useState<any>({});

  useEffect(() => {
    const obtenerCatalogo = async () => {
      setCargando(true);
      try {
        const urlApi = `${BASE_URL}/api/articulos?page=${paginaActual}&limit=8`;

        const headers: any = {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        };

        if (auth?.usuario?.token) {
          headers["Authorization"] = `Bearer ${auth.usuario.token}`;
        }

        const respuesta = await fetch(urlApi, {
          method: "GET",
          headers: headers,
          cache: "no-store",
        });
        const datos = await respuesta.json();

        if (respuesta.ok) {
          const catData = datos.data ? datos.data : datos;
          setCatalogoAgrupado(catData || {});
          setTotalPaginas(datos.total_pages || 1);

          const indicesIniciales: any = {};
          const expandidasIniciales: any = {};
          Object.keys(catData || {}).forEach((categoria) => {
            indicesIniciales[categoria] = 0;
            expandidasIniciales[categoria] = false;
          });
          setIndicesCatalogo(indicesIniciales);
          setCategoriasExpandidas(expandidasIniciales);
        } else {
          alerta?.mostrarAlerta(
            "Error",
            datos.detail || "Error al cargar el catálogo.",
          );
        }
      } catch (e: any) {
        const mensajeError = traducirError(e.message);
        alerta?.mostrarAlerta("Error", mensajeError);
      } finally {
        setCargando(false);
      }
    };
    obtenerCatalogo();
  }, [auth?.usuario?.usuario_id, auth?.usuario?.token, paginaActual]);

  const paginaSiguiente = (categoria: string, totalArticulos: number) => {
    const prevIndex = indicesCatalogo[categoria] || 0;
    const nextIndex = Math.min(totalArticulos - 4, prevIndex + 4);

    setIndicesCatalogo((prev: any) => ({ ...prev, [categoria]: nextIndex }));

    scrollRefs.current[categoria]?.scrollTo({
      x: nextIndex * 250,
      animated: true,
    });
  };

  const paginaAnterior = (categoria: string) => {
    const prevIndex = indicesCatalogo[categoria] || 0;
    const nextIndex = Math.max(0, prevIndex - 4);

    setIndicesCatalogo((prev: any) => ({ ...prev, [categoria]: nextIndex }));

    scrollRefs.current[categoria]?.scrollTo({
      x: nextIndex * 250,
      animated: true,
    });
  };

  const toggleExpandir = (categoria: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCategoriasExpandidas((prev: any) => ({
      ...prev,
      [categoria]: !prev[categoria],
    }));
  };

  if (cargando && Object.keys(catalogoAgrupado).length === 0) {
    return (
      <View style={styles.contenedorCarga}>
        <Head>
          <title>Catálogo | Domitex</title>
        </Head>
        <ActivityIndicator size="large" color="#29166F" />
      </View>
    );
  }

  if (Object.keys(catalogoAgrupado).length === 0) {
    return (
      <View style={styles.contenedorFondo}>
        <ScrollView
          style={styles.contenedorPantalla}
          contentContainerStyle={styles.scrollContenido}
        >
          <Head>
            <title>Catálogo | Domitex</title>
          </Head>
          <Text style={styles.textoNoProductos}>
            No hay productos disponibles en el catálogo.
          </Text>
        </ScrollView>
      </View>
    );
  }

  const anchoTarjetaMovil = (width - 60) / 2 - 10;

  return (
    <View style={styles.contenedorFondo}>
      <ScrollView
        style={styles.contenedorPantalla}
        contentContainerStyle={styles.scrollContenido}
      >
        <Head>
          <title>Catálogo | Domitex</title>
        </Head>
        {auth?.usuario?.rol === "admin" && (
          <View
            style={[
              styles.contenedorBotonAnadir,
              esMovil && styles.contenedorBotonAnadirMovil,
            ]}
          >
            <Pressable
              style={styles.botonAnadir}
              onPress={() => router.push("/agregar-articulo")}
            >
              <Text style={styles.textoBotonAnadir}>Añadir nuevo artículo</Text>
            </Pressable>
          </View>
        )}

        {cargando && (
          <ActivityIndicator
            size="large"
            color="#29166F"
            style={{ marginBottom: 20 }}
          />
        )}

        {Object.keys(catalogoAgrupado).map((categoria, index) => {
          const articulos = catalogoAgrupado[categoria];

          if (articulos.length === 0) return null;

          const estaExpandido = categoriasExpandidas[categoria];

          return (
            <View key={index} style={styles.contenedorFilaCategoria}>
              <View style={styles.filaTitulo}>
                <Text style={styles.tituloCategoria}>
                  {categoria.toUpperCase()}
                </Text>
                <Pressable onPress={() => toggleExpandir(categoria)}>
                  <Text style={styles.textoVerTodo}>
                    {estaExpandido ? "Ver menos" : "Ver todo"}
                  </Text>
                </Pressable>
              </View>

              {estaExpandido ? (
                <View
                  style={[
                    styles.gridExpandido,
                    esMovil && styles.gridExpandidoMovil,
                  ]}
                >
                  {articulos.map((articulo: any) => (
                    <Link
                      key={articulo.id}
                      href={{
                        pathname: "/vista-articulo",
                        params: { id: articulo.id },
                      }}
                      asChild
                    >
                      <Pressable>
                        {({ hovered }) => (
                          <TarjetaArticulo
                            articulo={articulo}
                            anchoTarjeta={esMovil ? anchoTarjetaMovil : 220}
                            esMovil={esMovil}
                            hovered={hovered}
                          />
                        )}
                      </Pressable>
                    </Link>
                  ))}
                </View>
              ) : !esMovil ? (
                <View style={styles.filaArticulosPcWrapper}>
                  <View style={styles.contenedorFlecha}>
                    {indicesCatalogo[categoria] > 0 && (
                      <Pressable onPress={() => paginaAnterior(categoria)}>
                        <Image
                          source={require("@/assets/images/iconoFlechaIzq.png")}
                          style={styles.iconoFlecha}
                          resizeMode="contain"
                        />
                      </Pressable>
                    )}
                  </View>

                  <View style={styles.contenedorScrollPc}>
                    <ScrollView
                      ref={(el) => {
                        scrollRefs.current[categoria] = el;
                      }}
                      horizontal
                      scrollEnabled={false}
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.filaArticulosPc}
                    >
                      {articulos.map((articulo: any, i: number) => (
                        <Link
                          key={articulo.id}
                          href={{
                            pathname: "/vista-articulo",
                            params: { id: articulo.id },
                          }}
                          asChild
                        >
                          <Pressable
                            style={{
                              marginRight: i === articulos.length - 1 ? 0 : 30,
                            }}
                          >
                            {({ hovered }) => (
                              <TarjetaArticulo
                                articulo={articulo}
                                anchoTarjeta={220}
                                hovered={hovered}
                              />
                            )}
                          </Pressable>
                        </Link>
                      ))}
                    </ScrollView>
                  </View>

                  <View style={styles.contenedorFlecha}>
                    {indicesCatalogo[categoria] + 4 < articulos.length && (
                      <Pressable
                        onPress={() =>
                          paginaSiguiente(categoria, articulos.length)
                        }
                      >
                        <Image
                          source={require("@/assets/images/iconoFlechaDer.png")}
                          style={styles.iconoFlecha}
                          resizeMode="contain"
                        />
                      </Pressable>
                    )}
                  </View>
                </View>
              ) : (
                <FlatList
                  data={articulos}
                  horizontal={true}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filaArticulosMovil}
                  renderItem={({ item, index: i }) => (
                    <Link
                      href={{
                        pathname: "/vista-articulo",
                        params: { id: item.id },
                      }}
                      asChild
                    >
                      <Pressable
                        style={{
                          marginRight: i === articulos.length - 1 ? 0 : 15,
                        }}
                      >
                        <TarjetaArticulo
                          articulo={item}
                          anchoTarjeta={anchoTarjetaMovil}
                        />
                      </Pressable>
                    </Link>
                  )}
                  keyExtractor={(item) => item.id.toString()}
                />
              )}
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedorCarga: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  contenedorFondo: { flex: 1, backgroundColor: "#FFFFFF" },
  contenedorPantalla: { flexGrow: 1, backgroundColor: "#FFFFFF" },
  scrollContenido: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    paddingBottom: 100,
    alignItems: "center",
  },
  textoNoProductos: {
    fontFamily: "Inter_400Regular",
    fontSize: 18,
    color: "#000000",
    textAlign: "center",
    marginTop: 50,
  },
  contenedorBotonAnadir: {
    width: "100%",
    maxWidth: 1100,
    alignItems: "flex-end",
    marginBottom: 30,
  },
  contenedorBotonAnadirMovil: { alignItems: "center" },
  botonAnadir: {
    backgroundColor: "#29166F",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  textoBotonAnadir: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  contenedorFilaCategoria: { width: "100%", maxWidth: 1100, marginBottom: 40 },
  filaTitulo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: Platform.OS === "web" ? 50 : 5,
  },
  tituloCategoria: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 32,
    color: "#000000",
  },
  textoVerTodo: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#DB3632",
  },
  tarjetaArticulo:
    Platform.OS === "web"
      ? ({
          backgroundColor: "#FFFFFF",
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#EAEAEA",
          borderRadius: 12,
          padding: 15,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 5,
          elevation: 3,
          height: 290,
          justifyContent: "flex-start",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        } as any)
      : {
          backgroundColor: "#FFFFFF",
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#EAEAEA",
          borderRadius: 12,
          padding: 15,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 5,
          elevation: 3,
          height: 290,
          justifyContent: "flex-start",
        },
  tarjetaHover: {
    transform: [{ scale: 1.05 }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  imagenArticulo: { width: "100%", height: 180, marginBottom: 15 },
  nombreArticulo: {
    fontFamily: "Inter_400Regular",
    fontSize: 18,
    color: "#000000",
    textAlign: "center",
    paddingHorizontal: 5,
  },
  gridExpandido: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 30,
    width: "100%",
    maxWidth: 970,
    alignSelf: "center",
    paddingVertical: 10,
  },
  gridExpandidoMovil: { gap: 15, paddingHorizontal: 5 },
  filaArticulosPcWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  contenedorFlecha: {
    width: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  contenedorScrollPc: { width: 970, overflow: "hidden" },
  filaArticulosPc: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  iconoFlecha: { width: 30, height: 30 },
  filaArticulosMovil: { paddingHorizontal: 5, paddingVertical: 10 },
  contenedorPaginacion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
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
