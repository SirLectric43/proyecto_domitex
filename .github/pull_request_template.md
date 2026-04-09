### 📝 Descripción
Implementación completa de la funcionalidad del carrito de compras (cesta), incluyendo el diseño responsivo, la integración con la base de datos y la sincronización global del estado mediante Context API.

**Backend (FastAPI & Supabase):**
* **Modelo de Datos Permanente:** Se han creado las tablas `carritos` (único por usuario) y `carrito_items` (almacena las referencias a las variantes exactas de `articulos_medidas`).
* **Seguridad y Aislamiento (RLS):** Se implementaron políticas Row Level Security en Supabase para asegurar que un usuario solo pueda acceder a su propia cesta. Además, FastAPI utiliza ahora la `SUPABASE_SERVICE_ROLE_KEY` para operar como backend autorizado de confianza.
* **Automatización de Base de Datos:** Creación de un Trigger (`crear_carrito_para_nuevo_usuario`) que inicializa automáticamente un carrito vacío en Supabase cada vez que un nuevo cliente se registra.
* **Endpoints CRUD del Carrito:**
    * `POST /carrito/anadir`: Añade artículos. Incluye lógica "upsert" (agrupa artículos idénticos sumando su cantidad en lugar de duplicar filas).
    * `GET /carrito`: Recupera los ítems haciendo un JOIN con las tablas de artículos y medidas.
    * `PUT /carrito/items/{item_id}`: Permite modificar la cantidad de un producto o eliminarlo de la base de datos si la cantidad llega a 0.

**Frontend (React Native & Expo):**
* **Página del Carrito (`app/carrito.tsx`):**
    * Listado dinámico de los productos añadidos, mostrando imagen, nombre, medida y precio unitario.
    * Controles interactivos para incrementar, decrementar o introducir la cantidad manualmente en un input, así como un botón "X" para eliminar artículos.
    * Panel de resumen lateral en escritorio, y apilado en móvil, con cálculos automáticos de Subtotal, IVA (21%) y Total de la compra.
* **Sincronización Reactiva (AuthContext):**
    * Se ha ampliado el `AuthContext` para almacenar el número total de artículos en la cesta de forma global.
    * La bolita de notificaciones (badge) del carrito en la barra de navegación (tanto en la versión de escritorio como en la barra inferior móvil) se actualiza instantáneamente desde cualquier pantalla de la aplicación gracias al estado global.
* **Añadir a la Cesta (`vista-articulo.tsx`):**
    * El botón ahora envía la petición asíncrona al backend para almacenar el artículo específico con su medida y cantidad exactas, actualizando el contexto global en caso de éxito.

## 🔗 Issue relacionado
Closes #10

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
* Se ha implementado el modelo de "Carrito Permanente", asegurando que la cesta del usuario persiste entre sesiones al almacenarse en la base de datos, en lugar de utilizar estados efímeros.
* Para garantizar la consistencia de los datos y evitar problemas de precios desactualizados, el carrito solo almacena los identificadores y las cantidades. El cálculo del precio total se realiza de forma dinámica y actualizada al recuperar los datos.