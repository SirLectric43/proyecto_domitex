import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthContextType = {
  usuario: { nombre: string; token: string; usuario_id: string } | null;
  iniciarSesionContext: (nombre: string, token: string, usuario_id: string) => Promise<void>;
  cerrarSesionContext: () => Promise<void>;
  cargando: boolean;
};

/*Creamos el contexto de autenticación que importaremos en otras pantallas 
usando useContext(AuthContext) para acceder a los datos.*/
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/*El Provider es el "envoltorio" que colocamos en el _layout.tsx. 
Todo lo que esté dentro de 'children' podrá acceder a la información de sesión.*/
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<{ nombre: string; token: string; usuario_id: string } | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarSesion = async () => {
      try {
        const tokenGuardado = await AsyncStorage.getItem('userToken');
        const nombreGuardado = await AsyncStorage.getItem('userName');
        const idGuardado = await AsyncStorage.getItem('userId');
        if (tokenGuardado && nombreGuardado && idGuardado) {
          setUsuario({ nombre: nombreGuardado, token: tokenGuardado, usuario_id: idGuardado });
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
  const iniciarSesionContext = async (nombre: string, token: string, usuario_id: string) => {
    await AsyncStorage.setItem('userToken', token);
    await AsyncStorage.setItem('userName', nombre);
    await AsyncStorage.setItem('userId', usuario_id);
    setUsuario({ nombre, token, usuario_id });
  };

  // Cuando se cierra sesión se eliminan esos datos guardados previamente.
  const cerrarSesionContext = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userName');
    await AsyncStorage.removeItem('userId');
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, iniciarSesionContext, cerrarSesionContext, cargando }}>
      {children}
    </AuthContext.Provider>
  );
};