import { Text, View, StyleSheet, Image, Pressable } from "react-native";
import { Link } from "expo-router";

export default function NavbarPublico() {
    
    return (
        <View style={styles.contenedor}>
            <Image source={require('@/assets/images/navbarDomitex.png')}/>
            <View style={styles.contenedorLinks}>
                <Link href="/catalogo" style={styles.link}>Catálogo</Link>
                <Link href="/#quienes-somos" style={styles.link}>Quiénes somos</Link>
                <Link href="/#contacto" style={styles.link}>Contacto</Link>
            </View>
            <View style={styles.contenedorBotones}>
                <Pressable style={styles.botonLogin}>Inicio de Sesión</Pressable>
                <Pressable style={styles.botonRegistro}>Registrarse</Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
  contenedor: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  contenedorLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 50
  },
  contenedorBotones: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 40,
  },
  link: {
    fontSize: 24,
    color: '#000000',
    fontFamily: 'Inter_400Regular',
    fontWeight: '500',
    paddingLeft: 50,
    paddingRight: 50
  },
  botonLogin: {
    backgroundColor: '#FFFFFF',
    color: '#29166F',
    borderColor: '#29166F',
    borderWidth: 2,
    fontFamily: 'Inter_700Bold',
    fontWeight: 'bold',
    paddingHorizontal: 15,
    fontSize: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  botonRegistro: {
    backgroundColor: '#29166F',
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    fontWeight: 'bold',
    paddingHorizontal: 15,
    borderColor: '#29166F',
    borderWidth: 2,
    paddingVertical: 8,
    borderRadius: 6,
  },
});