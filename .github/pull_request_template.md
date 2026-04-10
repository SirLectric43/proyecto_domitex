### 📝 Descripción
Implementación de la confirmación de pedidos y la pantalla de historial de compras.

* **Base de datos:** Creación de las tablas `pedidos` y `lineas_pedido` con políticas de seguridad (RLS) para garantizar que cada usuario solo acceda a su propia información.
* **Backend (FastAPI):** * Nuevo endpoint `POST /pedidos/confirmar` que transfiere los artículos del carrito a un pedido formal, congelando el precio unitario y vaciando la cesta.
  * Sistema de generación de referencias de pedido secuenciales automáticas (ej. `00001A` hasta `99999Z`).
  * Nuevo endpoint `GET /pedidos/historial` para obtener la lista de pedidos de un usuario ordenados por fecha.
* **Frontend (React Native / Expo):** * Creación de la nueva pantalla `historial-compra.tsx` con diseño responsivo (PC y móvil) para visualizar el estado, fecha y total de cada pedido.
  * Actualización de la vista del carrito para procesar la compra mediante el nuevo endpoint y limpiar el estado global (`AuthContext`) al finalizar.

## 🔗 Issue relacionado
Closes #13

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
* La confirmación del pedido garantiza la inmutabilidad de los datos históricos: se guarda el `precio_unitario` exacto en el momento de la transacción en `lineas_pedido`.
* El sistema de referencias (ej. `00001A`) es secuencial y evita duplicados en base de datos.