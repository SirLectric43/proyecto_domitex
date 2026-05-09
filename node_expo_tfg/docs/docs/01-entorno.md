---
id: entorno
title: 2. Configuración del Entorno
sidebar_position: 2
---

# Configuración del Entorno de Desarrollo

Para levantar el proyecto Domitex en tu máquina local, debes configurar tanto el entorno de Node.js (Frontend Expo) como el de Python (Backend FastAPI).

## Prerrequisitos Globales

* **Node.js:** Versión 18.x o superior.
* **Python:** Versión 3.9 o superior.
* **Git:** Para control de versiones.
* **Cuenta de Supabase:** Para acceder a la base de datos de producción o desarrollo.

## Paso 1: Configurar el Backend (Python / FastAPI)

Toda la lógica de backend reside en la carpeta `/backend`.

```bash
# 1. Navega a la carpeta del backend
cd backend

# 2. Crea un entorno virtual para aislar las dependencias
python -m venv venv

# 3. Activa el entorno virtual
# En macOS/Linux:
source venv/bin/activate
# En Windows:
venv\Scripts\activate

# 4. Instala las dependencias del archivo requirements.txt
pip install -r requirements.txt
```

## Paso 2: Configurar el Frontend (React Native / Expo)

El frontend reside en la subcarpeta `/node_expo_tfg`.

```bash
# 1. Navega a la carpeta del frontend
cd node_expo_tfg

# 2. Instala las dependencias de Node.js
npm install
```

## Paso 3: Variables de Entorno (.env)

Tanto tu backend como tu frontend necesitan conocer las claves de conexión. Crea un archivo `.env` en la raíz de tu backend (o en el directorio principal).

**¡NUNCA subas el archivo `.env` a GitHub! El archivo `.gitignore` ya está configurado para evitarlo.**

```env
# --- Variables para el Frontend ---
# Si vas a probar en tu móvil físico con Expo Go, debes poner tu IP local IPv4 (Ej: 192.168.1.50)
EXPO_PUBLIC_API_URL=http://<TU_IP_LOCAL>:8000

# --- Variables para el Backend y Frontend ---
SUPABASE_URL=https://<TU_PROYECTO_ID>.supabase.co
# Clave pública para el cliente (Frontend)
SUPABASE_ANON_KEY=eyJhbG...
# Clave de servicio para el backend (Tiene permisos absolutos para saltarse RLS)
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

## Paso 4: Levantar los servidores simultáneamente

Necesitarás abrir dos ventanas/pestañas en tu terminal.

**Terminal 1 (Backend API):**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 (Frontend Expo):**
```bash
cd node_expo_tfg
npx expo start -c
```

Cuando Expo arranque, podrás pulsar la tecla `w` para abrir la versión web en tu navegador, o escanear el código QR con la aplicación **Expo Go** en tu dispositivo móvil (Android/iOS) conectado a la misma red Wi-Fi.