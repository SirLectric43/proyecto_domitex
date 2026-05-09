import React, { createContext, useState, useRef, ReactNode } from 'react';
import { View, Text, StyleSheet, Animated, Platform, Pressable } from 'react-native';

export const AlertaContext = createContext<any>(null);

export const AlertaProvider = ({ children }: { children: ReactNode }) => {
  const [alerta, setAlerta] = useState<{ titulo: string; mensaje: string; tipo: 'exito' | 'error' | 'info' } | null>(null);
  
  const animacionY = useRef(new Animated.Value(-150)).current;
  const opacidad = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mostrarAlerta = (titulo: string, mensaje: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    let tipo: 'exito' | 'error' | 'info' = 'info';
    const tLower = titulo.toLowerCase();
    
    if (tLower.includes('éxito') || tLower.includes('exito')) {
      tipo = 'exito';
    } else if (tLower.includes('error')) {
      tipo = 'error';
    } else if (tLower.includes('atención')) {
      tipo = 'info';
    }

    setAlerta({ titulo, mensaje, tipo });

    Animated.parallel([
      Animated.timing(animacionY, {
        toValue: Platform.OS === 'web' ? 20 : 50,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(opacidad, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();

    timeoutRef.current = setTimeout(() => {
      ocultarAlerta();
    }, 4000);
  };

  const ocultarAlerta = () => {
    Animated.parallel([
      Animated.timing(animacionY, {
        toValue: -150,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacidad, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setAlerta(null);
    });
  };

  const getColorAlerta = (tipo: string) => {
    switch (tipo) {
      case 'exito': return '#4CAF50';
      case 'error': return '#DB3632';
      case 'info': return '#FF9D1D';
      default: return '#29166F';
    }
  };

  return (
    <AlertaContext.Provider value={{ mostrarAlerta }}>
      {children}
      
      {alerta && (
        <Animated.View 
          style={[
            styles.contenedorFlotante, 
            { 
              borderLeftColor: getColorAlerta(alerta.tipo),
              borderRightColor: getColorAlerta(alerta.tipo),
              transform: [{ translateY: animacionY }],
              opacity: opacidad
            }
          ]}
        >
          <View style={styles.contenidoAlerta}>
            <Text style={styles.tituloAlerta}>{alerta.titulo}</Text>
            <Text style={styles.mensajeAlerta}>{alerta.mensaje}</Text>
          </View>
          <Pressable onPress={ocultarAlerta} style={styles.botonCerrar}>
            <Text style={styles.textoCerrar}>✕</Text>
          </Pressable>
        </Animated.View>
      )}
    </AlertaContext.Provider>
  );
};

const styles = StyleSheet.create({
  contenedorFlotante: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    left: 20,
    right: 20,
    maxWidth: 500,
    marginHorizontal: 'auto',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: '#EAEAEA',
    borderBottomColor: '#EAEAEA',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  } as any,
  contenidoAlerta: {
    flex: 1,
    paddingRight: 10,
  },
  tituloAlerta: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
    color: '#000000',
    marginBottom: 4,
  },
  mensajeAlerta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  botonCerrar: {
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoCerrar: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#999999',
    opacity: 0.8,
  }
});