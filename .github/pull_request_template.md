### 📝 Descripción
Esta PR mejora significativamente la experiencia del usuario (UX) al gestionar los mensajes de error técnicos que devuelven la API y Supabase. Se ha diseñado un sistema centralizado para traducir errores crudos en inglés a mensajes amigables y comprensibles en español.

**Resumen de los cambios implementados:**

*   **Diccionario de Errores Centralizado (`utils/errores.ts`):** Se ha creado una utilidad global siguiendo el principio DRY (*Don't Repeat Yourself*). Intercepta y traduce los errores más comunes de autenticación, registro, caducidad de tokens y fallos de red.
*   **Mejora en la UI de Alertas:** Los bloques `catch` en las peticiones (como en `login.tsx`) ahora pasan el `error.message` por la función `traducirError` antes de disparar el contexto de Alerta.
*   **Escalabilidad:** El sistema está preparado para ser importado fácilmente mediante `@/utils/errores` en cualquier otra pantalla de la aplicación .

## 🔗 Issue relacionado
Closes #66

## 🚀 Tipo de cambio
- [ ] ✨ Nueva funcionalidad (feature)
- [ ] 🐛 Corrección de error (bugfix)
- [X] ♻️ Refactorización (mejora de código sin añadir nueva funcionalidad)
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
La función `traducirError` ha sido diseñada de forma defensiva: convierte los mensajes recibidos a minúsculas y utiliza `.includes()` para buscar palabras clave en lugar de requerir strings exactos. Esto garantiza que la traducción no se rompa si la API o Supabase cambian ligeramente la estructura de sus errores en el futuro. Si ocurre un error no contemplado, se devuelve un mensaje genérico por defecto para evitar que la aplicación falle.