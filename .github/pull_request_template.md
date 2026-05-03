### 📝 Descripción
Esta PR incluye varias correcciones de bugs relacionadas con la gestión del estado global del usuario y una refactorización crítica en la lógica de control de stock y precios desde el backend.

**Resumen de los cambios implementados:**

*   **Actualización dinámica del Navbar para Administradores:** Se solucionó el error en `administrar-usuario.tsx` donde el nombre del administrador no se actualizaba en el `NavbarPrivado` al editar su propio perfil. Se ha añadido una validación para refrescar el contexto global (`iniciarSesionContext`) si el ID del usuario editado coincide con el del administrador activo.
*   **Refactorización del Flujo de Compra (Control de Stock real):** 
    *   Se ha modificado el endpoint `/pedidos/confirmar` para que el stock de los productos se reste **exclusivamente al confirmar el pedido**, solucionando el problema de inventario bloqueado por carritos abandonados.
    *   Se ha añadido una validación de seguridad que comprueba si hay stock disponible para cada artículo del carrito *antes* de generar el pedido. Si falta stock, devuelve un error específico con el nombre del producto agotado.
*   **Validaciones de Precios y Disponibilidad Automática:**
    *   En los endpoints de creación (`POST /articulos`) y actualización (`PUT /articulos/{articulo_id}`), se ha incluido una restricción que impide guardar artículos con precios negativos (lanzando un error HTTP 400).
    *   Tanto al comprar un artículo como al editarlo desde el panel de administrador, si la cantidad de stock se establece en `0` o en un número negativo, la columna `disponible` pasará automáticamente a `False`.

## 🔗 Issue relacionado
Closes #56

## 🚀 Tipo de cambio
- [ ] ✨ Nueva funcionalidad (feature)
- [X] 🐛 Corrección de error (bugfix)
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
El frontend no necesita cambios adicionales para mostrar los errores de stock agotado al confirmar la compra, ya que la nueva excepción HTTP 400 en FastAPI envía un mensaje limpio ("Sin stock suficiente para...") que es capturado directamente por las alertas ya configuradas en el Carrito.