### 📝 Descripción
Implementación del flujo de navegación entre el Catálogo y la Vista Detallada de Producto (Full-Stack).

**Frontend (React Native):**
* **Catálogo:** Vista responsiva (carrusel táctil en móvil, paginación nativa en PC) y enlaces a la vista detallada.
* **Vista Detallada (`vista-articulo.tsx`):** Diseño responsivo (grid en PC, columna en móvil). Incluye selector de medidas que actualiza el precio dinámicamente, contador de cantidad unitaria (+/-) y botón para añadir a la cesta.

**Backend (FastAPI):**
* **Catálogo (`GET /articulos`):** Agrupación lógica en servidor (`itertools.groupby`).
* **Detalle (`GET /articulos/{id}`):** Consulta del artículo principal y anidación relacional de sus medidas/variantes.

**Base de Datos (Supabase):**
* Estructura relacional completa: `articulos` (datos base) y `articulos_medidas` (variantes, precios y stock).
* Políticas **RLS estricto de solo lectura** configuradas para los clientes.
* *Nota:* Definida la arquitectura relacional futura para el carrito de compras (`carritos` y `carrito_items`).

## 🔗 Issue relacionado
Closes #12

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
* **UX/UI:** En la vista detallada, el precio cambia dinámicamente al seleccionar la medida. Se ha añadido la etiqueta "(Precio unitario)" para evitar confusiones al aumentar la cantidad a comprar.
* **Arquitectura de Base de Datos:** Se ha normalizado el producto separando los datos generales de sus variantes. Esto es vital para llevar un control estricto del stock y precios específicos en la futura implementación del carrito y pagos.