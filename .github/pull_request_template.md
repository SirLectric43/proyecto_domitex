### 📝 Descripción
Esta PR se centra en la **estandarización visual** y la **optimización de la experiencia de usuario (UX)** en dispositivos móviles y escritorio. Se han corregido errores de diseño responsivo y se ha implementado un sistema de estilos global para los botones de toda la aplicación.

**Cambios principales:**
*   **Estandarización de "Botones Universales":** Se han unificado los estilos de todos los botones del proyecto bajo tres categorías:
    *   **Primario:** Azul corporativo (`#29166F`), texto blanco, fuente negrita.
    *   **Secundario:** Gris claro (`#EEEEEE`), texto oscuro, fuente semi-negrita.
    *   **Peligro:** Rojo (`#DB3632`), texto blanco, fuente negrita.
    Esto asegura una coherencia total en radios de borde (8px), tipografías y rellenos (padding) en toda la interfaz.
*   **Optimización Responsiva en Formularios:**
    *   Se corrigió el desbordamiento de elementos en PC dentro de `agregar-articulo.tsx` y `vista-articulo.tsx`, asegurando que los botones de acción se mantengan dentro de los límites de la tarjeta.
    *   En `crear-usuario.tsx` y `administrar-usuario.tsx`, se ajustaron los formularios para que las filas se apilen verticalmente en móviles, evitando que textos largos (como el correo electrónico) se corten.
*   **Mejoras en la Navegación Móvil:** Se integró un botón de "Volver" (flecha ←) en el `NavbarPrivado` que aparece automáticamente en pantallas secundarias para facilitar la navegación en dispositivos móviles.
*   **Correcciones Técnicas y de Layout:**
    *   **TypeScript:** Se solucionó el error en `perfil-usuario.tsx` referente al número de argumentos en la llamada a `iniciarSesionContext`
    *   **Escritorio:** En `ver-pedido-admin.tsx`, se corrigió el fallo donde los botones de acción sobresalían de la pantalla en resoluciones de PC.
    *   **Funcionalidad:** Se preparó la interfaz para la nueva columna `disponible` en la tabla de artículos de Supabase.
*   **Ajustes Estéticos en Perfil:** Se reubicó el botón de "Cambiar contraseña" para que figure entre las opciones de historial y cierre de sesión, mejorando la jerarquía visual.

## 🔗 Issue relacionado
Closes #45

## 🚀 Tipo de cambio
- [X] ✨ Nueva funcionalidad (feature)
- [ ] 🐛 Corrección de error (bugfix)
- [X] ♻️ Refactorización (mejora de código sin añadir nueva funcionalidad)
- [X] 🎨 Mejoras de UI/UX o estilos (Tailwind / NativeWind)
- [ ] 🔧 Configuración del proyecto / Dependencias

## 📱 Cambios en la Interfaz (Si aplica)
| Antes | Después |
| ![alt text](ad_userA.png) | ![alt text](ad_userD.png) |
| ![alt text](ag_artA.png) | ![alt text](ag_artD.png) |
| ![alt text](cartA.png) | ![alt text](cartD.png) |
| ![alt text](catalogA.png) | ![alt text](catalogD.png) |
| ![alt text](c_userA.png) | ![alt text](c_userD.png) |
| ![alt text](g_pedA.png) | ![alt text](g_pedD.png) |
| ![alt text](g_userA.png) | ![alt text](g_userD.png) |
| ![alt text](loginA.png) | ![alt text](loginD.png) |
| ![alt text](navbarA.png) | ![alt text](navbarD.png) |
| ![alt text](p_adminA.png) | ![alt text](p_adminD.png) |
| ![alt text](p_userA.png) | ![alt text](p_userD.png) |
| ![alt text](registA.png) | ![alt text](registD.png) |
| ![alt text](vp_adminA.png) | ![alt text](vp_adminD.png) |
| ![alt text](v_artA.png) | ![alt text](v_artD.png) |
| *(Captura antigua o N/A)* | *(Captura nueva)* |

## ✅ Checklist de calidad antes de fusionar
- [X] He revisado mi propio código línea por línea antes de abrir esta PR.
- [X] He probado estos cambios en el emulador (Android/iOS) o en mi móvil físico con Expo Go y todo funciona correctamente.
- [X] El código compila sin errores ni advertencias (warnings) graves.
- [X] He eliminado los `console.log()` innecesarios o de depuración.
- [X] Mi código sigue la arquitectura y el estilo definido en el proyecto.
- [X] He añadido o actualizado los comentarios en funciones complejas.

## 💡 Notas adicionales para el revisor / Tutor
