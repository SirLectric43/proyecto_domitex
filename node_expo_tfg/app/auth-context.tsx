import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

type AuthContextType = {
  usuario: { nombre: string; token: string; usuario_id: string; rol: string } | null;
  iniciarSesionContext: (nombre: string, token: string, usuario_id: string, rol: string) => Promise<void>;
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

  useEffect(() => {
    const cargarSesion = async () => {
      try {
        const tokenGuardado = await AsyncStorage.getItem('userToken');
        const nombreGuardado = await AsyncStorage.getItem('userName');
        const idGuardado = await AsyncStorage.getItem('userId');
        const rolGuardado = await AsyncStorage.getItem('userRol');
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
  const iniciarSesionContext = async (nombre: string, token: string, usuario_id: string, rol: string) => {
    await AsyncStorage.setItem('userToken', token);
    await AsyncStorage.setItem('userName', nombre);
    await AsyncStorage.setItem('userId', usuario_id);
    await AsyncStorage.setItem('userRol', rol);
    setUsuario({ nombre, token, usuario_id, rol });
  };

  // Cuando se cierra sesión se eliminan esos datos guardados previamente.
  const cerrarSesionContext = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userName');
    await AsyncStorage.removeItem('userId');
    await AsyncStorage.removeItem('userRol');
    setUsuario(null);
  };

  /* Función global para consultar la base de datos y tener el número real de artículos en el carrito. */
  const refrescarCarrito = async () => {
    if (!usuario?.token) {
      setCantidadCesta(0);
      return;
    }
    try {
      const urlApi = Platform.OS === 'web' 
        ? `http://localhost:8000/carrito` 
        : `http://192.168.1.43:8000/carrito`;
        
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
  };

  useEffect(() => {
    refrescarCarrito();
  }, [usuario]);

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