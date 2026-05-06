### 📝 Descripción
Esta PR implementa la funcionalidad real de la casilla "Recordarme" en la pantalla de inicio de sesión, gestionando de forma inteligente la persistencia de los datos del usuario.

**Resumen de los cambios implementados:**

*   **Lógica de Persistencia (AuthContext):** Se ha refactorizado `auth-context.tsx` para soportar dos tipos de almacenamiento:
    *   `AsyncStorage` (Memoria persistente): Se utiliza cuando el usuario marca "Recordarme". La sesión sobrevive al cierre de la pestaña y del navegador.
    *   `sessionStorage` (Memoria volátil, solo Web): Se utiliza cuando el usuario **no** marca "Recordarme". La sesión resiste la recarga de la página (F5), pero se destruye automáticamente al cerrar la pestaña.
*   **Limpieza de sesión segura:** Se ha actualizado `cerrarSesionContext` y la inicialización del login para limpiar siempre ambos tipos de almacenamiento, evitando conflictos o duplicidades de datos en el navegador.
*   **Actualización del Login:** Se ha modificado `login.tsx` para pasar el valor booleano del estado `recordarme` a la función `iniciarSesionContext`.

## 🔗 Issue relacionado
Closes #65

## 🚀 Tipo de cambio
- [X] ✨ Nueva funcionalidad (feature)
- [ ] 🐛 Corrección de error (bugfix)
- [ ] ♻️ Refactorización (mejora de código sin añadir nueva funcionalidad)
- [ ] 🎨 Mejoras de UI/UX o estilos (Tailwind / NativeWind)
- [ ] 🔧 Configuración del proyecto / Dependencias

## 📱 Cambios en la Interfaz (Si aplica)
| Antes | Después |
| *(Captura antigua o N/A)* | *(Captura nueva)* |

## ✅ Checklist de calidad antes de fusionar
- [X] He revisado mi propio código línea por línea antes de abrir esta PR.
- [X] He probado estos cambios en el emulador (Android/iOS) o en mi móvil físico con Expo Go y todo funciona correctamente.
- [X] El código compila sin errores ni advertencias (warnings) graves.
- [X] He eliminado los `console.log()` innecesarios o de depuración.
- [X] Mi código sigue la arquitectura y el estilo definido en el proyecto.
- [X] He añadido o actualizado los comentarios en funciones complejas.

## 💡 Notas adicionales para el revisor / Tutor
Se ha implementado una validación específica para `Platform.OS === 'web'` y `typeof window !== 'undefined'` en el uso de `sessionStorage` dentro del contexto de autenticación. Esto asegura que la aplicación web funcione perfectamente con las recargas de página (F5) sin romper la compatibilidad con las aplicaciones móviles nativas de Expo.