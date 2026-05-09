import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

type AuthContextType = {
  usuario: { nombre: string; token: string; usuario_id: string; rol: string } | null;
  iniciarSesionContext: (nombre: string, token: string, usuario_id: string, rol: string, recordarme?: boolean) => Promise<void>;
  cerrarSesionContext: () => Promise<void>;
  cargando: boolean;
  cantidadCesta: number;
  setCantidadCesta: React.Dispatch<React.SetStateAction<number>>;
  refrescarCarrito: () => Promise<void>;
};

/*Creamos el contexto de autenticación que importaremos en otras pantallas 
usando useContext(AuthContext) para acceder a los datos.*/
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/*El Provider es el "envoltorio" que colocamos en el _layout.tsx. 
Todo lo que esté dentro de 'children' podrá acceder a la información de sesión.*/
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<{ nombre: string; token: string; usuario_id: string; rol: string } | null>(null);
  const [cargando, setCargando] = useState(true);
  const [cantidadCesta, setCantidadCesta] = useState(0);
  const BASE_URL = process.env.EXPO_PUBLIC_API_URL || '';

  useEffect(() => {
    const cargarSesion = async () => {
      try {
        let tokenGuardado: string | null = null;
        let nombreGuardado: string | null = null;
        let idGuardado: string | null = null;
        let rolGuardado: string | null = null;

        /* Comprobamos primero si hay una sesión volátil activa en la pestaña actual (sessionStorage). 
        Si no la hay, comprobamos si existe una sesión permanente guardada (AsyncStorage). */
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          tokenGuardado = sessionStorage.getItem('userToken');
          nombreGuardado = sessionStorage.getItem('userName');
          idGuardado = sessionStorage.getItem('userId');
          rolGuardado = sessionStorage.getItem('userRol');
        }

        if (!tokenGuardado) {
          tokenGuardado = await AsyncStorage.getItem('userToken');
          nombreGuardado = await AsyncStorage.getItem('userName');
          idGuardado = await AsyncStorage.getItem('userId');
          rolGuardado = await AsyncStorage.getItem('userRol');
        }

        if (tokenGuardado && nombreGuardado && idGuardado && rolGuardado) {
          setUsuario({ nombre: nombreGuardado, token: tokenGuardado, usuario_id: idGuardado, rol: rolGuardado });
        }
      } catch (e) {
        console.error("Error cargando sesión", e);
      } finally {
        setCargando(false);
      }
    };
    cargarSesion();
  }, []);

  // Cuando se inicia sesión se guardan los datos del usuario para mantener la sesión iniciada.
  const iniciarSesionContext = async (nombre: string, token: string, usuario_id: string, rol: string, recordarme?: boolean) => {
    let usarAsync = false;
    let usarSession = false;

    /* Limpiamos siempre ambas memorias antes de guardar la nueva sesión 
    para evitar conflictos o duplicidad de datos en el navegador. */
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      sessionStorage.removeItem('userToken');
      sessionStorage.removeItem('userName');
      sessionStorage.removeItem('userId');
      sessionStorage.removeItem('userRol');
    }
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userName');
    await AsyncStorage.removeItem('userId');
    await AsyncStorage.removeItem('userRol');

    /* Determinamos en qué memoria guardar los datos basándonos en si el usuario 
    marcó la casilla de "Recordarme" en el login o si ya tenía sesión previa persistente. */
    if (recordarme === true) {
      usarAsync = true;
    } else if (recordarme === false) {
      usarSession = true;
    } else {
      const estabaEnAsync = await AsyncStorage.getItem('userToken') !== null;
      if (estabaEnAsync) {
        usarAsync = true;
      } else {
        usarSession = true;
      }
    }

    if (usarAsync) {
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userName', nombre);
      await AsyncStorage.setItem('userId', usuario_id);
      await AsyncStorage.setItem('userRol', rol);
    } else if (usarSession && Platform.OS === 'web' && typeof window !== 'undefined') {
      sessionStorage.setItem('userToken', token);
      sessionStorage.setItem('userName', nombre);
      sessionStorage.setItem('userId', usuario_id);
      sessionStorage.setItem('userRol', rol);
    }

    setUsuario({ nombre, token, usuario_id, rol });
  };

  // Cuando se cierra sesión se eliminan esos datos guardados previamente en ambas memorias.
  const cerrarSesionContext = async () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      sessionStorage.removeItem('userToken');
      sessionStorage.removeItem('userName');
      sessionStorage.removeItem('userId');
      sessionStorage.removeItem('userRol');
    }
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userName');
    await AsyncStorage.removeItem('userId');
    await AsyncStorage.removeItem('userRol');
    setUsuario(null);
  };

  /* Función global para consultar la base de datos y tener el número real de artículos en el carrito. */
  const refrescarCarrito = useCallback(async () => {
    if (!usuario?.token) {
      setCantidadCesta(0);
      return;
    }
    try {
      const urlApi = `${BASE_URL}/api/carrito`;
        
      const respuesta = await fetch(urlApi, {
        headers: { 'Authorization': `Bearer ${usuario.token}` }
      });
      
      if (respuesta.ok) {
        const datos = await respuesta.json();
        // Sumamos la cantidad de todos los artículos para saber el total real
        const totalArticulos = datos.reduce((total: number, item: any) => total + item.cantidad, 0);
        setCantidadCesta(totalArticulos);
      }
    } catch (error) {
      console.error("Error al refrescar carrito global:", error);
    }
  }, [usuario?.token, BASE_URL]);

  useEffect(() => {
    refrescarCarrito();
  }, [refrescarCarrito]);

  useEffect(() => {
    refrescarCarrito();
  }, [usuario, refrescarCarrito]);

  return (
    <AuthContext.Provider value={{ 
      usuario, 
      iniciarSesionContext, 
      cerrarSesionContext, 
      cargando,
      cantidadCesta,
      setCantidadCesta,
      refrescarCarrito
    }}>
      {children}
    </AuthContext.Provider>
  );
};