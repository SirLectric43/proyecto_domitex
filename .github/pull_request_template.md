### 📝 Descripción
Se ha implementado el sistema completo de "Perfil de Usuario" (Frontend y Backend), permitiendo la lectura y edición de datos personales, así como el cambio seguro de contraseña. 

**Frontend (`app/perfil-usuario.tsx`):**
* Diseño responsivo: Layout de 2 columnas en PC y 1 columna apilada al 100% de ancho en móviles.
* Interfaz minimalista: Inputs con edición en línea mediante un icono de lápiz (sin bordes intrusivos y con `outlineStyle: none` en web).
* Funcionalidad de autoguardado (silencioso) al desmarcar la edición de un campo.
* Tarjeta flotante (Modal) centrado y oscurecido para el cambio de contraseña.
* Corrección del Scroll y Flexbox para que el `Footer` se mantenga siempre al final del contenido sin superponerse a los botones de acción en la versión móvil.
* Configuración de cabeceras (`Cache-Control: no-cache`) en el `fetch` para evitar mostrar datos antiguos cacheados.

**Backend (`main.py`):**
* Nuevos modelos Pydantic (`ActualizarUsuario`, `CambiarContrasena`) con soporte para campos opcionales.
* Endpoint `GET /usuarios/{usuario_id}` inteligente: lee de la tabla pública y rescata metadatos (como el correo o el nombre) directamente desde la bóveda de Supabase Auth si la tabla está vacía.
* Endpoint `PUT /usuarios/{usuario_id}` modificado para usar `upsert`, creando la fila automáticamente si el usuario no existía previamente en la tabla pública.
* Endpoint `PUT /usuarios/{usuario_id}/contrasena` que valida estrictamente la contraseña actual contra Auth antes de permitir la actualización a la nueva.
* Refactorización del endpoint de `login` para que el Navbar reciba siempre el nombre actualizado de la base de datos en lugar de los metadatos antiguos.

## 🔗 Issue relacionado
Closes #15

## 🚀 Tipo de cambio
- [X] ✨ Nueva funcionalidad (feature)
- [ ] 🐛 Corrección de error (bugfix)
- [ ] ♻️ Refactorización (mejora de código sin añadir nueva funcionalidad)
- [X] 🎨 Mejoras de UI/UX o estilos (Tailwind / NativeWind)
- [ ] 🔧 Configuración del proyecto / Dependencias

## 📱 Cambios en la Interfaz (Si aplica)
| Antes | Después |
| --- | ![alt text](capturaPC.png) |
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
* **Sincronización Auth vs BD Pública:** Se ha implementado un mecanismo de seguridad y fallback. Si la tabla de usuarios está vacía, el backend lee directamente los `user_metadata` de Supabase Auth para garantizar que el usuario nunca vea su perfil vacío. Al guardar por primera vez, se usa `upsert` para sincronizar ambas partes.
* **Seguridad en Contraseñas:** El cambio de contraseña exige la validación cruzada con la contraseña actual, delegando la seguridad criptográfica al token `Bearer` y a los métodos nativos de Supabase.
* **Manejo de Caché en Expo Router:** Se han inyectado cabeceras estrictas (`Pragma: no-cache`, `Expires: 0`) para evitar que el navegador/móvil retenga datos antiguos de las peticiones `GET` al recargar el perfil.