### 📝 Descripción
Esta PR introduce mejoras fundamentales de SEO (Optimización para Motores de Búsqueda) y experiencia de usuario en la versión web de la aplicación, configurando correctamente los títulos de las pestañas del navegador y sus metadatos.

**Resumen de los cambios implementados:**

*   **Implementación de Metadatos:** Se ha integrado el componente `<Head>` importado desde `expo-router/head` en las pantallas de la aplicación.
*   **Títulos Dinámicos y de Marca:** Cada página ahora cuenta con un título descriptivo estructurado (ej. *"Iniciar Sesión | Domitex"*, *"Domitex | Vistiendo tu hogar con elegancia"*), lo que hace la navegación mucho más profesional y amigable.

## 🔗 Issue relacionado
Closes #70

## 🚀 Tipo de cambio
- [X] ✨ Nueva funcionalidad (feature)
- [ ] 🐛 Corrección de error (bugfix)
- [ ] ♻️ Refactorización (mejora de código sin añadir nueva funcionalidad)
- [X] 🎨 Mejoras de UI/UX o estilos (Tailwind / NativeWind)
- [ ] 🔧 Configuración del proyecto / Dependencias

## 📱 Cambios en la Interfaz (Si aplica)
| Antes | Después |
| :--- | :--- |
| **Pestaña Web:** Mostraba la URL o "index" por defecto. | **Pestaña Web:** Muestra el nombre exacto de la página actual, ej: "Catálogo de Productos \| Domitex". |
| **Resultados de búsqueda:** Sin descripción. | **Resultados de búsqueda:** Meta descripciones comerciales atractivas. |

## ✅ Checklist de calidad antes de fusionar
- [X] He revisado mi propio código línea por línea antes de abrir esta PR.
- [X] He probado estos cambios en el emulador (Android/iOS) o en mi navegador web y los títulos cambian correctamente.
- [X] El código compila sin errores ni advertencias (warnings) graves.
- [X] He eliminado los `console.log()` innecesarios o de depuración.
- [X] Mi código sigue la arquitectura y el estilo definido en el proyecto.
- [X] He añadido o actualizado los comentarios en funciones complejas.

## 💡 Notas adicionales para el revisor / Tutor
Al utilizar el componente nativo `<Head>` de `expo-router/head`, la inyección de los metadatos en el DOM se realiza de forma limpia, por lo que estos cambios no causan conflictos en las compilaciones nativas de iOS o Android.