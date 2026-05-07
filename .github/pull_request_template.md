### 📝 Descripción
**Resumen de cambios:**
* **Bugfixes críticos (Android):** Eliminación de etiquetas HTML nativas y propiedades `gap` en `ScrollView` que provocaban crasheos fatales. Solucionado el error de los "puntos invisibles" en los campos de contraseña en Android anulando el `fontFamily`.
* **Paginación global:** Adaptación de las vistas (`catalogo`, `historial-compra`, `gestion-usuarios`, `gestion-pedidos`) para procesar el nuevo formato de respuesta del backend (`{ data, total_pages }`).
* **Soft Delete (Catálogo):** Se ha sustituido la eliminación física de artículos por la función "Descatalogar" para proteger la integridad referencial de los pedidos. Los artículos descatalogados (agotados) desaparecen para los clientes pero siguen visibles para los administradores.
* **Sistema de Alertas (Toast):** Refactorizado `alerta-context.tsx` para usar notificaciones flotantes animadas y no bloqueantes, con bordes laterales dinámicos según el tipo de mensaje (Éxito, Error, Info).
* **Mejoras de UI/UX y Layout:** * El Footer ahora se mantiene siempre al fondo de la pantalla durante las cargas (`minHeight` dinámico).
  * Auto-scroll a la parte superior de la página (`y: 0`) al navegar entre rutas.
  * Añadida máscara visual (DD/MM/YYYY) para los filtros de fecha, con conversión automática para la API (YYYY-MM-DD).
  * Estilos de "cápsula" dinámicos en las tarjetas de historial de pedidos según el estado del pedido.
* **Control de accesos (Roles):** Se han ocultado elementos exclusivos de cliente (Carrito, Notificaciones, Historial de compra) en el Navbar y el Perfil cuando el usuario logueado es Administrador.

## 🔗 Issue relacionado
Closes #67

## 🚀 Tipo de cambio
- [X] ✨ Nueva funcionalidad (feature)
- [ ] 🐛 Corrección de error (bugfix)
- [X] ♻️ Refactorización (mejora de código sin añadir nueva funcionalidad)
- [X] 🎨 Mejoras de UI/UX o estilos (Tailwind / NativeWind)
- [ ] 🔧 Configuración del proyecto / Dependencias

## 📱 Cambios en la Interfaz (Si aplica)
| Antes | Después |
|  ---  |   ---   |


## ✅ Checklist de calidad antes de fusionar
- [X] He revisado mi propio código línea por línea antes de abrir esta PR.
- [X] He probado estos cambios en el emulador (Android/iOS) o en mi navegador web y los títulos cambian correctamente.
- [X] El código compila sin errores ni advertencias (warnings) graves.
- [X] He eliminado los `console.log()` innecesarios o de depuración.
- [X] Mi código sigue la arquitectura y el estilo definido en el proyecto.
- [X] He añadido o actualizado los comentarios en funciones complejas.

## 💡 Notas adicionales para el revisor / Tutor
* **Integridad Referencial:** Se ha optado por implementar un *Soft Delete* ("Descatalogar") en los artículos en lugar de un borrado en cascada para evitar que los historiales de compra de los clientes fallen o queden huérfanos. Si un admin descataloga un artículo, la API filtra automáticamente esos datos para los clientes.
* **TypeScript en el contexto de alertas:** Se ha utilizado `ReturnType<typeof setTimeout>` en `alerta-context.tsx` para evitar advertencias de tipado estrictas al compilar en diferentes entornos (Web vs Native).