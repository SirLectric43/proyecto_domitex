import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthContextType = {
  usuario: { nombre: string; token: string } | null;
  iniciarSesionContext: (nombre: string, token: string) => Promise<void>;
  cerrarSesionContext: () => Promise<void>;
  cargando: boolean;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<{ nombre: string; token: string } | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarSesion = async () => {
      try {
        const tokenGuardado = await AsyncStorage.getItem('userToken');
        const nombreGuardado = await AsyncStorage.getItem('userName');
        if (tokenGuardado && nombreGuardado) {
          setUsuario({ nombre: nombreGuardado, token: tokenGuardado });
        }
      } catch (e) {
        console.error("Error cargando sesión", e);
      } finally {
        setCargando(false);
      }
    };
    cargarSesion();
  }, []);

  const iniciarSesionContext = async (nombre: string, token: string) => {
    await AsyncStorage.setItem('userToken', token);
    await AsyncStorage.setItem('userName', nombre);
    setUsuario({ nombre, token });
  };

  const cerrarSesionContext = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userName');
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, iniciarSesionContext, cerrarSesionContext, cargando }}>
      {children}
    </AuthContext.Provider>
  );
};