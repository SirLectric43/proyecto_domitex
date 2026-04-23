import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';

export default function PanelAdmin() {
  const { width } = useWindowDimensions();
  const esMovil = width < 768;
  const router = useRouter();

  const opciones = [
    { 
      id: 'catalogo', 
      titulo: 'Gestionar catálogo', 
      icono: require('@/assets/images/gestionCatalogo.png'),
      ruta: '/gestion-catalogo'
    },
    { 
      id: 'usuarios', 
      titulo: 'Gestionar usuarios', 
      icono: require('@/assets/images/gestionUsuarios.png') 
    },
    { 
      id: 'pedidos', 
      titulo: 'Validación de pedidos', 
      icono: require('@/assets/images/validarPedidos.png') 
    }
  ];

  return (
    <View style={styles.contenedorFondo}>
      <ScrollView contentContainerStyle={styles.scrollContenido}>
        <View style={styles.contenedorTarjetas}>
          
          {opciones.map((opcion) => (
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
                  <Text style={styles.textoBoton}>{opcion.titulo}</Text>
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
    minHeight: 130,
  },
  icono: {
    width: 150,
    height: 150,
    marginRight: 40,
  },
  iconoMovil: {
    marginRight: 15,
    marginBottom: 0,
    width: 120,
    height: 120,
  },
  contenedorDerecho: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'flex-end', 
    height: 150, 
  },
  contenedorDerechoMovil: {
    alignItems: 'flex-end',
    height: 90,
    justifyContent: 'space-between',
    gap: 10,
  },
  tituloTarjeta: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 36,
    color: '#000000',
    textAlign: 'right',
  },
  tituloTarjetaMovil: {
    fontSize: 26,
    textAlign: 'right',
  },
  botonAccion: {
    backgroundColor: '#29166F',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 6,
    minWidth: 250,
    alignItems: 'center',
  },
  botonAccionMovil: {
    width: 'auto',
    minWidth: 130,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  textoBoton: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat_700Bold',
    fontSize: 20,
  }
});