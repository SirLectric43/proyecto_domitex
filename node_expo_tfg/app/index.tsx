import { Text, View, Image, StyleSheet, ImageBackground, Pressable, useWindowDimensions } from "react-native";
import { Link } from "expo-router";

export default function LandingPage() {
  const { width } = useWindowDimensions();
  const esMovil = width < 768;

  return (
    <View style={styles.contenedor}>
      <ImageBackground source={require('@/assets/images/bannerLanding.png')} style={styles.contenedorImagen} resizeMode="cover">
        <View style={styles.capaSuperpuesta}>
          <Text style={[styles.titulo, esMovil && { fontSize: 36, lineHeight: 40, marginTop: 10 }]}>
            Domitex: Vistiendo tu hogar con elegancia
          </Text>
          
          <Text style={[styles.subtitulo, esMovil && { fontSize: 18, lineHeight: 24, marginTop: 20 }]}>
            La calidad textil de siempre, ahora a un solo clic. Haz tus pedidos de forma rápida y eficaz.
          </Text>
          
          <Link href="/catalogo" asChild>
            <Pressable style={esMovil ? styles.botonMovil : styles.boton}>
              <Text style={[styles.textoBoton, esMovil && { fontSize: 18 }]}>Explorar Catálogo</Text>
            </Pressable>
          </Link>
        </View>
      </ImageBackground>

      <View style={styles.seccionPropuesta}>
        <Text style={[styles.tituloSeccion, esMovil && { fontSize: 28, marginBottom: 40 }]}>
          Nuestra Propuesta de Valor
        </Text>

        <View style={[styles.contenedorTarjetas, { flexDirection: esMovil ? 'column' : 'row'}]}>
          <View style={[styles.tarjeta, esMovil && { marginLeft: 0, marginRight: 0 }]}>
            <Image source={require('@/assets/images/iconoMovil.png')} style={styles.iconoTarjeta} />
            <Text style={[styles.tituloTarjeta, esMovil && { fontSize: 24 }]}>Catálogo Digital</Text>
            <Text style={[styles.textoTarjeta, esMovil && { fontSize: 16 }]}>Mira al completo nuestro catálogo de artículos textil y hogar cómodamente desde cualquier lugar.</Text>
          </View>
          
          <View style={[styles.tarjeta, esMovil && { marginLeft: 0, marginRight: 0 }]}>
            <Image source={require('@/assets/images/iconoGestion.png')} style={styles.iconoTarjeta} />
            <Text style={[styles.tituloTarjeta, esMovil && { fontSize: 24 }]}>Gestión Eficiente</Text>
            <Text style={[styles.textoTarjeta, esMovil && { fontSize: 16 }]}>Lleva el seguimiento de tus pedidos viendo como se van actualizando en tiempo real.</Text>
          </View>
          
          <View style={[styles.tarjeta, esMovil && { marginLeft: 0, marginRight: 0 }]}>
            <Image source={require('@/assets/images/iconoCamion.png')} style={styles.iconoTarjeta} />
            <Text style={[styles.tituloTarjeta, esMovil && { fontSize: 24 }]}>Envío o Recogida</Text>
            <Text style={[styles.textoTarjeta, esMovil && { fontSize: 16 }]}>Elige entre una de las opciones de entrega de las que disponemos, envío o recogida en tienda.</Text>
          </View>
        </View>
      </View>

      <View style={styles.seccionQuienesSomos} id="quienes-somos">
        <Text style={[styles.tituloQuienesSomos, esMovil && { fontSize: 28 }]}>
          ¿Quiénes somos?
        </Text>
        
        <View style={styles.contenedorTextoQuienes}>
          <Text style={[styles.parrafoQuienes, esMovil && { fontSize: 16, lineHeight: 24 }]}>
            En Domitex, nuestra historia se escribe entre hilos y tejidos desde 1996. Fundada para ofrecer la mejor calidad textil a nuestros clientes, la empresa nació recorriendo los mercadillos y repartiendo mercancía por los rincones de casi toda Andalucía. Con el paso de los años, aquel esfuerzo inicial se transformó en la solidez de nuestro almacén central y la cercanía de nuestras dos tiendas físicas ubicadas en Arcos de la Frontera y Villamartín.
          </Text>
          
          <Text style={[styles.parrafoQuienes, esMovil && { fontSize: 16, lineHeight: 24 }]}>
            Durante tres décadas, nos hemos especializado en ofrecer todo lo necesario para vestir tu hogar con la mejor calidad textil: desde la suavidad de nuestras toallas y albornoces, hasta el confort de nuestros colchones, almohadas, sábanas y mantas, sin olvidar los detalles que dan vida a cada estancia, como cortinas, alfombras y cojines.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1
  },
  contenedorImagen: {
    flex: 1,
    width: '100%',
    height: 498,
  },
  capaSuperpuesta: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  titulo: {
    fontSize: 64,
    lineHeight: 64,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 30,
    maxWidth: 800,
  },
  subtitulo: {
    fontSize: 36,
    lineHeight: 34,
    fontFamily: 'Montserrat_300Light',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 50,
    maxWidth: 920,
  },
  boton: {
    backgroundColor: '#DB3632',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 80,
    justifyContent: 'center', 
    alignItems: 'center',
    overflow: 'hidden',
  },
  botonMovil: {
    backgroundColor: '#DB3632',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 40,
    justifyContent: 'center', 
    alignItems: 'center',
    overflow: 'hidden',
  },
  textoBoton: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    textAlign: 'center',
  },
  seccionPropuesta: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 80,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  tituloSeccion: {
    fontSize: 36,
    fontFamily: 'Inter_600SemiBold',
    color: '#000000',
    marginBottom: 60,
    textAlign: 'center',
  },
  contenedorTarjetas: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 40,
    width: '100%',
  },
  tarjeta: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
    marginLeft: 100,
    marginRight: 100,
  },
  iconoTarjeta: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  tituloTarjeta: {
    fontSize: 36,
    fontFamily: 'Inter_600SemiBold',
    color: '#000000',
    marginBottom: 10,
    textAlign: 'center',
  },
  textoTarjeta: {
    fontSize: 22,
    fontFamily: 'Inter_400Regular',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 24,
  },
  seccionQuienesSomos: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 80,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  tituloQuienesSomos: {
    fontSize: 36,
    fontFamily: 'Inter_600SemiBold',
    color: '#000000',
    marginBottom: 40,
    textAlign: 'center',
  },
  contenedorTextoQuienes: {
    width: '100%',
    maxWidth: 1400,
  },
  parrafoQuienes: {
    fontSize: 22,
    fontFamily: 'Inter_400Regular',
    color: '#000000',
    lineHeight: 26,
    marginBottom: 20,
    textAlign: 'justify',
  },
});