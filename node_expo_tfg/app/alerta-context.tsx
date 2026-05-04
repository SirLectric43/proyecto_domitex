import React, { createContext, useState, ReactNode } from "react";
import { Modal, View, Text, Pressable, StyleSheet } from "react-native";

type AlertaContextType = {
  mostrarAlerta: (titulo: string, mensaje: string) => void;
};

export const AlertaContext = createContext<AlertaContextType | undefined>(
  undefined,
);

export const AlertaProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [mensaje, setMensaje] = useState("");

  const mostrarAlerta = (t: string, m: string) => {
    setTitulo(t);
    setMensaje(m);
    setVisible(true);
  };

  return (
    <AlertaContext.Provider value={{ mostrarAlerta }}>
      {children}
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.fondoModal}>
          <View style={styles.cajaModal}>
            <Text style={styles.titulo}>{titulo}</Text>
            <Text style={styles.mensaje}>{mensaje}</Text>
            <Pressable style={styles.boton} onPress={() => setVisible(false)}>
              <Text style={styles.textoBoton}>Aceptar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </AlertaContext.Provider>
  );
};

const styles = StyleSheet.create({
  fondoModal: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  cajaModal: {
    backgroundColor: "#FFFFFF",
    width: "90%",
    maxWidth: 400,
    borderRadius: 12,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  titulo: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 24,
    color: "#29166F",
    marginBottom: 15,
    textAlign: "center",
  },
  mensaje: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#333333",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 24,
  },
  boton: {
    backgroundColor: "#DB3632",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  textoBoton: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
});
