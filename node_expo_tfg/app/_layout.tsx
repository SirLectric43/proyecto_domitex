import NavbarPublico from "@/app/navbar-publico";
import Footer from "./footer";
import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { ScrollView, View } from "react-native";
import * as SplashScreen from 'expo-splash-screen';
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
    <View style={{ flex: 1 }}>
      <NavbarPublico />
      <ScrollView style={{flex: 1}}>
        <Slot/>
        <Footer/>
      </ScrollView>
    </View>
  );
}
