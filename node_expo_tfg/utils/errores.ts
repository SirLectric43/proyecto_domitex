export const traducirError = (mensaje: string | undefined | null): string => {
    if (!mensaje) return "Ha ocurrido un error inesperado.";
    
    const msg = String(mensaje).toLowerCase();
    
    // Errores de Login
    if (msg.includes("invalid login credentials")) {
        return "El correo o la contraseña son incorrectos.";
    }
    if (msg.includes("email not confirmed")) {
        return "Por favor, confirma tu correo electrónico antes de iniciar sesión.";
    }
    if (msg.includes("user not found")) {
        return "No existe ninguna cuenta asociada a este correo.";
    }

    // Errores de Registro
    if (msg.includes("user already registered") || msg.includes("already exists")) {
        return "Ya existe una cuenta registrada con este correo electrónico.";
    }
    if (msg.includes("password should be at least")) {
        return "La contraseña es muy corta. Debe tener al menos 6 caracteres.";
    }

    // Errores de Tokens / Recuperación
    if (msg.includes("jwt") || msg.includes("token") || msg.includes("expired")) {
        return "El enlace no es válido o ha caducado. Por favor, solicita uno nuevo.";
    }

    // Errores de Conexión
    if (msg.includes("failed to fetch") || msg.includes("network request failed")) {
        return "No se ha podido conectar con el servidor. Revisa tu conexión a internet.";
    }
    if (msg.includes("rate limit")) {
        return "Has hecho demasiados intentos. Por favor, espera un momento.";
    }

    // Error por defecto si no coincide con ninguno
    return "Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.";
};