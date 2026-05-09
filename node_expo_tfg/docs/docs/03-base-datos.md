---
id: base-datos
title: 4. Base de Datos (Supabase)
sidebar_position: 4
---

# Modelo de Base de Datos y Supabase

Domitex utiliza **PostgreSQL** provisionado por Supabase. La base de datos es el pilar central que garantiza la inmutabilidad de los pedidos y el control de inventario.

## Diccionario de Datos (Tablas Clave)

### 1. Usuarios y Autenticación
* **`auth.users` (Interna de Supabase):** Gestiona la autenticación segura, contraseñas encriptadas y confirmación de emails.
* **`usuarios`:** Es el reflejo público. La clave principal (`id`) coincide con `auth.users.id`. Almacena: `nombre`, `apellidos`, `telefono`, `direccion`, `rol` (admin, empleado, cliente) y `ultimo_acceso`.

### 2. Catálogo e Inventario
* **`categorias`:** ID y nombre de la categoría de productos.
* **`articulos`:** Información genérica del producto (`nombre`, `descripcion`, `imagen_url`, `categoria_id`).
* **`articulos_medidas`:** Tabla transaccional crítica. Un artículo puede tener múltiples medidas. Esta tabla almacena `precio`, `medida`, `stock` actual, y un flag booleano `disponible`. Es la tabla que se consulta y descuenta al confirmar compras.

### 3. Sistema de Compras y Pedidos
* **`carritos` & `carrito_items`:** Tablas temporales. Vinculan un usuario con los `articulos_medidas` que desea comprar antes del pago.
* **`pedidos`:** Cabecera de la factura final. Contiene `usuario_id`, `referencia` autogenerada (ej. "00005A"), `fecha_pedido`, `estado`, `total` y `tipo_entrega` (recogida/envio).
* **`lineas_pedido`:** Inmutabilidad pura. Plasma permanentemente los detalles de la compra, incluyendo el `precio_unitario` en el momento de la compra para que cambios futuros en el precio no afecten facturas antiguas.

## Interacción entre FastAPI y Supabase

En nuestro archivo `/backend/main.py`, usamos la librería oficial `supabase-python`. 

### Generación Automática de Referencias de Pedido
Cuando se llama al endpoint `/api/pedidos/confirmar`, FastAPI consulta el último pedido de la tabla `pedidos`, extrae su referencia (ej. `00123B`), la convierte a entero, le suma 1 (`00124B`) y si llega al máximo (`99999`), avanza la letra alfabéticamente (`00001C`).

### Automatización por Cron (Limpieza de registros)
Se implementó una función SQL automática (`pg_cron`) que se ejecuta todos los días a las 3:00 AM para borrar a los usuarios que crearon la cuenta pero no validaron el correo en 24 horas:

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