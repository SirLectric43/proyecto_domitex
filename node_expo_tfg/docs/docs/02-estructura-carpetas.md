---
id: estructura
title: 3. Estructura de Carpetas y Patrones
sidebar_position: 3
---

# Estructura del Proyecto

El repositorio sigue un patrón de **monorepo**, donde coexisten la lógica de servidor y la aplicación cliente. Esta estructura ha sido optimizada para un despliegue unificado en Vercel.

## Árbol de Directorios Principal

```text
/
├── vercel.json                 # Reglas de enrutamiento y despliegue global para Vercel
├── .github/                    # Plantillas para Pull Requests y flujos de trabajo
├── backend/                    # --- BACKEND (Python) ---
│   ├── main.py                 # Core de la API (Endpoints, rutas REST, modelos Pydantic)
│   └── requirements.txt        # Dependencias de Python
└── node_expo_tfg/              # --- FRONTEND (Expo/React Native) ---
    ├── app/                    # Vistas y Rutas (Expo Router)
    │   ├── _layout.tsx         # Layout principal (envoltura de Context Providers)
    │   ├── index.tsx           # Landing Page pública
    │   ├── login.tsx           # Vista de inicio de sesión
    │   ├── catalogo.tsx        # Explorador de artículos y adición a la cesta
    │   ├── carrito.tsx         # Gestión del carrito y checkout del pedido
    │   ├── historial-compra.tsx# Historial del usuario y generación de PDF
    │   ├── panel-administrador.tsx # Dashboard para admins/empleados
    │   ├── gestion-pedidos.tsx # Panel de control de estados de pedidos (Admin)
    │   └── ...                 
    ├── context/             # Componentes de contexto global
    │   ├── auth-context.tsx    # Contexto de Sesión, Token, Rol y Carrito en tiempo real
    │   └── alerta-context.tsx  # Sistema global de modales (Alertas de éxito/error)
    ├── utils/
    │   └── errores.ts          # Diccionario para traducir errores de Supabase al español
    ├── assets/                 # Recursos estáticos (imágenes, fuentes, iconos)
    ├── package.json            # Dependencias del frontend
    ├── app.json                # Configuración de compilación Expo
    └── eas.json                # Perfiles de compilación para EAS Build
```

## Patrones de Diseño del Frontend

1.  **Enrutamiento Declarativo:** Usamos `expo-router`. Cada archivo `.tsx` dentro de `/app` es automáticamente una ruta web y móvil. Por ejemplo, `/app/perfil-usuario.tsx` se mapea a `domitex.com/perfil-usuario`.
2.  **Gestión de Estado (Context API):** El `AuthContext` (en `auth-context.tsx`) es el corazón de la sesión. Guarda el JWT, verifica si el usuario es `admin` o `cliente`, y mantiene actualizado un contador global (`cantidadCesta`) para que el ícono del carrito refleje los cambios instantáneamente.
3.  **Componentes Condicionales (Responsive):** Para compartir el mismo código entre la Web y Móvil, usamos el hook `useWindowDimensions()` de React Native. Gran parte de las vistas hacen validaciones como `const esMovil = width < 768;` para adaptar la interfaz.