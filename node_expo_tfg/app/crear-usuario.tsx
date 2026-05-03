import { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "./auth-context";
import { AlertaContext } from "./alerta-context";

export default function CrearUsuarioPage() {
  const { width } = useWindowDimensions();
  const esMovil = width < 768;
  const router = useRouter();
  const auth = useContext(AuthContext);
  const alerta = useContext(AlertaContext);

  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [repetirContrasena, setRepetirContrasena] = useState("");
  
  const [rol, setRol] = useState("");
  const [busquedaRol, setBusquedaRol] = useState("");
  const [mostrarRoles, setMostrarRoles] = useState(false);
  const [cargando, setCargando] = useState(false);

  const rolesDisponibles = ["Cliente", "Admin", "Empleado"];

  const rolesFiltrados = rolesDisponibles.filter(r => 
    r.toLowerCase().includes(busquedaRol.toLowerCase())
  );

  const manejarCrearUsuario = async () => {
    if (!nombre || !apellidos || !correo || !telefono || !contrasena || !rol) {
      alerta?.mostrarAlerta("Error", "Por favor, rellena todos los campos.");
      return;
    }

    if (contrasena !== repetirContrasena) {
      alerta?.mostrarAlerta("Error", "Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);

    try {
      const urlApi = Platform.OS === "web" 
        ? "http://localhost:8000/admin/usuarios" 
        : "http://192.168.1.43:8000/admin/usuarios";

      const respuesta = await fetch(urlApi, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${auth?.usuario?.token}`
        },
        body: JSON.stringify({
          nombre,
          apellidos,
          correo,
          telefono,
          contrasena,
          rol
        })
      });

      const datos = await respuesta.json();

      if (respuesta.ok) {
        alerta?.mostrarAlerta("Éxito", "Usuario creado correctamente.");
        router.back();
      } else {
        alerta?.mostrarAlerta("Error", datos.detail || "No se pudo crear el usuario.");
      }
    } catch (error) {
      alerta?.mostrarAlerta("Error", "Problema de conexión con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={styles.contenedorFondo}>
      <ScrollView contentContainerStyle={styles.scrollContenido} keyboardShouldPersistTaps="handled">
        <View style={styles.contenedorFormulario}>
          
          <Text style={styles.tituloPagina}>Crear nuevo usuario</Text>

          <View style={styles.filaInputs}>
            <View style={[styles.grupoInput, { flex: 1 }]}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput style={styles.input} value={nombre} onChangeText={setNombre} />
            </View>
            <View style={[styles.grupoInput, { flex: 1 }]}>
              <Text style={styles.label}>Apellidos</Text>
              <TextInput style={styles.input} value={apellidos} onChangeText={setApellidos} />
            </View>
          </View>

          <View style={styles.grupoInput}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput style={styles.input} value={correo} onChangeText={setCorreo} keyboardType="email-address" autoCapitalize="none" />
          </View>

          <View style={styles.grupoInput}>
            <Text style={styles.label}>Teléfono</Text>
            <TextInput style={styles.input} value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
          </View>

          <View style={[styles.grupoInput, { zIndex: 10 }]}>
            <Text style={styles.label}>Rol de usuario</Text>
            <TextInput 
              style={[styles.input, mostrarRoles && { zIndex: 101, position: 'relative' }]} 
              value={busquedaRol} 
              onChangeText={(text) => {
                setBusquedaRol(text);
                setMostrarRoles(true);
                if (rol) setRol("");
              }}
              onFocus={() => setMostrarRoles(true)}
              placeholder="Buscar o seleccionar rol..."
              placeholderTextColor="#999"
            />

            {mostrarRoles && (
              <>
                <Pressable 
                  style={styles.overlayCerrar} 
                  onPress={() => {
                    setMostrarRoles(false);
                    setBusquedaRol(rol || "");
                  }}
                />
                <View style={styles.cajaOpciones}>
                  <ScrollView style={{maxHeight: 180}} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                    {rolesFiltrados.map(r => (
                      <Pressable 
                        key={r} 
                        style={styles.opcion} 
                        onPress={() => { 
                          setRol(r); 
                          setBusquedaRol(r);
                          setMostrarRoles(false); 
                        }}
                      >
                        <Text style={styles.textoOpcion}>{r}</Text>
                      </Pressable>
                    ))}
                    {rolesFiltrados.length === 0 && (
                      <View style={styles.opcion}>
                        <Text style={[styles.textoOpcion, {color: '#999'}]}>No se encontraron roles</Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              </>
            )}
          </View>

          <View style={styles.filaInputs}>
            <View style={[styles.grupoInput, { flex: 1 }]}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput style={styles.input} value={contrasena} onChangeText={setContrasena} secureTextEntry />
            </View>
            <View style={[styles.grupoInput, { flex: 1 }]}>
              <Text style={styles.label}>Repetir Contraseña</Text>
              <TextInput style={styles.input} value={repetirContrasena} onChangeText={setRepetirContrasena} secureTextEntry />
            </View>
          </View>

          <View style={styles.contenedorAcciones}>
            <Pressable style={styles.botonCancelar} onPress={() => router.back()} disabled={cargando}>
              <Text style={styles.textoBotonSecundario}>Cancelar</Text>
            </Pressable>
            <Pressable style={[styles.botonGuardar, cargando && { opacity: 0.7 }]} onPress={manejarCrearUsuario} disabled={cargando}>
              {cargando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.textoBotonGuardar}>Crear Usuario</Text>}
            </Pressable>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedorFondo: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  scrollContenido: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    paddingBottom: 80,
  },
  contenedorFormulario: {
    width: "100%",
    maxWidth: 800,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  tituloPagina: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 32,
    color: "#29166F",
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    paddingBottom: 15,
  },
  filaInputs: {
    flexDirection: "row",
    gap: 20,
    width: "100%",
  },
  grupoInput: {
    width: "100%",
    marginBottom: 20,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#000000",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#29166F",
    borderRadius: 6,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    backgroundColor: "#FFFFFF",
    color: "#000000",
  },
  overlayCerrar: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    top: Platform.OS === 'web' ? 0 : -2000,
    bottom: Platform.OS === 'web' ? 0 : -2000,
    left: Platform.OS === 'web' ? 0 : -2000,
    right: Platform.OS === 'web' ? 0 : -2000,
    zIndex: 100,
    backgroundColor: 'transparent',
    cursor: 'default',
  } as any,
  cajaOpciones: {
    borderWidth: 1,
    borderColor: "#29166F",
    borderTopWidth: 0,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    backgroundColor: "#FFFFFF",
    position: "absolute",
    top: 75,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 5,
  },
  opcion: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  textoOpcion: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#333",
  },
  contenedorAcciones: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 15,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    paddingTop: 30,
  },
  botonCancelar: {
    backgroundColor: "#EEEEEE",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 6,
  },
  textoBotonSecundario: {
    color: "#333333",
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  botonGuardar: {
    backgroundColor: "#29166F",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 6,
    minWidth: 150,
    alignItems: "center",
  },
  textoBotonGuardar: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  }
});