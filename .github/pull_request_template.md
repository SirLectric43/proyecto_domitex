### 📝 Descripción
Implementación de la vista principal del Catálogo y su integración completa (Full-Stack).

**Frontend (React Native):**
* Vista responsiva: Carrusel táctil en móvil (`FlatList`) y paginación con flechas en PC (`ScrollView` con `scrollTo`).
* Función "Ver todo / Ver menos" con animación nativa (`LayoutAnimation`).
* Tarjetas de tamaño fijo con enlaces (`expo-router`) a la vista detallada del producto.

**Backend (FastAPI):**
* Nuevo endpoint `GET /articulos`.
* Lógica de servidor para devolver los artículos ya agrupados por categoría (`itertools.groupby`), optimizando el rendimiento de la app.

**Base de Datos (Supabase):**
* Tabla `articulos` con datos de prueba y bucket público en **Storage** para las imágenes.
* Políticas **RLS de solo lectura** configuradas.

## 🔗 Issue relacionado
Closes #11

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
* **Arquitectura:** La agrupación por categoría se hace en el backend para quitarle carga de procesamiento al dispositivo móvil.
* **Seguridad:** El RLS está estricto en lectura. El cliente no puede alterar precios ni stock; eso se gestionará de forma segura por backend en la fase del carrito.
* **Animaciones:** Se ha habilitado `UIManager` para Android para que la expansión de la cuadrícula funcione fluidamente.![alt text](image.png)