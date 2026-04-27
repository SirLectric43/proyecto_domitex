### 📝 Descripción
Esta PR soluciona un problema crítico de acceso al catálogo para usuarios no autenticados y añade mejoras de usabilidad (UX) en los formularios de gestión de artículos.

**Cambios principales:**
1. **Corrección del catálogo público (Backend):** Se ha solucionado una fuga de sesión (*session leak*) en `main.py`. Al iniciar sesión, el cliente global de Supabase se contaminaba con el token del usuario, provocando que las peticiones posteriores chocaran con el RLS de la tabla `categorias` y agruparan todo en "Otros". Se ha aislado el cliente en los endpoints de autenticación y se ha liberado el acceso público al endpoint `/articulos`.
2. **Corrección del catálogo público (Frontend):** Se modificó `catalogo.tsx` para no bloquear la petición si el usuario no tiene token, enviando la cabecera `Authorization` de forma condicional.
3. **Mejora UX en el Select de Categorías:** Se implementó un sistema de cierre al hacer clic fuera (Click-Outside) en `agregar-articulo.tsx` y `vista-articulo.tsx` utilizando un *overlay* invisible. Además, si el menú se cierra sin elegir nada, el campo restaura inteligentemente la última categoría seleccionada.

## 🔗 Issue relacionado
Closes #42

## 🚀 Tipo de cambio
- [X] ✨ Nueva funcionalidad (feature)
- [X] 🐛 Corrección de error (bugfix)
- [ ] ♻️ Refactorización (mejora de código sin añadir nueva funcionalidad)
- [X] 🎨 Mejoras de UI/UX o estilos (Tailwind / NativeWind)
- [ ] 🔧 Configuración del proyecto / Dependencias

## 📱 Cambios en la Interfaz (Si aplica)
| Antes | Después |
| --- | --- |
| El desplegable de categorías no se podía cerrar si no seleccionabas una opción (se quedaba bloqueando la vista). | Al hacer clic en cualquier parte fuera del menú desplegable, este se cierra de forma fluida e inteligente. |
| *(Captura antigua o N/A)* | *(Captura nueva)* |

## ✅ Checklist de calidad antes de fusionar
- [X] He revisado mi propio código línea por línea antes de abrir esta PR.
- [X] He probado estos cambios en el emulador (Android/iOS) o en mi móvil físico con Expo Go y todo funciona correctamente.
- [X] El código compila sin errores ni advertencias (warnings) graves.
- [X] He eliminado los `console.log()` innecesarios o de depuración.
- [X] Mi código sigue la arquitectura y el estilo definido en el proyecto.
- [X] He añadido o actualizado los comentarios en funciones complejas.

## 💡 Notas adicionales para el revisor / Tutor
* **Nota sobre el Backend:** Para evitar que el RLS de Supabase bloquee la lectura de categorías al hacer el *JOIN*, me he asegurado de que el cliente global instanciado con la `SERVICE_ROLE_KEY` nunca sea sobreescrito. Las funciones `/login` y `/usuarios` (POST) ahora instancian su propio cliente local temporal.
* **Nota sobre la UI:** El efecto de "clic fuera para cerrar" en React Native se ha resuelto mediante un `<Pressable>` con posición absoluta y un `zIndex` calculado que actúa como escudo invisible por debajo del input pero por encima del formulario.