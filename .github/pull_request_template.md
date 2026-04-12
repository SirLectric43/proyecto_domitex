### 📝 Descripción
Implementación de la vista de Detalles del Pedido para que el usuario pueda consultar los artículos específicos de una compra pasada.

* **Backend (FastAPI):**
  * Nuevo endpoint `GET /pedidos/{pedido_id}` que obtiene la información completa de un pedido específico, haciendo un JOIN con `lineas_pedido`, `articulos_medidas` y `articulos` para devolver todos los datos necesarios en una sola petición.
* **Frontend (React Native / Expo):**
  * Creación de la pantalla `ver-pedido.tsx` con un diseño responsivo (dos columnas en PC, apilado en móvil) similar al carrito, pero de solo lectura (sin controles de cantidad).
  * La tarjeta de resumen ahora incluye el cálculo de Subtotal, IVA (21%), Total y el **Estado actual del pedido** con colores dinámicos.
  * Actualización en `historial-compra.tsx` para que el botón "Detalles de pedido" navegue a la nueva vista pasando el `pedidoId` correspondiente por parámetros.

## 🔗 Issue relacionado
Closes #14

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
* La vista de detalles reutiliza la experiencia de usuario (UX) de la cesta de la compra para mantener la consistencia en el diseño, pero adaptando los controles para ser puramente informativos (estáticos).
* El estado del pedido se muestra visualmente destacado con colores dinámicos para informar al usuario del progreso de su compra.