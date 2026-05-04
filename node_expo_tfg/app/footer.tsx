import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';

export default function Footer() {
  const { width } = useWindowDimensions();
  const esMovil = width < 768;

  return (
    <View style={styles.footerContainer} id="contacto">
      <View style={styles.logoContainer}>
        <Image 
          source={require('@/assets/images/logoBlancoDomitex.png')} 
          style={[styles.logo, esMovil && { width: 250, height: 60 }]} 
          resizeMode="contain" 
        />
      </View>
      <View style={[styles.columnasContainer, esMovil && { flexDirection: 'column', gap: 60 }]}>
        <View style={[styles.columnaIzquierda, esMovil && { alignItems: 'center' }]}>
          <Text style={[styles.tituloColumna, esMovil && { fontSize: 24, textAlign: 'center' }]}>Identidad y Contacto</Text>
          <Text style={[styles.textoGeneral, esMovil && { fontSize: 16, textAlign: 'center' }]}>Tradición textil en tu hogar, ahora con gestión digital.</Text>
          
          <Text style={[styles.subtituloColumna, esMovil && { fontSize: 20, textAlign: 'center' }]}>Dirección</Text>
          <Text style={[styles.textoGeneral, esMovil && { fontSize: 16, textAlign: 'center' }]}>Calle Emprendedores Nº20, 24, 17</Text>
          <Text style={[styles.textoGeneral, esMovil && { fontSize: 16, textAlign: 'center' }]}>El Cuervo de Sevilla - 41749 - Sevilla</Text>
          
          <Text style={[styles.subtituloColumna, esMovil && { fontSize: 20, textAlign: 'center' }]}>Email</Text>
          <Text style={[styles.textoGeneral, esMovil && { fontSize: 16, textAlign: 'center' }]}>domitex@hotmail.es</Text>
          <Text style={[styles.textoGeneral, esMovil && { fontSize: 16, textAlign: 'center' }]}>domitexhogar@gmail.com</Text>
          
          <Text style={[styles.subtituloColumna, esMovil && { fontSize: 20, textAlign: 'center' }]}>Teléfono</Text>
          <Text style={[styles.textoGeneral, esMovil && { fontSize: 16, textAlign: 'center' }]}>641 00 84 00</Text>
          <Text style={[styles.textoGeneral, esMovil && { fontSize: 16, textAlign: 'center' }]}>955 97 97 99</Text>
        </View>

        <View style={[styles.columnaCentralDerecha, esMovil && { alignItems: 'center' }]}>
          <Text style={[styles.tituloColumna, esMovil && { fontSize: 24, marginTop: 60, textAlign: 'center' }]}>Clientes</Text>
          <View style={[styles.contenedorLinks, esMovil && { alignItems: 'center' }]}>
            <Link href="/catalogo" style={[styles.linkFooter, esMovil && { fontSize: 16, textAlign: 'center' }]}>Explorar catálogo</Link>
            <Link href="/perfil-usuario" style={[styles.linkFooter, esMovil && { fontSize: 16, textAlign: 'center' }]}>Mi cuenta</Link>
            <Link href="/historial-compra" style={[styles.linkFooter, esMovil && { fontSize: 16, textAlign: 'center' }]}>Mis pedidos</Link>
            <Text style={[styles.linkFooter, esMovil && { fontSize: 16, textAlign: 'center' }]}>Preguntas Frecuentes (FAQ)</Text>
          </View>
        </View>

        <View style={[styles.columnaCentralDerecha, esMovil && { alignItems: 'center' }]}>
          <Text style={[styles.tituloColumna, esMovil && { fontSize: 24, textAlign: 'center' }]}>Legal y Soporte</Text>
          <View style={[styles.contenedorLinks, esMovil && { alignItems: 'center' }]}>
            <Text style={[styles.linkFooter, esMovil && { fontSize: 16, textAlign: 'center' }]}>Términos y Condiciones{"\n"}de Venta</Text>
            <Text style={[styles.linkFooter, esMovil && { fontSize: 16, textAlign: 'center' }]}>Política de Privacidad y{"\n"}Cookies</Text>
            <Text style={[styles.linkFooter, esMovil && { fontSize: 16, textAlign: 'center' }]}>Aviso Legal</Text>
            <Text style={[styles.linkFooter, esMovil && { fontSize: 16, textAlign: 'center' }]}>Soporte Técnico</Text>
          </View>
        </View>

      </View>
      <View style={styles.lineaDivisoria} />
      <View style={styles.bottomContainer}>
        <Text style={[styles.textoCopyright, esMovil && { fontSize: 16 }]}>Copyright©2026 Domitex</Text>
        
        <View style={[styles.metodosPago, esMovil && { flexWrap: 'wrap' }]}>
          <Image source={require('@/assets/images/visa.png')} style={styles.iconoPago} />
          <Image source={require('@/assets/images/mastercard.png')} style={styles.iconoPago} />
          <Image source={require('@/assets/images/maestro.png')} style={styles.iconoPago} />
          <Image source={require('@/assets/images/amex.png')} style={styles.iconoPago} />
          <Image source={require('@/assets/images/unionpay.png')} style={styles.iconoPago} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    backgroundColor: '#29166F',
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logo: {
    width: 454,
    height: 112,
  },
  columnasContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 1500,
    gap: 40,
  },
  columnaIzquierda: {
    flex: 1,
    alignItems: 'flex-start',
  },
  columnaCentralDerecha: {
    flex: 1,
    alignItems: 'flex-start',
  },
  tituloColumna: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat_700Bold',
    fontSize: 32,
    marginBottom: 20,
    textAlign: 'left',
  },
  subtituloColumna: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat_700Bold',
    fontSize: 24,
    marginTop: 15,
    marginBottom: 5,
    textAlign: 'left', 
  },
  textoGeneral: {
    color: '#FFFFFF',
    fontFamily: 'Inter_400Regular',
    fontSize: 20,
    lineHeight: 22,
    marginBottom: 2,
    textAlign: 'left', 
  },
  contenedorLinks: {
    alignItems: 'flex-start',
    gap: 25,
  },
  linkFooter: {
    color: '#FFFFFF',
    fontFamily: 'Inter_400Regular',
    fontSize: 20,
    textAlign: 'left',
  },
  lineaDivisoria: {
    width: '100%',
    maxWidth: 1700,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginVertical: 30,
  },
  bottomContainer: {
    alignItems: 'center',
    gap: 20,
  },
  textoCopyright: {
    color: '#FFFFFF',
    fontFamily: 'Inter_400Regular',
    fontSize: 20,
  },
  metodosPago: {
    flexDirection: 'row',
    gap: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoPago: {
    width: 50,
    height: 30,
    resizeMode: 'contain',
  }
});