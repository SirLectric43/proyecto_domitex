---
id: despliegues
title: 5. Despliegues y Compilación
sidebar_position: 5
---

# Guía de Despliegue en Producción

Domitex se distribuye en dos frentes simultáneos: **La web pública / backend API** (Vercel) y **Las aplicaciones móviles nativas** (EAS).

## 1. Despliegue Web y API (Vercel)

Vercel está conectado directamente al repositorio de GitHub. Hemos configurado el archivo `vercel.json` en la raíz para orquestar este monorepo (Python + React).

### Explicación del `vercel.json`

```json
{
  "version": 2,
  "builds": [
    { 
      "src": "backend/main.py", 
      "use": "@vercel/python"
    },
    { 
      "src": "node_expo_tfg/package.json", 
      "use": "@vercel/static-build" 
    }
  ],
  "rewrites": [
    { 
      "source": "/api/(.*)", 
      "destination": "backend/main.py" 
    },
    { 
      "source": "/([^.]*)", 
      "destination": "/node_expo_tfg/index.html" 
    },
    { 
      "source": "/(.*)", 
      "destination": "/node_expo_tfg/$1" 
    }
  ]
}
```

* **Builds:** Indica a Vercel que compile `main.py` usando Python, y que ejecute el build estático de Expo.
* **Rewrite 1 (`/api/*`):** Solicitudes que empiecen por `/api/` son enrutadas a FastAPI.
* **Rewrite 2 (`/([^.]*)`):** **Regla crítica para SPAs.** Rutas que no contienen un punto son redirigidas al `index.html`. Esto previene el Error 404 de Vercel al recargar la página.
* **Rewrite 3:** Las rutas con punto (archivos CSS, JS, `.png`) se entregan normalmente.

Para actualizar la web y el backend, basta con hacer un `git push` a GitHub.

## 2. Compilación Móvil Nativa (EAS Build)

La creación de instalables `.apk` y `.ipa` se delega a **Expo Application Services**. 

La configuración del empaquetado nativo (iconos, splash screen) reside en `node_expo_tfg/app.json`.

**Pasos para compilar un nuevo APK de Android:**

1. Abre la terminal y sitúate en el frontend: `cd node_expo_tfg`.
2. Lanza el proceso en la nube:
   ```bash
   eas build -p android --profile preview
   ```
3. Expo subirá tu código a sus servidores, compilará el código nativo, y devolverá un enlace con el `.apk` listo para instalar.

*(Nota: Si actualizas dependencias, es recomendable limpiar la caché añadiendo `--clear-cache` al comando).*