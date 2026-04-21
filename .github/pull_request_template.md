### 📝 Descripción
Implementación de la primera fase del Panel de Administrador y la lógica de autenticación basada en roles (Role-Based Access Control).

* **Vista Panel Admin (`panel-admin.tsx`):** Creación de la pantalla principal de administración con un diseño responsivo. Incluye tres tarjetas de opciones (Gestionar catálogo, Gestionar usuarios, Validación de pedidos) adaptadas tanto para pantallas de PC como para dispositivos móviles, manteniendo la disposición de imagen a la izquierda y controles a la derecha.
* **Backend (`main.py`):** Modificación del endpoint de autenticación para consultar la base de datos de Supabase y devolver el `rol` del usuario (`admin` o `cliente`) al iniciar sesión.
* **Contexto de Autenticación (`auth-context.tsx`):** Ampliación del proveedor de contexto y `AsyncStorage` para guardar y gestionar globalmente el rol del usuario autenticado.
* **Lógica de Redirección (`login.tsx` e `index.tsx`):** Implementación de enrutamiento condicional. Si el usuario logueado tiene el rol `admin`, es redirigido automáticamente a `/panel-administrador`. Si es un usuario normal, va a `/catalogo`.

## 🔗 Issue relacionado
Closes #16

## 🚀 Tipo de cambio
- [X] ✨ Nueva funcionalidad (feature)
- [ ] 🐛 Corrección de error (bugfix)
- [ ] ♻️ Refactorización (mejora de código sin añadir nueva funcionalidad)
- [X] 🎨 Mejoras de UI/UX o estilos (Tailwind / NativeWind)
- [ ] 🔧 Configuración del proyecto / Dependencias

## 📱 Cambios en la Interfaz (Si aplica)
| Antes | Después |
| --- | ![alt text](capturaPC.png) |
| --- | ![alt text](capturaMovil.png) |
| *(Captura antigua o N/A)* | *(Captura nueva)* |

## ✅ Checklist de calidad antes de fusionar
- [X] He revisado mi propio código línea por línea antes de abrir esta PR.
- [X] He probado estos cambios en el emulador (Android/iOS) o en mi móvil físico con Expo Go y todo funciona correctamente.
- [X] El código compila sin errores ni advertencias (warnings) graves.
- [X] He eliminado los `console.log()` innecesarios o de depuración.
- [X] Mi código sigue la arquitectura y el estilo definido en el proyecto.
- [X] He añadido o actualizado los comentarios en funciones complejas.

## 💡 Notas adicionales para el revisor / Tutor
* **Creación de Administradores:** Por motivos de seguridad y para no interferir con los *Triggers* actuales, los usuarios administradores se crean registrando una cuenta normal en la aplicación y cambiando su campo `rol` de `cliente` a `admin` directamente desde el Table Editor de Supabase.
* Los botones del panel de administración ("Gestionar catálogo", etc.) tienen el diseño final pero de momento carecen de la funcionalidad de enrutamiento (`onPress`), a la espera de desarrollar las pantallas destino en los próximos pasos.