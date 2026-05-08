import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import Head from "expo-router/head";

export default function AvisoLegalPage() {
  const { width } = useWindowDimensions();
  const esMovil = width < 768;

  return (
    <ScrollView
      style={styles.contenedor}
      contentContainerStyle={styles.contenido}
    >
      <Head>
        <title>Aviso Legal | Domitex</title>
      </Head>
      <View style={[styles.tarjeta, { maxWidth: esMovil ? "100%" : 900 }]}>
        <Text style={styles.titulo}>AVISO LEGAL</Text>

        <Text style={styles.subtitulo}>1. DATOS IDENTIFICATIVOS</Text>
        <Text style={styles.texto}>
          En cumplimiento con el deber de información recogido en artículo 10 de
          la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la
          Información y del Comercio Electrónico, se reflejan los siguientes
          datos:
        </Text>
        <Text style={styles.texto}>
          • <Text style={styles.negrita}>Titular:</Text> Domitex Hogar S.L.
          {"\n"}• <Text style={styles.negrita}>Dirección:</Text> Calle
          Emprendedores Nº20, 24, 17, 41749 El Cuervo de Sevilla (Sevilla){"\n"}
          • <Text style={styles.negrita}>Email:</Text> domitex@hotmail.es | domitexhogar@gmail.com{"\n"}•{" "}
          <Text style={styles.negrita}>Teléfono:</Text> 955 97 97 99
        </Text>

        <Text style={styles.subtitulo}>2. PROPIEDAD INTELECTUAL</Text>
        <Text style={styles.texto}>
          Domitex Hogar S.L. es titular de todos los derechos de propiedad
          intelectual e industrial de su página web y aplicación, así como de
          los elementos contenidos en la misma (imágenes, logotipos,
          combinaciones de colores, estructura y diseño).
        </Text>

        <Text style={styles.subtitulo}>3. EXCLUSIÓN DE RESPONSABILIDAD</Text>
        <Text style={styles.texto}>
          Domitex no se hace responsable de los daños y perjuicios que pudieran
          ocasionar errores u omisiones en los contenidos, o la falta de
          disponibilidad del portal por mantenimientos técnicos.
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
