import { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
  TextInput,
  useWindowDimensions,
  Modal,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import Head from "expo-router/head";
import * as ImagePicker from "expo-image-picker";
import { AuthContext } from "./auth-context";
import { AlertaContext } from "./alerta-context";
import { traducirError } from "@/utils/errores";

export default function VistaArticuloPage() {
  const { id } = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const esMovil = width < 768;
  const auth = useContext(AuthContext);
  const alerta = useContext(AlertaContext);
  const BASE_URL = process.env.EXPO_PUBLIC_API_URL || '';

  const esAdmin = auth?.usuario?.rol === "admin";

  const [articulo, setArticulo] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [imgError, setImgError] = useState(false);

  const [medidaSeleccionada, setMedidaSeleccionada] = useState<any>(null);
  const [cantidad, setCantidad] = useState("1");

  const [modoEdicion, setModoEdicion] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [modalDescatalogar, setModalDescatalogar] = useState(false);
  
  const [formulario, setFormulario] = useState<any>({
    nombre: "",
    descripcion: "",
    categoria: "",
    imagenUri: null,
    imagenBase64: null,
    medidas: [],
  });

  const [busquedaCategoria, setBusquedaCategoria] = useState("");
  const [categoriasLista, setCategoriasLista] = useState<any[]>([]);
  const [mostrarCategorias, setMostrarCategorias] = useState(false);
  const [creandoCategoria, setCreandoCategoria] = useState(false);
  const [nuevaCategoriaTexto, setNuevaCategoriaTexto] = useState("");

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const urlApi = `${BASE_URL}/api/categorias`;
        const res = await fetch(urlApi);
        if (res.ok) {
          const data = await res.json();
          setCategoriasLista(data);
        }
      } catch (e) {}
    };
    fetchCategorias();
  }, []);

  const categoriasFiltradas = categoriasLista.filter((c) =>
    c.nombre.toLowerCase().includes(busquedaCategoria.toLowerCase()),
  );

  useEffect(() => {
    const obtenerDetalle = async () => {
      try {
        setImgError(false);
        const urlApi = `${BASE_URL}/api/articulos/${id}`;

        const respuesta = await fetch(urlApi, {
          headers: auth?.usuario?.token
            ? { Authorization: `Bearer ${auth.usuario.token}` }
            : {},
        });
        const datos = await respuesta.json();

        if (respuesta.ok) {
          setArticulo(datos);

          const medidasValidas = esAdmin
            ? datos.medidas
            : datos.medidas.filter((m: any) => m.disponible);

          if (medidasValidas && medidasValidas.length > 0) {
            setMedidaSeleccionada(medidasValidas[0]);
          }

          setFormulario({
            nombre: datos.nombre,
            descripcion: datos.descripcion,
            categoria: datos.categoria,
            imagenUri: datos.imagen_url,
            imagenBase64: null,
            medidas: datos.medidas
              ? datos.medidas.map((m: any) => ({
                  id: m.id,
                  medida: m.medida,
                  precio: String(m.precio),
                  stock: String(m.stock),
                  disponible: m.disponible,
                }))
              : [],
          });

          setBusquedaCategoria(datos.categoria_nombre || "");

          if (auth?.usuario?.rol === "admin") {
            setModoEdicion(true);
          }
        }
      } catch (error) {
      } finally {
        setCargando(false);
      }
    };
    if (id) obtenerDetalle();
  }, [id, auth?.usuario?.rol, auth?.usuario?.token]);

  const guardarNuevaCategoria = async () => {
    if (!nuevaCategoriaTexto.trim()) return;
    try {
      const urlApi = `${BASE_URL}/api/categorias`;
      const res = await fetch(urlApi, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth?.usuario?.token}`,
        },
        body: JSON.stringify({ nombre: nuevaCategoriaTexto }),
      });
      if (res.ok) {
        const data = await res.json();
        setCategoriasLista([...categoriasLista, data]);
        setFormulario({ ...formulario, categoria: data.id });
        setBusquedaCategoria(data.nombre);
        setCreandoCategoria(false);
        setNuevaCategoriaTexto("");
        setMostrarCategorias(false);
      } else {
        alerta?.mostrarAlerta("Error", "No se pudo crear la categoría");
      }
    } catch (e: any) {
        const mensajeError = traducirError(e.message);
        alerta?.mostrarAlerta("Error", mensajeError);
      }
  };

  const manejarCantidad = (texto: string) => {
    const numero = texto.replace(/[^0-9]/g, "");
    setCantidad(numero);
  };

  const incrementar = () => setCantidad(String(Number(cantidad || 0) + 1));
  const decrementar = () =>
    setCantidad(String(Math.max(1, Number(cantidad || 0) - 1)));

  const anadirAlCarrito = async () => {
    if (!auth?.usuario?.token) {
      alerta?.mostrarAlerta("Atención", "Para añadir un artículo al carrito tiene que registrarse/iniciar sesión.");
      return;
    }

    if (!medidaSeleccionada) return;
    const cantNum = Number(cantidad);
    if (cantNum <= 0)
      return alerta?.mostrarAlerta("Atención", "Introduce una cantidad válida");

    try {
      const urlApi = `${BASE_URL}/api/carrito/anadir`;

      const respuesta = await fetch(urlApi, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: auth?.usuario?.token
            ? `Bearer ${auth.usuario.token}`
            : "",
        },
        body: JSON.stringify({
          articulo_medida_id: medidaSeleccionada.id,
          cantidad: cantNum,
        }),
      });

      const datos = await respuesta.json();

      if (respuesta.ok) {
        alerta?.mostrarAlerta(
          "Éxito",
          `¡Añadido a la cesta!\n${cantNum}x ${articulo.nombre} (${medidaSeleccionada.medida})`,
        );
        if (auth?.refrescarCarrito) {
          auth.refrescarCarrito();
        }
      } else {
        alerta?.mostrarAlerta(
          "Error",
          `Error al añadir: ${datos.detail || "Revisa tu conexión"}`,
        );
      }
    } catch (e: any) {
      const mensajeError = traducirError(e.message);
      alerta?.mostrarAlerta("Error", mensajeError);
    }
  };

  const seleccionarImagen = async () => {
    if (!modoEdicion) return;
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!resultado.canceled) {
      setImgError(false);
      setFormulario((prev: any) => ({
        ...prev,
        imagenUri: resultado.assets[0].uri,
        imagenBase64: resultado.assets[0].base64 || null,
      }));
    }
  };

  const manejarGuardar = async () => {
    if (
      !formulario.nombre ||
      !formulario.categoria ||
      !formulario.descripcion
    ) {
      alerta?.mostrarAlerta(
        "Atención",
        "Por favor rellena el nombre, selecciona una categoría y añade descripción.",
      );
      return;
    }
    for (let m of formulario.medidas) {
      if (!m.medida || !m.precio || !m.stock) {
        alerta?.mostrarAlerta(
          "Atención",
          "Todas las variantes deben tener medida, precio y stock.",
        );
        return;
      }
    }

    setGuardando(true);

    try {
      const urlApi = `${BASE_URL}/api/articulos/${id}`;

      const medidasFormateadas = formulario.medidas.map((m: any) => ({
        id: m.id,
        medida: m.medida,
        precio: parseFloat(m.precio),
        stock: parseInt(m.stock, 10),
        disponible: m.disponible,
      }));

      const bodyJSON = {
        nombre: formulario.nombre,
        descripcion: formulario.descripcion,
        categoria: formulario.categoria,
        imagen_base64: formulario.imagenBase64,
        medidas: medidasFormateadas,
      };

      const respuesta = await fetch(urlApi, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth?.usuario?.token}`,
        },
        body: JSON.stringify(bodyJSON),
      });

      const datos = await respuesta.json();

      if (respuesta.ok) {
        alerta?.mostrarAlerta(
          "Éxito",
          "El artículo se ha actualizado correctamente.",
        );
        setImgError(false);
        setArticulo({
          ...articulo,
          nombre: formulario.nombre,
          descripcion: formulario.descripcion,
          categoria: formulario.categoria,
          categoria_nombre:
            categoriasLista.find((c) => c.id === formulario.categoria)
              ?.nombre || articulo.categoria_nombre,
          imagen_url: formulario.imagenUri || articulo.imagen_url,
          medidas: medidasFormateadas,
        });
        if (medidasFormateadas.length > 0) {
          setMedidaSeleccionada(medidasFormateadas[0]);
        }
      } else {
        alerta?.mostrarAlerta(
          "Error",
          datos.detail || "Hubo un error al actualizar.",
        );
      }
    } catch (error) {
      alerta?.mostrarAlerta("Error", "Problema de conexión con el servidor.");
    } finally {
      setGuardando(false);
    }
  };

  const confirmarDescatalogar = async () => {
    setModalDescatalogar(false);
    setGuardando(true);
    try {
      const urlApi = `${BASE_URL}/api/articulos/${id}`;

      const medidasFormateadas = formulario.medidas.map((m: any) => ({
        id: m.id,
        medida: m.medida,
        precio: parseFloat(m.precio),
        stock: parseInt(m.stock, 10) || 0,
        disponible: false, 
      }));

      const bodyJSON = {
        nombre: formulario.nombre,
        descripcion: formulario.descripcion,
        categoria: formulario.categoria,
        imagen_base64: formulario.imagenBase64,
        medidas: medidasFormateadas,
      };

      const respuesta = await fetch(urlApi, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth?.usuario?.token}`,
        },
        body: JSON.stringify(bodyJSON),
      });

      if (respuesta.ok) {
        alerta?.mostrarAlerta("Éxito", "El artículo ha sido descatalogado correctamente.");
        setFormulario({ ...formulario, medidas: medidasFormateadas });
        setArticulo({ ...articulo, medidas: medidasFormateadas });
      } else {
        alerta?.mostrarAlerta("Error", "No se pudo descatalogar el artículo.");
      }
    } catch (error) {
      alerta?.mostrarAlerta("Error", "Problema de conexión con el servidor.");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <View style={styles.contenedorCarga}>
        <Head>
          <title>Vista de artículo | Domitex</title>
        </Head>
        <ActivityIndicator size="large" color="#29166F" />
      </View>
    );
  }

  if (!articulo)
    return (
    <View>
        <Head>
            <title>Vista de artículo | Domitex</title>
        </Head>
        <Text style={{ marginTop: 100, textAlign: "center" }}>
          Artículo no encontrado.
        </Text>
      </View>
        
    );

  const medidasVisibles = esAdmin
    ? articulo.medidas
    : articulo.medidas?.filter((m: any) => m.disponible);

  return (
    <View style={styles.contenedorFondo}>
      <ScrollView
        contentContainerStyle={styles.scrollContenido}
        keyboardShouldPersistTaps="handled"
      >
        <Head>
            <title>{articulo.nombre} | Domitex</title>
        </Head>
        <View style={styles.tarjetaPrincipal}>
          {!esMovil && esAdmin && (
            <View
              style={{
                width: "100%",
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 15,
                marginBottom: 15,
              }}
            >
              <Pressable
                style={[
                  styles.botonGuardarCambios,
                  guardando && { opacity: 0.7 },
                  { backgroundColor: "#DB3632" },
                ]}
                onPress={() => setModalDescatalogar(true)}
              >
                <Text style={styles.textoBotonGuardarCambios}>
                  Descatalogar
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.botonGuardarCambios,
                  guardando && { opacity: 0.7 },
                ]}
                onPress={manejarGuardar}
                disabled={guardando}
              >
                <Text style={styles.textoBotonGuardarCambios}>
                  {guardando ? "Guardando..." : "Guardar cambios"}
                </Text>
              </Pressable>
            </View>
          )}

          {modoEdicion ? (
            <>
              <View
                style={[
                  styles.contenedorPrincipalEdit,
                  esMovil && styles.contenedorPrincipalMovilEdit,
                ]}
              >
                <View style={styles.columnaImagenEdit}>
                  <View style={styles.cajaImagenEdit}>
                    <Image
                      source={
                        imgError ||
                        (!formulario.imagenUri && !articulo.imagen_url)
                          ? require("@/assets/images/placeholder.png")
                          : { uri: formulario.imagenUri || articulo.imagen_url }
                      }
                      style={styles.imagenPreviaEdit}
                      resizeMode="contain"
                      onError={() => setImgError(true)}
                    />
                  </View>
                  <Pressable
                    style={styles.botonSubirImagenEdit}
                    onPress={seleccionarImagen}
                  >
                    <Text style={styles.textoBotonSecundarioEdit}>
                      Cambiar Fotografía
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.columnaDatosEdit}>
                  <View style={styles.grupoInputEdit}>
                    <Text style={styles.labelEdit}>Nombre del artículo</Text>
                    <TextInput
                      style={styles.inputEdit}
                      value={formulario.nombre}
                      onChangeText={(t) =>
                        setFormulario({ ...formulario, nombre: t })
                      }
                    />
                  </View>

                  <View style={[styles.grupoInputEdit, { zIndex: 10 }]}>
                    <Text style={styles.labelEdit}>Categoría</Text>
                    <TextInput
                      style={[
                        styles.inputEdit,
                        mostrarCategorias && {
                          zIndex: 101,
                          position: "relative",
                        },
                      ]}
                      value={busquedaCategoria}
                      onChangeText={(text) => {
                        setBusquedaCategoria(text);
                        setMostrarCategorias(true);
                        if (formulario.categoria)
                          setFormulario({ ...formulario, categoria: "" });
                      }}
                      onFocus={() => {
                        setMostrarCategorias(true);
                        setCreandoCategoria(false);
                      }}
                      placeholder="Buscar o seleccionar categoría..."
                    />

                    {mostrarCategorias && (
                      <>
                        <Pressable
                          style={styles.overlayCerrar}
                          onPress={() => {
                            setMostrarCategorias(false);
                            setCreandoCategoria(false);
                            setBusquedaCategoria(
                              formulario.categoria
                                ? categoriasLista.find(
                                    (c) => c.id === formulario.categoria,
                                  )?.nombre || ""
                                : "",
                            );
                          }}
                        />
                        <View style={styles.cajaOpcionesCategoria}>
                          <ScrollView
                            style={{ maxHeight: 180 }}
                            nestedScrollEnabled={true}
                            keyboardShouldPersistTaps="handled"
                          >
                            {categoriasFiltradas.map((cat) => (
                              <Pressable
                                key={cat.id}
                                style={styles.opcionCategoria}
                                onPress={() => {
                                  setFormulario({
                                    ...formulario,
                                    categoria: cat.id,
                                  });
                                  setBusquedaCategoria(cat.nombre);
                                  setMostrarCategorias(false);
                                  setCreandoCategoria(false);
                                }}
                              >
                                <Text
                                  style={{
                                    fontFamily: "Inter_400Regular",
                                    fontSize: 16,
                                    color: "#333",
                                  }}
                                >
                                  {cat.nombre}
                                </Text>
                              </Pressable>
                            ))}

                            {!creandoCategoria ? (
                              <Pressable
                                style={[
                                  styles.opcionCategoria,
                                  { backgroundColor: "#F9F9F9" },
                                ]}
                                onPress={() => {
                                  setCreandoCategoria(true);
                                  setNuevaCategoriaTexto(busquedaCategoria);
                                }}
                              >
                                <Text
                                  style={{
                                    fontFamily: "Inter_600SemiBold",
                                    fontSize: 16,
                                    color: "#29166F",
                                  }}
                                >
                                  + Añadir nueva categoría
                                </Text>
                              </Pressable>
                            ) : (
                              <View
                                style={[
                                  styles.opcionCategoria,
                                  { backgroundColor: "#F9F9F9" },
                                ]}
                              >
                                <View style={styles.filaNuevaCategoria}>
                                  <TextInput
                                    style={[
                                      styles.inputEdit,
                                      { flex: 1, height: 45 },
                                    ]}
                                    placeholder="Nombre de la categoría"
                                    value={nuevaCategoriaTexto}
                                    onChangeText={setNuevaCategoriaTexto}
                                    autoFocus
                                  />
                                  <Pressable
                                    style={styles.botonGuardarMini}
                                    onPress={guardarNuevaCategoria}
                                  >
                                    <Text
                                      style={{
                                        color: "#FFF",
                                        fontFamily: "Inter_600SemiBold",
                                        fontSize: 14,
                                      }}
                                    >
                                      Guardar
                                    </Text>
                                  </Pressable>
                                </View>
                                <Pressable
                                  onPress={() => setCreandoCategoria(false)}
                                  style={{ marginTop: 10 }}
                                >
                                  <Text
                                    style={{
                                      color: "#DB3632",
                                      fontFamily: "Inter_400Regular",
                                      fontSize: 14,
                                      textAlign: "right",
                                    }}
                                  >
                                    Cancelar
                                  </Text>
                                </Pressable>
                              </View>
                            )}
                          </ScrollView>
                        </View>
                      </>
                    )}
                  </View>

                  <View style={[styles.grupoInputEdit, { zIndex: 1 }]}>
                    <Text style={styles.labelEdit}>Descripción</Text>
                    <TextInput
                      style={[styles.inputEdit, styles.inputAreaEdit]}
                      value={formulario.descripcion}
                      onChangeText={(t) =>
                        setFormulario({ ...formulario, descripcion: t })
                      }
                      multiline={true}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.seccionMedidasEdit}>
                <View style={styles.cabeceraMedidasEdit}>
                  <Text style={styles.subtituloPaginaEdit}>
                    Variantes y Precios
                  </Text>
                  <Pressable
                    style={styles.botonAnadirMedidaEdit}
                    onPress={() =>
                      setFormulario({
                        ...formulario,
                        medidas: [
                          ...formulario.medidas,
                          {
                            id: null,
                            medida: "",
                            precio: "",
                            stock: "",
                            disponible: true,
                          },
                        ],
                      })
                    }
                  >
                    <Text style={styles.textoBotonSecundarioEdit}>
                      + Añadir medida
                    </Text>
                  </Pressable>
                </View>

                <View
                  style={[
                    styles.titulosColumnasMedidasEdit,
                    esMovil && styles.ocultarEnMovil,
                  ]}
                >
                  <Text style={[styles.tituloColumnaEdit, { flex: 2 }]}>
                    Medida
                  </Text>
                  <Text style={[styles.tituloColumnaEdit, { flex: 1 }]}>
                    Precio (€)
                  </Text>
                  <Text style={[styles.tituloColumnaEdit, { flex: 1 }]}>
                    Stock
                  </Text>
                  <View style={styles.espacioBotonXEdit} />
                </View>

                {formulario.medidas.map((item: any, index: number) => (
                  <View
                    key={index}
                    style={[
                      styles.filaMedidaEdit,
                      esMovil && styles.filaMedidaMovilEdit,
                    ]}
                  >
                    <TextInput
                      style={[
                        styles.inputEdit,
                        esMovil ? styles.inputMovilAncho : { flex: 2 },
                      ]}
                      value={item.medida}
                      onChangeText={(t) => {
                        const nm = [...formulario.medidas];
                        nm[index].medida = t;
                        setFormulario({ ...formulario, medidas: nm });
                      }}
                      placeholder="Medida"
                    />
                    <TextInput
                      style={[
                        styles.inputEdit,
                        esMovil ? styles.inputMovilMitad : { flex: 1 },
                      ]}
                      value={item.precio}
                      onChangeText={(t) => {
                        const nm = [...formulario.medidas];
                        nm[index].precio = t;
                        setFormulario({ ...formulario, medidas: nm });
                      }}
                      keyboardType="numeric"
                      placeholder="Precio"
                    />
                    <TextInput
                      style={[
                        styles.inputEdit,
                        esMovil ? styles.inputMovilMitad : { flex: 1 },
                      ]}
                      value={item.stock}
                      onChangeText={(t) => {
                        const nm = [...formulario.medidas];
                        nm[index].stock = t;
                        setFormulario({ ...formulario, medidas: nm });
                      }}
                      keyboardType="numeric"
                      placeholder="Stock"
                    />

                    <View style={styles.filaAccionesVariante}>
                      <Pressable
                        style={[
                          styles.botonDisponible,
                          item.disponible
                            ? styles.botonDisponibleActivo
                            : styles.botonDisponibleInactivo,
                        ]}
                        onPress={() => {
                          const nm = [...formulario.medidas];
                          nm[index].disponible = !nm[index].disponible;
                          setFormulario({ ...formulario, medidas: nm });
                        }}
                      >
                        <Text
                          style={[
                            styles.textoDisponible,
                            item.disponible
                              ? styles.textoDisponibleActivo
                              : styles.textoDisponibleInactivo,
                          ]}
                        >
                          {item.disponible ? "Disponible" : "Agotado"}
                        </Text>
                      </Pressable>

                      <Pressable
                        style={[
                          styles.botonEliminarFilaEdit,
                          formulario.medidas.length === 1 && { opacity: 0.3 },
                        ]}
                        onPress={() => {
                          if (formulario.medidas.length > 1) {
                            const nm = [...formulario.medidas];
                            nm.splice(index, 1);
                            setFormulario({ ...formulario, medidas: nm });
                          }
                        }}
                        disabled={formulario.medidas.length === 1}
                      >
                        <Text style={styles.textoBotonEliminarEdit}>X</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <>
              <View
                style={[styles.layoutGrid, esMovil && styles.layoutGridMovil]}
              >
                <View
                  style={[
                    styles.columnaIzquierda,
                    esMovil && styles.columnaIzquierdaMovil,
                  ]}
                >
                  <Image
                    source={
                      imgError || !articulo.imagen_url
                        ? require("@/assets/images/placeholder.png")
                        : { uri: articulo.imagen_url }
                    }
                    style={styles.imagen}
                    resizeMode="contain"
                    onError={() => setImgError(true)}
                  />
                  {!esMovil && (
                    <Pressable
                      style={styles.botonCarrito}
                      onPress={anadirAlCarrito}
                    >
                      <Text style={styles.textoBotonCarrito}>
                        Añadir a la cesta
                      </Text>
                    </Pressable>
                  )}
                </View>

                <View style={styles.columnaDerecha}>
                  <Text style={styles.titulo}>{articulo.nombre}</Text>

                  <View
                    style={[
                      styles.filaContenidoRow,
                      esMovil && styles.filaContenidoCol,
                    ]}
                  >
                    <View style={styles.cajaDescripcion}>
                      <Text style={styles.descripcion}>
                        {articulo.descripcion}
                      </Text>
                    </View>

                    <View style={styles.cajaCantidad}>
                      <Text style={styles.etiqueta}>Cantidad:</Text>
                      <View style={styles.selectorCantidad}>
                        <Pressable onPress={decrementar}>
                          <Image
                            source={require("@/assets/images/iconoMenos.png")}
                            style={styles.iconoCantidad}
                          />
                        </Pressable>
                        <TextInput
                          style={styles.inputCantidad}
                          value={cantidad}
                          onChangeText={manejarCantidad}
                          keyboardType="numeric"
                        />
                        <Pressable onPress={incrementar}>
                          <Image
                            source={require("@/assets/images/iconoMas.png")}
                            style={styles.iconoCantidad}
                          />
                        </Pressable>
                      </View>
                      <Text style={styles.precio}>
                        {medidaSeleccionada
                          ? `${medidaSeleccionada.precio.toFixed(2).replace(".", ",")} €`
                          : "-- €"}
                      </Text>
                      <Text
                        style={[
                          styles.textoUnitario,
                          esMovil && { marginBottom: 100 },
                        ]}
                      >
                        (Precio unitario)
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cajaMedidas}>
                    <Text style={styles.etiqueta}>Medidas:</Text>
                    <View style={styles.contenedorBotonesMedida}>
                      {medidasVisibles?.length > 0 ? (
                        medidasVisibles.map((med: any) => (
                          <Pressable
                            key={med.id}
                            style={[
                              styles.botonMedida,
                              medidaSeleccionada?.id === med.id &&
                                styles.botonMedidaActivo,
                              !med.disponible && styles.botonMedidaAgotado,
                            ]}
                            onPress={() =>
                              med.disponible && setMedidaSeleccionada(med)
                            }
                          >
                            <Text
                              style={[
                                styles.textoMedida,
                                medidaSeleccionada?.id === med.id &&
                                  styles.textoMedidaActivo,
                                !med.disponible && styles.textoMedidaAgotado,
                              ]}
                            >
                              {med.medida} {!med.disponible && "(Agotado)"}
                            </Text>
                          </Pressable>
                        ))
                      ) : (
                        <Text style={styles.descripcion}>
                          No hay medidas disponibles.
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>

              {esMovil && (
                <Pressable
                  style={[styles.botonCarrito, { marginTop: 30 }]}
                  onPress={anadirAlCarrito}
                >
                  <Text style={styles.textoBotonCarrito}>
                    Añadir a la cesta
                  </Text>
                </Pressable>
              )}
            </>
          )}
        </View>

        {esMovil && esAdmin && (
          <View style={styles.contenedorAccionesMovilAdmin}>
            <Pressable
              style={[
                styles.botonGuardarMovilAdmin,
                guardando && { opacity: 0.7 },
              ]}
              onPress={manejarGuardar}
              disabled={guardando}
            >
              <Text style={styles.textoBotonGuardarCambios}>
                {guardando ? "Guardando..." : "Guardar cambios"}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.botonEliminarMovilAdmin,
                guardando && { opacity: 0.7 },
              ]}
              onPress={() => setModalDescatalogar(true)}
            >
              <Text style={styles.textoBotonGuardarCambios}>
                Descatalogar
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <Modal visible={modalDescatalogar} transparent animationType="fade">
        <View style={styles.fondoModal}>
          <View style={styles.contenedorModalCentrado}>
            <View style={styles.tarjetaBlancaModal}>
              <Text style={styles.tituloModal}>¿Descatalogar artículo?</Text>
              <Text style={{textAlign: 'center', marginBottom: 20, fontFamily: 'Inter_400Regular', fontSize: 16}}>
                El artículo ya no será visible para los clientes. Todas sus variantes pasarán a estar agotadas.
              </Text>
              <View style={{flexDirection: 'row', gap: 15}}>
                <Pressable style={[styles.botonModal, {backgroundColor: '#EEE', flex: 1}]} onPress={() => setModalDescatalogar(false)}>
                  <Text style={[styles.textoBotonModal, {color: '#000'}]}>Cancelar</Text>
                </Pressable>
                <Pressable style={[styles.botonModal, {backgroundColor: '#DB3632', flex: 1}]} onPress={confirmarDescatalogar}>
                  <Text style={styles.textoBotonModal}>Descatalogar</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
  contenedorFondo: { flex: 1, backgroundColor: "#FAFAFA" },
  scrollContenido: { padding: 20, alignItems: "center", paddingBottom: 100 },
  tarjetaPrincipal: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    maxWidth: 1100,
    borderRadius: 12,
    padding: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginTop: 20,
  },
  botonGuardarCambios: {
    backgroundColor: '#29166F',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 150,
  },
  textoBotonGuardarCambios: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  layoutGrid: { flexDirection: "row", gap: 40 },
  layoutGridMovil: { flexDirection: "column", gap: 20 },
  columnaIzquierda: { width: 350, alignItems: "center" },
  columnaIzquierdaMovil: { width: "100%" },
  imagen: { width: "100%", height: 350, marginBottom: 30 },
  imagenEditable: {
    borderWidth: 2,
    borderColor: "#EEEEEE",
    borderStyle: Platform.OS === "web" ? "dashed" : "solid",
    borderRadius: 8,
  },
  botonSecundario: {
    backgroundColor: "#EEEEEE",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    width: "100%",
    alignItems: "center",
    marginTop: -15,
    marginBottom: 20,
  },
  textoBotonSecundario: {
    color: "#333333",
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  botonCarrito: {
    backgroundColor: "#29166F",
    width: "100%",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  textoBotonCarrito: {
    color: "#FFFFFF",
    fontFamily: "Montserrat_700Bold",
    fontSize: 18,
  },
  columnaDerecha: { flex: 1 },
  titulo: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 32,
    color: "#000",
    marginBottom: 20,
    textAlign: "center",
  },
  filaContenidoRow: { flexDirection: "row", gap: 30, marginBottom: 30 },
  filaContenidoCol: { flexDirection: "column-reverse", gap: 20 },
  cajaDescripcion: { flex: 2, paddingRight: 20 },
  descripcion: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    textAlign: "justify",
  },
  cajaCantidad: { flex: 1, alignItems: "center", justifyContent: "flex-start" },
  etiqueta: {
    fontFamily: "Inter_400Regular",
    fontSize: 18,
    color: "#000",
    marginBottom: 15,
  },
  selectorCantidad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginBottom: 20,
  },
  iconoCantidad: { width: 40, height: 40 },
  inputCantidad: {
    borderWidth: 1,
    borderColor: "#29166F",
    borderRadius: 8,
    width: 60,
    height: 40,
    textAlign: "center",
    fontFamily: "Montserrat_700Bold",
    fontSize: 20,
    color: "#DB3632",
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  precio: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 28,
    color: "#DB3632",
    marginTop: 10,
  },
  cajaMedidas: { width: "100%", alignItems: "center" },
  contenedorBotonesMedida: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 15,
  },
  botonMedida: {
    borderWidth: 1,
    borderColor: "#29166F",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#FFF",
  },
  botonMedidaActivo: { backgroundColor: "#29166F" },
  botonMedidaAgotado: { borderColor: "#CCC", backgroundColor: "#F5F5F5" },
  textoMedida: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 20,
    color: "#29166F",
  },
  textoMedidaActivo: { color: "#FFF" },
  textoMedidaAgotado: { color: "#999" },
  textoUnitario: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#666666",
    marginTop: 2,
  },
  contenedorPrincipalEdit: { flexDirection: "row", gap: 40, marginBottom: 40 },
  contenedorPrincipalMovilEdit: { flexDirection: "column" },
  columnaImagenEdit: { flex: 1, alignItems: "center", gap: 15 },
  columnaDatosEdit: { flex: 2, gap: 20 },
  cajaImagenEdit: {
    width: "100%",
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: "#EEEEEE",
    borderStyle: Platform.OS === "web" ? "dashed" : "solid",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    overflow: "hidden",
  },
  imagenPreviaEdit: { width: "100%", height: "100%" },
  botonSubirImagenEdit: {
    backgroundColor: "#EEEEEE",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    width: "100%",
    alignItems: "center",
  },
  textoBotonSecundarioEdit: {
    color: "#333333",
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  grupoInputEdit: { width: "100%" },
  labelEdit: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#000000",
    marginBottom: 8,
  },
  inputEdit: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 6,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    backgroundColor: "#FFFFFF",
    color: "#000000",
  },
  inputAreaEdit: { height: 120, textAlignVertical: "top" },
  subtituloPaginaEdit: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 22,
    color: "#000000",
  },
  seccionMedidasEdit: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    paddingTop: 30,
  },
  cabeceraMedidasEdit: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    gap: 15,
  },
  titulosColumnasMedidasEdit: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  tituloColumnaEdit: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#666666",
  },
  espacioBotonXEdit: { width: 40 },
  filaMedidaEdit: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 15,
    alignItems: "center",
  },
  filaMedidaMovilEdit: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#F9F9F9",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  inputMovilAncho: { width: "100%" },
  inputMovilMitad: { width: "47%" },
  ocultarEnMovil: { display: "none" },
  filaAccionesVariante: { flexDirection: "row", alignItems: "center", gap: 10 },
  botonDisponible: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    height: 48,
  },
  botonDisponibleActivo: { backgroundColor: "#E8F5E9", borderColor: "#4CAF50" },
  botonDisponibleInactivo: {
    backgroundColor: "#FFEEED",
    borderColor: "#DB3632",
  },
  textoDisponible: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  textoDisponibleActivo: { color: "#4CAF50" },
  textoDisponibleInactivo: { color: "#DB3632" },
  botonEliminarFilaEdit: {
    width: 40,
    height: 48,
    backgroundColor: "#FFEEED",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FFD3D1",
  },
  textoBotonEliminarEdit: {
    color: "#DB3632",
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  botonAnadirMedidaEdit: {
    backgroundColor: "#EEEEEE",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
  },
  overlayCerrar: {
    position: Platform.OS === "web" ? "fixed" : "absolute",
    top: Platform.OS === "web" ? 0 : -2000,
    bottom: Platform.OS === "web" ? 0 : -2000,
    left: Platform.OS === "web" ? 0 : -2000,
    right: Platform.OS === "web" ? 0 : -2000,
    zIndex: 100,
    backgroundColor: "transparent",
    cursor: "default",
  } as any,
  cajaOpcionesCategoria: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderTopWidth: 0,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    position: "absolute",
    top: 75,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  opcionCategoria: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  filaNuevaCategoria: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    alignItems: "center",
  },
  botonGuardarMini: {
    backgroundColor: "#29166F",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 6,
    justifyContent: "center",
  },
  contenedorAccionesMovilAdmin: {
    flexDirection: "column",
    width: "100%",
    marginTop: 20,
    gap: 15,
  },
  botonGuardarMovilAdmin: {
    backgroundColor: "#29166F",
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: "center",
    width: "100%",
  },
  botonEliminarMovilAdmin: {
    backgroundColor: "#DB3632",
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: "center",
    width: "100%",
  },
  fondoModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contenedorModalCentrado: {
    width: '100%',
    maxWidth: 400,
    padding: 20,
  },
  tarjetaBlancaModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 30,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  tituloModal: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#29166F',
    textAlign: 'center',
    marginBottom: 15,
  },
  botonModal: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBotonModal: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#FFF',
  }
});