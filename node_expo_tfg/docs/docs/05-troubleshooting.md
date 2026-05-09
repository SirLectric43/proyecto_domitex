---
id: troubleshooting
title: 6. Problemas Comunes (Troubleshooting)
sidebar_position: 6
---

# Guía de Solución de Problemas

Durante el desarrollo de Domitex nos encontramos con varios retos técnicos y bugs multiplataforma. A continuación se documentan los problemas y las soluciones definitivas implementadas en el código base.

## 1. Error en la generación y descarga de PDFs (Albaranes)

**Síntoma:** Al intentar generar el PDF del pedido, en la web se abría mal o no funcionaba, y en el móvil el uso de librerías de sistema de archivos daba errores de permisos o se quedaba colgado.
**Causa:** React Native Web y las plataformas nativas manejan los archivos de manera completamente diferente. Intentar usar un enfoque único basado en manipular archivos locales fallaba.
**Solución:** Se implementó un enfoque híbrido dependiendo de la plataforma (`Platform.OS`). 
* Para la **Web**, inyectamos un `iframe` invisible en el DOM con el HTML generado, invocamos la ventana de impresión nativa del navegador y luego eliminamos el `iframe`.
* Para **Móvil (Android/iOS)**, usamos `expo-print` para generar el archivo y `expo-sharing` para levantar el menú de compartir del sistema, omitiendo por completo librerías problemáticas como `expo-file-system`.

```tsx
if (Platform.OS === 'web') {
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
  iframe.contentDocument?.write(htmlContent);
  iframe.contentDocument?.close();
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print(); 
    setTimeout(() => document.body.removeChild(iframe), 2000);
  }, 500);
} else {
  const { uri } = await Print.printToFileAsync({ html: htmlContent, base64: false });
  await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
}
```

## 2. Usuarios residuales sin verificar en la Base de Datos

**Síntoma:** La tabla `auth.users` de Supabase se llenaba de usuarios que iniciaban el proceso de registro pero nunca confirmaban el correo electrónico, dejando "cuentas fantasma".
**Causa:** Supabase crea el registro en la base de datos inmediatamente para poder enviar el correo de validación. Si el usuario abandona, el registro se queda ahí para siempre.
**Solución:** Activamos la extensión `pg_cron` en PostgreSQL para automatizar la limpieza. Se creó un evento que se ejecuta diariamente a las 3:00 AM para borrar automáticamente las cuentas no verificadas pasadas 24 horas.

```sql
SELECT cron.schedule(
  'borrar-usuarios-no-verificados',
  '0 3 * * *', 
  $$
    DELETE FROM auth.users 
    WHERE email_confirmed_at IS NULL 
    AND created_at < now() - interval '24 hours';
  $$
);
```

## 3. Integridad de facturas: Descatalogar vs. Eliminar Artículos

**Síntoma:** Si un administrador borraba un artículo usando un clásico comando `DELETE`, la base de datos arrojaba un error de clave foránea (Foreign Key) o, peor aún, borraba en cascada el historial de pedidos de los clientes que habían comprado ese artículo en el pasado.
**Causa:** La tabla `lineas_pedido` depende estrictamente de que el artículo exista para mostrar el historial de compras.
**Solución:** Implementar **"Soft Deletes" (Eliminación Lógica)**. En el panel de administrador, en lugar de eliminar el artículo de la base de datos, simplemente se "descataloga" cambiando su estado (por ejemplo, el campo de disponibilidad de la variante a `false`). De esta manera, el artículo desaparece del catálogo público, pero su información sigue intacta para que los PDFs de compras antiguas se sigan generando correctamente.

## 4. Error 404 en Vercel al recargar la página

**Síntoma:** La navegación web funcionaba perfecta al hacer clics en los enlaces, pero si el usuario pulsaba F5 (recargar) estando en `/catalogo` o `/login`, Vercel devolvía una pantalla de "Error 404: Not Found".
**Causa:** Al ser una SPA (Single Page Application), solo existe un archivo real (`index.html`). Vercel intentaba buscar una carpeta literal llamada `catalogo` que no existía en el servidor.
**Solución:** Se incluyó un archivo `vercel.json` en la raíz del proyecto con una regla *rewrite* mediante expresiones regulares que fuerza a Vercel a redirigir cualquier ruta que no sea un archivo (es decir, que no tenga un punto `.`) directamente al `index.html`.