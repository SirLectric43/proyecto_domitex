### 📝 Descripción
Este Pull Request implementa el flujo completo de registro de usuarios para la aplicación **Domitex**, abarcando desde la interfaz gráfica en el frontend hasta la persistencia segura de datos y triggers automáticos en la base de datos.

**Cambios principales:**
1. **Frontend (Expo / React Native):**
   - Creación de la pantalla `registro.tsx` con un diseño fiel al prototipo (banner corporativo, formulario adaptativo).
   - Implementación de un checkbox personalizado sin dependencias externas.
   - Validaciones de formulario (campos obligatorios, coincidencia de contraseñas, aceptación de términos).
   - Conexión con el backend mediante `fetch` capturando e interpretando los errores de validación (`422 Unprocessable Entity`).
2. **Backend (Python / FastAPI):**
   - Creación de la estructura del servidor en `main.py` con `uvicorn`.
   - Configuración estricta de CORS para comunicación entre móvil/web y el backend.
   - Uso de `Pydantic` (`RegistroUsuario`) para tipar y validar fuertemente los datos de entrada (nombre, apellidos, correo, contraseña, teléfono, dirección).
   - Integración con el SDK de Supabase para delegar la autenticación de forma segura.
   - Configuración segura de variables de entorno (`.env`) con `python-dotenv`.
3. **Base de Datos (Supabase / PostgreSQL):**
   - Creación de la tabla pública `usuarios` adaptada al diagrama UML del proyecto.
   - Implementación de **Row Level Security (RLS)** para proteger la lectura y escritura de los datos.
   - Creación de una **Función y un Trigger SQL** que inserta automáticamente los datos personales del usuario en la tabla pública *solo* cuando este verifica su correo electrónico.
4. **Email & Diseño:**
   - Diseño de una plantilla HTML corporativa para el correo de verificación de Supabase.
## 🔗 Issue relacionado
Closes #2

## 🚀 Tipo de cambio
- [X] ✨ Nueva funcionalidad (feature)
- [ ] 🐛 Corrección de error (bugfix)
- [ ] ♻️ Refactorización (mejora de código sin añadir nueva funcionalidad)
- [ ] 🎨 Mejoras de UI/UX o estilos (Tailwind / NativeWind)
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
* **Seguridad de Contraseñas:** Siguiendo los estándares actuales de ciberseguridad, se ha decidido **NO** almacenar la contraseña en texto plano (ni hasheada manualmente) dentro de la tabla pública `usuarios`. La gestión de credenciales se ha delegado íntegramente al proveedor de identidad (Supabase Auth), que las almacena de forma invisible y cifrada en su esquema interno.
* **Sincronización de Datos (Triggers):** Para evitar inconsistencias entre el servicio de autenticación y nuestra base de datos pública, se ha implementado un *Trigger* en PostgreSQL. Los datos personales del usuario (nombre, apellidos, dirección...) viajan como *metadata* en la petición de registro, y la base de datos se encarga de insertarlos en la tabla `usuarios` de forma automática **únicamente** cuando el correo electrónico ha sido verificado.
* **Robustez en el Backend:** Se ha utilizado `Pydantic` en FastAPI para garantizar que el tipado de los datos recibidos desde la aplicación móvil sea estricto antes de procesar cualquier lógica de negocio, devolviendo errores 422 legibles en caso de fallos de validación.