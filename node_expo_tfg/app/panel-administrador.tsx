import React, { useContext } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { AuthContext } from './auth-context';

export default function PanelAdmin() {
  const { width } = useWindowDimensions();
  const esMovil = width < 768;
  const router = useRouter();
  const auth = useContext(AuthContext);

  const opciones = [
    { 
      id: 'catalogo', 
      titulo: 'Gestionar catálogo', 
      icono: require('@/assets/images/gestionCatalogo.png'),
      ruta: '/catalogo'
    },
    { 
      id: 'usuarios', 
      titulo: 'Gestionar usuarios', 
      icono: require('@/assets/images/gestionUsuarios.png'), 
      ruta: '/gestion-usuarios'
    },
    { 
      id: 'pedidos', 
      titulo: 'Gestionar pedidos', 
      icono: require('@/assets/images/validarPedidos.png'),
      ruta: '/gestion-pedidos' 
    }
  ];

  const opcionesFiltradas = auth?.usuario?.rol === 'empleado' 
    ? opciones.filter(o => o.id === 'pedidos') 
    : opciones;

  return (
    <View style={styles.contenedorFondo}>
      <ScrollView contentContainerStyle={styles.scrollContenido}>
        <Head>
            <title>Panel de administrador | Domitex</title>
        </Head>
        <View style={styles.contenedorTarjetas}>
          
          {opcionesFiltradas.map((opcion) => (
            <View key={opcion.id} style={[styles.tarjeta, esMovil && styles.tarjetaMovil]}>
              <Image 
                source={opcion.icono} 
                style={[styles.icono, esMovil && styles.iconoMovil]} 
                resizeMode="contain" 
              />
              
              <View style={[styles.contenedorDerecho, esMovil && styles.contenedorDerechoMovil]}>
                <Text style={[styles.tituloTarjeta, esMovil && styles.tituloTarjetaMovil]}>
                  {opcion.titulo}
                </Text>
                
                <Pressable 
                  style={[styles.botonAccion, esMovil && styles.botonAccionMovil]}
                  onPress={() => router.push(opcion.ruta as any)}
                >
                  <Text style={[styles.textoBoton, esMovil && styles.textoBotonMovil]}>{opcion.titulo}</Text>
                </Pressable>
              </View>

            </View>
          ))}

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedorFondo: {
    flex: 1,
    backgroundColor: '#FAFAFA', 
  },
  scrollContenido: {
    paddingVertical: 50,
    paddingHorizontal: 20,
    alignItems: 'center',
    paddingBottom: 100,
  },
  contenedorTarjetas: {
    width: '100%',
    maxWidth: 900, 
    gap: 30, 
  },
  tarjeta: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    alignItems: 'center',
    minHeight: 220,
  },
  tarjetaMovil: {
    flexDirection: 'row',
    padding: 15,
    minHeight: 100,
    alignItems: 'center',
  },
  icono: {
    width: 150,
    height: 150,
    marginRight: 40,
  },
  iconoMovil: {
    marginRight: 15,
    marginBottom: 0,
    width: 70,
    height: 70,
  },
  contenedorDerecho: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'flex-end', 
    height: 150, 
  },
  contenedorDerechoMovil: {
    flex: 1,
    alignItems: 'flex-start',
    height: 'auto',
    justifyContent: 'center',
    gap: 10,
  },
  tituloTarjeta: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 36,
    color: '#000000',
    textAlign: 'right',
  },
  tituloTarjetaMovil: {
    fontSize: 18,
    textAlign: 'left',
  },
  botonAccion: {
    backgroundColor: '#29166F',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonAccionMovil: {
    width: '100%',
    minWidth: 0,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  textoBoton: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
  },
  textoBotonMovil: {
    fontSize: 14,
  }
});