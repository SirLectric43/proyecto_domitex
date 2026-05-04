import { useEffect, useContext } from 'react';
import { Slot, useSegments, useRouter } from 'expo-router';
import { ScrollView, View, ActivityIndicator } from "react-native";
import * as SplashScreen from 'expo-splash-screen';
import NavbarPublico from "@/app/navbar-publico";
import NavbarPrivado from "@/app/navbar-privado"; 
import Footer from "./footer";
import { AuthProvider, AuthContext } from './auth-context';
import { AlertaProvider } from './alerta-context';

import { 
  useFonts, 
  Inter_400Regular, 
  Inter_600SemiBold,
  Inter_700Bold 
} from '@expo-google-fonts/inter';
import { 
  Montserrat_400Regular, 
  Montserrat_600SemiBold,
  Montserrat_700Bold ,
  Montserrat_300Light,
} from '@expo-google-fonts/montserrat';

SplashScreen.preventAutoHideAsync();

function EnrutadorPrincipal() {
  const auth = useContext(AuthContext);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (auth?.cargando) return;

    const rutasPublicas = ['index', '', 'login', 'registro', 'catalogo', 'vista-articulo'];
    const rutasAdmin = ['panel-administrador', 'agregar-articulo', 'gestion-usuarios', 'crear-usuario', 'administrar-usuario', 'gestion-pedidos', 'ver-pedido-admin'];    
    const rutaActual = segments[0] || 'index';

    if (!auth?.usuario) {
      if (!rutasPublicas.includes(rutaActual)) {
        router.replace('/login');
      }
    } else {
      if (rutasAdmin.includes(rutaActual)) {
        if (auth.usuario.rol === 'empleado') {
          if (rutaActual !== 'gestion-pedidos' && rutaActual !== 'ver-pedido-admin' && rutaActual !== 'panel-administrador') {
            router.replace('/gestion-pedidos');
          }
        } else if (auth.usuario.rol !== 'admin') {
          router.replace('/catalogo');
        }
      }
    }
  }, [segments, auth?.usuario, auth?.cargando]);

  if (auth?.cargando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
        <ActivityIndicator size="large" color="#29166F" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {auth?.usuario ? <NavbarPrivado /> : <NavbarPublico />}
      
      <ScrollView 
        style={{flex: 1}} 
        contentContainerStyle={{ flexGrow: 1 }} 
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flex: 1 }}>
          <Slot/>
        </View>
        <Footer/>
      </ScrollView>
    </View>
  );
}

export default function RootLayout() {
  const [fuentesCargadas, errorFuentes] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Montserrat_400Regular,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_300Light,
  });

  useEffect(() => {
    if (fuentesCargadas || errorFuentes) {
      SplashScreen.hideAsync();
    }
  }, [fuentesCargadas, errorFuentes]);

  if (!fuentesCargadas && !errorFuentes) {
    return null; 
  }

  return (
    <AuthProvider>
      <AlertaProvider>
        <EnrutadorPrincipal />
      </AlertaProvider>
    </AuthProvider>
  );
}