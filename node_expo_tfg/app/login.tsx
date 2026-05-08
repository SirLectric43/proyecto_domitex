import { useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, ImageBackground, Pressable, useWindowDimensions, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { Link, useRouter} from 'expo-router';
import Head from "expo-router/head";
import { AuthContext } from './auth-context';
import { AlertaContext } from './alerta-context';
import { traducirError } from '@/utils/errores';

export default function LoginPage() {
    const { width } = useWindowDimensions();
    const esMovil = width < 768;
    const router = useRouter();

    const [correo, setCorreo] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [recordarme, setRecordarme] = useState(false);
    const [cargando, setCargando] = useState(false);
    
    const [modalRecuperar, setModalRecuperar] = useState(false);
    const [faseRecuperacion, setFaseRecuperacion] = useState(1);
    const [correoRecuperar, setCorreoRecuperar] = useState('');
    const [codigoRecuperar, setCodigoRecuperar] = useState('');
    const [nuevaPassRecuperar, setNuevaPassRecuperar] = useState('');
    const [cargandoRecuperar, setCargandoRecuperar] = useState(false);

    const auth = useContext(AuthContext);
    const alerta = useContext(AlertaContext);
    const BASE_URL = process.env.EXPO_PUBLIC_API_URL || '';

    const manejarLogin = async () => {
        if (!correo || !contrasena) {
            alerta?.mostrarAlerta("Error", "Por favor, introduce tu correo y contraseña.");
            return;
        }

        setCargando(true);

        try {
            const urlApi = `${BASE_URL}/api/login`;
            
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

            if (auth?.iniciarSesionContext) {
                await auth.iniciarSesionContext(datos.nombre, datos.token, datos.usuario_id, datos.rol, recordarme);
            }

            alerta?.mostrarAlerta("Éxito", "Sesión iniciada correctamente.");

            if (datos.rol === 'admin' || datos.rol === 'empleado') {
                router.replace("/panel-administrador");
            } else {
                router.replace("/catalogo");
            }

        } catch (e: any) {
            const mensajeError = traducirError(e.message);
            alerta?.mostrarAlerta("Error", mensajeError);
        } finally {
            setCargando(false);
        }
    };

    const solicitarCodigo = async () => {
        if (!correoRecuperar) {
            alerta?.mostrarAlerta("Error", "Introduce el correo electrónico de tu cuenta.");
            return;
        }
        setCargandoRecuperar(true);
        try {
            const res = await fetch(`${BASE_URL}/api/recuperar-contrasena`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo: correoRecuperar })
            });
            if (res.ok) {
                setFaseRecuperacion(2);
                alerta?.mostrarAlerta("Éxito", "Código enviado. Revisa tu bandeja de entrada.");
            } else {
                const error = await res.json();
                alerta?.mostrarAlerta("Error", error.detail || "No se pudo enviar el código.");
            }
        } catch (e: any) {
            alerta?.mostrarAlerta("Error", "Error de conexión con el servidor: " + e);
        } finally {
            setCargandoRecuperar(false);
        }
    };

    const verificarYCambiar = async () => {
        if (!codigoRecuperar || !nuevaPassRecuperar) {
            alerta?.mostrarAlerta("Error", "Rellena el código y la nueva contraseña.");
            return;
        }
        setCargandoRecuperar(true);
        try {
            const res = await fetch(`${BASE_URL}/api/verificar-recuperacion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    correo: correoRecuperar,
                    codigo: codigoRecuperar,
                    nueva_contrasena: nuevaPassRecuperar
                })
            });
            if (res.ok) {
                alerta?.mostrarAlerta("Éxito", "Contraseña cambiada con éxito. Ya puedes iniciar sesión.");
                cerrarModalRecuperacion();
            } else {
                const error = await res.json();
                alerta?.mostrarAlerta("Error", error.detail || "Código incorrecto o caducado.");
            }
        } catch (e: any) {
            alerta?.mostrarAlerta("Error", "Error de conexión con el servidor: " + e);
        } finally {
            setCargandoRecuperar(false);
        }
    };

    const cerrarModalRecuperacion = () => {
        setModalRecuperar(false);
        setFaseRecuperacion(1);
        setCorreoRecuperar('');
        setCodigoRecuperar('');
        setNuevaPassRecuperar('');
    };

    return (
        <ScrollView style={styles.contenedor} keyboardShouldPersistTaps="handled">
            <Head>
                <title>Inicio de sesión | Domitex</title>
            </Head>
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
                            style={[styles.input, {fontFamily: undefined}]} 
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

                        <Pressable onPress={() => setModalRecuperar(true)}>
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

            <Modal visible={modalRecuperar} transparent animationType="fade">
                <View style={styles.fondoModal}>
                    <View style={styles.contenedorModalRecuperar}>
                        <Text style={styles.tituloModalRecuperar}>RECUPERAR CONTRASEÑA</Text>
                        
                        {faseRecuperacion === 1 ? (
                            <>
                                <Text style={styles.textoInstruccion}>Introduce tu correo electrónico para recibir un código numérico de seguridad.</Text>
                                <View style={styles.grupoInput}>
                                    <Text style={styles.label}>Correo electrónico</Text>
                                    <TextInput 
                                        style={styles.input} 
                                        value={correoRecuperar} 
                                        onChangeText={setCorreoRecuperar} 
                                        keyboardType="email-address" 
                                        autoCapitalize="none" 
                                    />
                                </View>
                                <Pressable style={styles.botonLogin} onPress={solicitarCodigo} disabled={cargandoRecuperar}>
                                    {cargandoRecuperar ? <ActivityIndicator color="#FFF" /> : <Text style={styles.textoBotonLogin}>Enviar código</Text>}
                                </Pressable>
                            </>
                        ) : (
                            <>
                                <Text style={styles.textoInstruccion}>Introduce el código de 8 dígitos que hemos enviado a tu correo y establece tu nueva contraseña.</Text>
                                <View style={styles.grupoInput}>
                                    <Text style={styles.label}>Código de seguridad</Text>
                                    <TextInput 
                                        style={styles.input} 
                                        value={codigoRecuperar} 
                                        onChangeText={setCodigoRecuperar} 
                                        keyboardType="number-pad"
                                        maxLength={8}
                                    />
                                </View>
                                <View style={styles.grupoInput}>
                                    <Text style={styles.label}>Nueva contraseña</Text>
                                    <TextInput 
                                        style={[styles.input, {fontFamily: undefined}]} 
                                        value={nuevaPassRecuperar} 
                                        onChangeText={setNuevaPassRecuperar} 
                                        secureTextEntry={true} 
                                    />
                                </View>
                                <Pressable style={styles.botonLogin} onPress={verificarYCambiar} disabled={cargandoRecuperar}>
                                    {cargandoRecuperar ? <ActivityIndicator color="#FFF" /> : <Text style={styles.textoBotonLogin}>Cambiar contraseña</Text>}
                                </Pressable>

                                <Pressable onPress={solicitarCodigo} style={{ marginTop: 20, alignItems: 'center' }}>
                                    <Text style={styles.linkReenviar}>No he recibido el código. Reenviar.</Text>
                                </Pressable>
                            </>
                        )}

                        <Pressable style={styles.botonCancelarModal} onPress={cerrarModalRecuperacion}>
                            <Text style={styles.textoBotonCancelar}>Cancelar</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
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
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 8,
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
    },
    fondoModal: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    contenedorModalRecuperar: {
        width: '100%',
        maxWidth: 450,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 30,
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    tituloModalRecuperar: {
        fontFamily: 'Inter_700Bold',
        fontSize: 24,
        color: '#29166F',
        textAlign: 'center',
        marginBottom: 15,
    },
    textoInstruccion: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    linkReenviar: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: '#DB3632',
        textDecorationLine: 'underline',
    },
    botonCancelarModal: {
        marginTop: 15,
        paddingVertical: 12,
        alignItems: 'center',
    },
    textoBotonCancelar: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: '#666',
    }
});