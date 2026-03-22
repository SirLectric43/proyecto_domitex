import NavbarPublico from "@/app/navbar-publico";
import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { View } from "react-native";
import * as SplashScreen from 'expo-splash-screen';

// 1. Importamos los grosores que necesitamos de cada fuente
import { 
  useFonts, 
  Inter_400Regular, 
  Inter_600SemiBold,
  Inter_700Bold 
} from '@expo-google-fonts/inter';
import { 
  Montserrat_400Regular, 
  Montserrat_600SemiBold,
  Montserrat_700Bold 
} from '@expo-google-fonts/montserrat';

// 2. Congelamos la pantalla de carga inicial de Expo
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fuentesCargadas, errorFuentes] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Montserrat_400Regular,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  // 4. Vigila cuándo terminan de cargar
  useEffect(() => {
    if (fuentesCargadas || errorFuentes) {
      // Ya cargaron (o fallaron), ¡quita la pantalla de carga!
      SplashScreen.hideAsync();
    }
  }, [fuentesCargadas, errorFuentes]);

  // 5. Mientras no estén listas, no renderizamos la app
  if (!fuentesCargadas && !errorFuentes) {
    return null; 
  }

  return (
    <View>
      <NavbarPublico />
      <Slot/>
    </View>
  );
}
