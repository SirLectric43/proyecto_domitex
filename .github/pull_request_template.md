### 📝 Descripción
Se ha rediseñado y mejorado la navegación exclusiva para dispositivos móviles (`navbar-privado.tsx`), optimizando el espacio y la experiencia de usuario:

* **Barra de navegación inferior (Mobile-only):** Se ha implementado un *Bottom Tab Nav* fijado al fondo de la pantalla (`bottom: 0`). Contiene accesos directos al Catálogo (Inicio), Búsqueda y Carrito de compras.
* **Búsqueda flotante:** Se eliminó la barra de búsqueda dentro del menú desplegable. Ahora, al pulsar la lupa en la barra inferior, se despliega una barra de búsqueda flotante justo debajo del navbar superior.
* **Reorganización del Navbar superior:** Se ha añadido el icono de notificaciones (Campana) al navbar superior en la vista móvil, acompañando al icono del menú desplegable.

## 🔗 Issue relacionado
Closes #21

## 🚀 Tipo de cambio
- [X] ✨ Nueva funcionalidad (feature)
- [ ] 🐛 Corrección de error (bugfix)
- [ ] ♻️ Refactorización (mejora de código sin añadir nueva funcionalidad)
- [X] 🎨 Mejoras de UI/UX o estilos (Tailwind / NativeWind)
- [ ] 🔧 Configuración del proyecto / Dependencias

## 📱 Cambios en la Interfaz (Si aplica)
| Antes | Después |
| --- | --- |
| --- | ![alt text](capturaMovil.jpeg) |
| *(Captura antigua o N/A)* | *(Captura nueva)* |

## ✅ Checklist de calidad antes de fusionar
- [X] He revisado mi propio código línea por línea antes de abrir esta PR.
- [X] He probado estos cambios en el emulador (Android/iOS) o en mi móvil físico con Expo Go y todo funciona correctamente.
- [X] El código compila sin errores ni advertencias (warnings) graves.
- [X] He eliminado los `console.log()` innecesarios o de depuración.
- [X] Mi código sigue la arquitectura y el estilo definido en el proyecto.
- [X] He añadido o actualizado los comentarios en funciones complejas.

## 💡 Notas adicionales para el revisor / Tutor
* **Arquitectura de Layout:** Para evitar conflictos con el área segura (Safe Area) y asegurar que el footer móvil quede al final del todo, se han evitado contenedores globales con `zIndex` restrictivo en favor del uso de fragmentos (`<></>`) y `bottom: 0` estricto, lo que garantiza el correcto funcionamiento en cualquier tamaño de pantalla de iOS o Android.