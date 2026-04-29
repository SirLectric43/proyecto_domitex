### 📝 Descripción
Implementación completa del módulo de **Gestión de Usuarios** para el panel de administración. Se ha desarrollado todo el flujo (CRUD) que permite a los administradores tener un control total sobre las cuentas registradas en la plataforma.

**Nuevas funcionalidades añadidas:**
1. **Listado de Usuarios (`gestion-usuarios.tsx`):** Nueva pantalla con una tabla interactiva que muestra a todos los usuarios registrados, indicando su nombre, teléfono y rol. Incluye accesos directos para administrar o eliminar cada cuenta.
2. **Creación de Usuarios desde Admin (`crear-usuario.tsx`):** Formulario dedicado para que el administrador pueda registrar nuevas cuentas (clientes, admins o empresas) directamente, asignando el rol deseado. Las cuentas se crean ya verificadas a través de la API de administración de Supabase.
3. **Administración Detallada (`administrar-usuario.tsx`):** Vista avanzada del perfil de un usuario específico. Permite editar sus datos personales y su rol de forma individual, visualizar información clave como la **Fecha de registro** y el **Último acceso** (formateado con fecha y hora), acceder a su historial de compras y dar de baja la cuenta.
4. **Backend (FastAPI):** Creación de los nuevos endpoints protegidos para administradores:
   - `GET /usuarios`: Listado completo.
   - `POST /admin/usuarios`: Creación de cuenta con asignación de rol.
   - `PUT /admin/usuarios/{id}`: Edición de perfil y rol.
   - `DELETE /admin/usuarios/{id}`: Eliminación completa de la cuenta tanto de la tabla pública como del sistema de Auth.

## 🔗 Issue relacionado
Closes #17

## 🚀 Tipo de cambio
- [X] ✨ Nueva funcionalidad (feature)
- [ ] 🐛 Corrección de error (bugfix)
- [ ] ♻️ Refactorización (mejora de código sin añadir nueva funcionalidad)
- [X] 🎨 Mejoras de UI/UX o estilos (Tailwind / NativeWind)
- [ ] 🔧 Configuración del proyecto / Dependencias

## 📱 Cambios en la Interfaz (Si aplica)
| Antes | Después |
| --- | ![alt text](capturaPC1.png) |
| --- | ![alt text](capturaMovil1.png) |
| --- | ![alt text](capturaPC2.png) |
| --- | ![alt text](capturaMovil2.png) |
| *(Captura antigua o N/A)* | *(Captura nueva)* |

## ✅ Checklist de calidad antes de fusionar
- [X] He revisado mi propio código línea por línea antes de abrir esta PR.
- [X] He probado estos cambios en el emulador (Android/iOS) o en mi móvil físico con Expo Go y todo funciona correctamente.
- [X] El código compila sin errores ni advertencias (warnings) graves.
- [X] He eliminado los `console.log()` innecesarios o de depuración.
- [X] Mi código sigue la arquitectura y el estilo definido en el proyecto.
- [X] He añadido o actualizado los comentarios en funciones complejas.

## 💡 Notas adicionales para el revisor / Tutor
* **Selector de Roles:** Se ha diseñado un componente de selección de roles personalizado con buscador integrado y funcionalidad "Click-Outside" (al hacer clic fuera de la caja de opciones, esta se cierra automáticamente).
* **Gestión de Permisos:** Todos los endpoints nuevos en el backend verifican explícitamente el token y el rol del emisor para garantizar que solo un usuario con rol `admin` pueda interactuar con estas rutas.
* **Borrado en Cascada:** Para la funcionalidad de "Dar de baja", la base de datos en Supabase está configurada con `ON DELETE CASCADE` en las claves foráneas, de modo que al eliminar al usuario desde el backend, todos sus datos relacionados (carritos, pedidos, etc.) se limpian automáticamente de forma segura.
* **Navegación Segura:** Las nuevas pantallas (`gestion-usuarios`, `crear-usuario` y `administrar-usuario`) han sido integradas en el `_layout.tsx` principal para protegerlas y restringir su acceso exclusivamente a administradores.