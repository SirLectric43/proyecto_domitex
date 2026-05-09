import { useState } from 'react';
import { View, StyleSheet, Image, Pressable, Text, useWindowDimensions, Platform } from "react-native";
import { Link } from "expo-router";

export default function NavbarPublico() {
    const { width } = useWindowDimensions();
    const esMovil = width < 768;
    
    const [menuAbierto, setMenuAbierto] = useState(false);

    const manejarScroll = (id: any) => {
        setMenuAbierto(false);
        if (Platform.OS === 'web') {
            setTimeout(() => {
                document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    };

    return (
        <View style={{ zIndex: 999 }}>
            <View style={styles.contenedor}>
                <Link href="/" asChild>
                  <Image 
                    source={require('@/assets/images/navbarDomitex.png')} 
                    style={esMovil ? styles.logoMovil : styles.logoPc}
                    resizeMode="contain"
                  />
                </Link>
                
                {!esMovil ? (
                    <>
                        <View style={styles.contenedorLinks}>
                            <Link href="/catalogo" style={styles.link}>Catálogo</Link>
                            <Link href="/#quienes-somos" style={styles.link} onPress={() => manejarScroll('quienes-somos')}>
                                Quiénes somos
                            </Link>
                            <Link href="/#contacto" style={styles.link} onPress={() => manejarScroll('contacto')}>
                                Contacto
                            </Link>
                        </View>
                        <View style={styles.contenedorBotones}>
                            <Link href="/login" asChild>
                                <Pressable style={styles.botonLogin}>
                                    <Text style={styles.textoBotonLogin}>Inicio de Sesión</Text>
                                </Pressable>
                            </Link>
                            <Link href="/registro" asChild>
                                <Pressable style={styles.botonRegistro}>
                                    <Text style={styles.textoBotonRegistro}>Registrarse</Text>
                                </Pressable>
                            </Link>
                        </View>
                    </>
                ) : (
                    <Pressable onPress={() => setMenuAbierto(!menuAbierto)}>
                        <Image source={require('@/assets/images/iconoMenu.png')} style={styles.iconoMenu} />
                    </Pressable>
                )}
            </View>

            {esMovil && menuAbierto && (
                <>
                    <Pressable style={styles.overlayCerrar} onPress={() => setMenuAbierto(false)} />
                    <View style={styles.desplegable}>
                        <View style={styles.contenedorBotonesMovil}>
                            <Link href="/login" asChild>
                                <Pressable style={styles.botonLoginMovil}>
                                    <Text style={styles.textoBotonLogin}>Iniciar Sesión</Text>
                                </Pressable>
                            </Link>
                            <Link href="/registro" asChild>
                                <Pressable style={styles.botonRegistroMovil}>
                                    <Text style={styles.textoBotonRegistro}>Registrarse</Text>
                                </Pressable>
                            </Link>
                        </View>
                    </View>
                </>
            )}
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
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
    width: '100%',
  },
  contenedorLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 30
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
    paddingLeft: 20,
    paddingRight: 20
  },
  botonLogin: {
    backgroundColor: '#FFFFFF',
    borderColor: '#29166F',
    borderWidth: 2,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoBotonLogin: {
    color: '#29166F',
    fontFamily: 'Inter_700Bold',
    fontWeight: 'bold',
    fontSize: 20,
  },
  botonRegistro: {
    backgroundColor: '#29166F',
    borderColor: '#29166F',
    borderWidth: 2,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoBotonRegistro: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontWeight: 'bold',
    fontSize: 20,
  },
  logoMovil: {
    width: 200,
    height: 50,
  },
  iconoMenu: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  overlayCerrar: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    top: -2000,
    bottom: -2000,
    left: -2000,
    right: -2000,
    zIndex: 900,
  } as any,
  desplegable: {
    position: 'absolute',
    top: 82,
    right: 20,
    backgroundColor: '#FFFFFF',
    width: 250,
    borderColor: '#29166F',
    borderWidth: 2,
    borderBottomWidth: 0,
    zIndex: 1000,
  },
  itemDesplegable: {
    paddingVertical: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#29166F',
    alignItems: 'center',
  },
  textoItem: {
    fontSize: 20,
    color: '#000000',
    fontFamily: 'Inter_400Regular',
  },
  contenedorBotonesMovil: {
    padding: 20,
    gap: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#29166F',
  },
  botonLoginMovil: {
    backgroundColor: '#FFFFFF',
    borderColor: '#29166F',
    borderWidth: 2,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  botonRegistroMovil: {
    backgroundColor: '#29166F',
    borderColor: '#29166F',
    borderWidth: 2,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  logoPc: {
    width: 250, 
    height: 60,
    flexShrink: 0,
  },
});