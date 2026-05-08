import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import Head from "expo-router/head";

export default function PrivacidadPage() {
  const { width } = useWindowDimensions();
  const esMovil = width < 768;

  return (
    <ScrollView
      style={styles.contenedor}
      contentContainerStyle={styles.contenido}
    >
      <Head>
        <title>Privacidad y Cookies | Domitex</title>
      </Head>
      <View style={[styles.tarjeta, { maxWidth: esMovil ? "100%" : 900 }]}>
        <Text style={styles.titulo}>POLÍTICA DE PRIVACIDAD</Text>

        <Text style={styles.subtitulo}>1. RESPONSABLE DEL TRATAMIENTO</Text>
        <Text style={styles.texto}>
          Domitex Hogar S.L., con domicilio en Calle Emprendedores Nº20, 24, 17,
          es el responsable del tratamiento de sus datos personales recogidos a
          través de esta plataforma.
        </Text>

        <Text style={styles.subtitulo}>2. FINALIDAD Y LEGITIMACIÓN</Text>
        <Text style={styles.texto}>
          Tratamos sus datos para gestionar el registro de usuario, procesar sus
          pedidos y, en caso de que nos lo autorice, enviarle promociones. La
          base legal es la ejecución del contrato de compraventa y su
          consentimiento expreso.
        </Text>

        <Text style={styles.subtitulo}>3. POLÍTICA DE COOKIES</Text>
        <Text style={styles.texto}>
          Nuestra web utiliza cookies técnicas necesarias para mantener su
          sesión activa y gestionar su carrito de compra. No utilizamos cookies
          de rastreo invasivas sin su consentimiento previo.
        </Text>

        <Text style={styles.subtitulo}>4. SUS DERECHOS</Text>
        <Text style={styles.texto}>
          Puede ejercer sus derechos de acceso, rectificación, supresión y
          portabilidad enviando un correo a{" "}
          <Text style={styles.negrita}>domitexhogar@gmail.com | domitex@hotmail.es</Text>.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: "#FAFAFA" },
  contenido: { padding: 20, alignItems: "center", paddingVertical: 50 },
  tarjeta: {
    backgroundColor: "#FFF",
    padding: 30,
    borderRadius: 12,
    elevation: 3,
    width: "100%",
  },
  titulo: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 32,
    color: "#29166F",
    marginBottom: 30,
    textAlign: "center",
  },
  subtitulo: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: "#29166F",
    marginTop: 25,
    marginBottom: 10,
  },
  texto: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    marginBottom: 10,
    textAlign: "justify",
  },
  negrita: { fontFamily: "Inter_700Bold" },
});
