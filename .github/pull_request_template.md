### 📝 Descripción
Este PR finaliza la configuración del monorepo para su despliegue automático en Vercel, permitiendo que tanto el frontend (Expo/React Native) como el backend (FastAPI/Python) coexistan bajo el mismo dominio (`domitex.vercel.app`). Se han unificado las rutas de consumo de la API para asegurar la compatibilidad entre la versión Web y la futura APK de Android.

## 🔗 Issue relacionado
Closes #

## 🚀 Tipo de cambio
- [ ] ✨ Nueva funcionalidad (feature)
- [ ] 🐛 Corrección de error (bugfix)
- [X] ♻️ Refactorización (mejora de código sin añadir nueva funcionalidad)
- [ ] 🎨 Mejoras de UI/UX o estilos (Tailwind / NativeWind)
- [X] 🔧 Configuración del proyecto / Dependencias

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
Se ha cambiado la **Production Branch** en el panel de Vercel a la rama `develop` para facilitar las pruebas constantes antes del merge final a `main`. Tras la aprobación de este PR, el proyecto está listo para generar la APK estable mediante `eas build`.