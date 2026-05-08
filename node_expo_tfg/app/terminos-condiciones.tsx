import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import Head from "expo-router/head";

export default function TerminosPage() {
  const { width } = useWindowDimensions();
  const esMovil = width < 768;

  return (
    <ScrollView
      style={styles.contenedor}
      contentContainerStyle={styles.contenido}
    >
      <Head>
        <title>Términos de Venta | Domitex</title>
      </Head>
      <View style={[styles.tarjeta, { maxWidth: esMovil ? "100%" : 900 }]}>
        <Text style={styles.titulo}>TÉRMINOS Y CONDICIONES</Text>

        <Text style={styles.subtitulo}>1. PROCESO DE COMPRA</Text>
        <Text style={styles.texto}>
          Para adquirir productos en Domitex, el usuario debe estar registrado.
          Cada pedido genera una referencia única y un albarán descargable en
          formato PDF.
        </Text>

        <Text style={styles.subtitulo}>2. PRECIOS E IMPUESTOS</Text>
        <Text style={styles.texto}>
          Todos los precios mostrados incluyen el IVA vigente del 21%. Los
          gastos de envío se detallarán antes de confirmar el pago final.
        </Text>

        <Text style={styles.subtitulo}>3. DERECHO DE DESISTIMIENTO</Text>
        <Text style={styles.texto}>
          El cliente dispone de 14 días naturales para devolver un producto
          desde su recepción, siempre que se encuentre en su embalaje original y
          sin signos de uso.
        </Text>

        <Text style={styles.subtitulo}>4. GARANTÍA</Text>
        <Text style={styles.texto}>
          Ofrecemos una garantía legal de 3 años para todos nuestros textiles
          frente a defectos de fabricación.
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
