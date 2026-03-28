import { useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, ImageBackground, Pressable, useWindowDimensions, Platform, Alert, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { AuthContext } from './auth-context';

export default function LoginPage() {
    const { width } = useWindowDimensions();
    const esMovil = width < 768;
    const router = useRouter();

    const [correo, setCorreo] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [recordarme, setRecordarme] = useState(false);
    const [cargando, setCargando] = useState(false);
    const auth = useContext(AuthContext);

    const mostrarAlerta = (titulo: string, mensaje: string) => {
        if (Platform.OS === 'web') {
            window.alert(`${titulo}: ${mensaje}`);
        } else {
            Alert.alert(titulo, mensaje);
        }
    };

    const manejarLogin = async () => {
        if (!correo || !contrasena) {
            mostrarAlerta("Error", "Por favor, introduce tu correo y contraseña.");
            return;
        }

        setCargando(true);

        try {
            const urlApi = Platform.OS === 'web' ? 'http://localhost:8000/login' : 'http://192.168.1.43:8000/login';
            
            const respuesta = await fetch(urlApi, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    correo,
                    contrasena
                }),
            });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            let mensajeError = "Error al iniciar sesión";
            if (datos.detail) {
                mensajeError = String(datos.detail);
            }
            throw new Error(mensajeError);
        }

        mostrarAlerta("Éxito", "Sesión iniciada correctamente.");

        if (auth?.iniciarSesionContext) {
            await auth.iniciarSesionContext(datos.nombre, datos.token, datos.usuario_id);
        }

        mostrarAlerta("Éxito", "Sesión iniciada correctamente.");
        router.replace("/catalogo");
        
        router.push("/catalogo");

        } catch (error: any) {
            mostrarAlerta("Acceso denegado", error.message);
        } finally {
            setCargando(false);
        }
    };

return (
<ScrollView style={styles.contenedor} keyboardShouldPersistTaps="handled">
    <ImageBackground source={require('@/assets/images/bannerLanding.png')} style={styles.contenedorImagen} resizeMode="cover">
    <View style={styles.capaSuperpuesta}>
        <Text style={[styles.tituloBanner, esMovil && { fontSize: 36, lineHeight: 40, marginTop: 10 }]}>
        Domitex: Vistiendo tu hogar con elegancia
        </Text>
        <Text style={[styles.subtituloBanner, esMovil && { fontSize: 18, lineHeight: 24, marginTop: 20 }]}>
        La calidad textil de siempre, ahora a un solo clic. Haz tus pedidos de forma rápida y eficaz.
        </Text>
        <Link href="/catalogo" asChild>
        <Pressable style={esMovil ? styles.botonBannerMovil : styles.botonBanner}>
            <Text style={[styles.textoBotonBanner, esMovil && { fontSize: 18 }]}>Explorar Catálogo</Text>
        </Pressable>
        </Link>
    </View>
    </ImageBackground>

    <View style={styles.seccionFormulario}>
    <View style={styles.contenedorFormulario}>
        <Text style={styles.tituloFormulario}>Iniciar Sesión</Text>

        <View style={styles.grupoInput}>
        <Text style={styles.label}>Correo electrónico</Text>
        <TextInput 
            style={styles.input} 
            value={correo} 
            onChangeText={setCorreo} 
            keyboardType="email-address" 
            autoCapitalize="none" 
        />
        </View>

        <View style={styles.grupoInput}>
        <Text style={styles.label}>Contraseña</Text>
        <TextInput 
            style={styles.input} 
            value={contrasena} 
            onChangeText={setContrasena} 
            secureTextEntry={true} 
        />
        </View>

        <View style={styles.contenedorOpcionesExtra}>
        <Pressable style={styles.contenedorCheckbox} onPress={() => setRecordarme(!recordarme)}>
            <View style={styles.checkbox}>
            {recordarme && <View style={styles.checkboxMarcado} />}
            </View>
            <Text style={styles.textoCheckbox}>Recordarme</Text>
        </Pressable>

        <Pressable onPress={() => mostrarAlerta("Info", "Próximamente implementaremos la recuperación.")}>
            <Text style={styles.linkRecuperar}>¿Has olvidado tu contraseña?</Text>
        </Pressable>
        </View>

        <Pressable style={styles.botonLogin} onPress={manejarLogin} disabled={cargando}>
        <Text style={styles.textoBotonLogin}>INICIAR SESIÓN</Text>
        </Pressable>

        <View style={styles.contenedorRegistroLink}>
        <Text style={styles.textoPregunta}>¿No tienes una cuenta? </Text>
        <Link href="/registro" style={styles.linkRegistro}>Regístrate aquí.</Link>
        </View>
    </View>
    </View>
</ScrollView>
);
}

const styles = StyleSheet.create({
    contenedor: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    contenedorImagen: {
        width: '100%',
        height: 498,
    },
    capaSuperpuesta: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    tituloBanner: {
        fontSize: 64,
        lineHeight: 64,
        fontFamily: 'Inter_700Bold',
        color: '#FFFFFF',
        textAlign: 'center',
        marginTop: 30,
        maxWidth: 800,
    },
    subtituloBanner: {
        fontSize: 36,
        lineHeight: 34,
        fontFamily: 'Montserrat_300Light',
        color: '#FFFFFF',
        textAlign: 'center',
        marginTop: 50,
        maxWidth: 920,
    },
    botonBanner: {
        backgroundColor: '#DB3632',
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 80,
        justifyContent: 'center', 
        alignItems: 'center',
        overflow: 'hidden',
    },
    botonBannerMovil: {
        backgroundColor: '#DB3632',
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 40,
        justifyContent: 'center', 
        alignItems: 'center',
        overflow: 'hidden',
    },
    textoBotonBanner: {
        color: '#FFFFFF',
        fontFamily: 'Inter_700Bold',
        fontSize: 24,
        textAlign: 'center',
    },
    seccionFormulario: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
        width: '100%',
    },
    contenedorFormulario: {
        width: '100%',
        maxWidth: 500,
    },
    tituloFormulario: {
        color: '#29166F',
        fontFamily: 'Inter_600SemiBold',
        fontSize: 36,
        textAlign: 'center',
        marginBottom: 40,
    },
    grupoInput: {
        marginBottom: 20,
    },
    label: {
        fontFamily: 'Inter_400Regular',
        fontSize: 20,
        color: '#000000',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#29166F',
        borderRadius: 6,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        fontFamily: 'Inter_400Regular',
        backgroundColor: '#FFFFFF',
        width: '100%',
    },
    contenedorOpcionesExtra: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 10,
    },
    contenedorCheckbox: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 1,
        borderColor: '#29166F',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    checkboxMarcado: {
        width: 12,
        height: 12,
        backgroundColor: '#29166F',
        borderRadius: 2,
    },
    textoCheckbox: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: '#000000',
    },
    linkRecuperar: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: '#29166F',
        textDecorationLine: 'underline',
    },
    botonLogin: {
        backgroundColor: '#29166F',
        borderRadius: 6,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    textoBotonLogin: {
        color: '#FFFFFF',
        fontFamily: 'Inter_700Bold',
        fontSize: 20,
    },
    contenedorRegistroLink: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    textoPregunta: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: '#000000',
    },
    linkRegistro: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: '#29166F',
        textDecorationLine: 'underline',
    }
});