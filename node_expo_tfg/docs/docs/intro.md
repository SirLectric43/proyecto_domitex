---
id: intro
title: 1. Introducción y Arquitectura
sidebar_position: 1
slug: /
---

# Introducción al Proyecto Domitex

Bienvenido al manual de mantenimiento y desarrollo de **Domitex**, una plataforma de comercio electrónico y gestión interna para productos textiles del hogar. Este documento está diseñado para que futuros desarrolladores puedan entender el ecosistema, clonar el repositorio y continuar el desarrollo de manera fluida y escalable.

## Visión General

Domitex es una aplicación híbrida (Web y Móvil Nativa) orientada tanto a clientes finales como a la administración de la empresa. 
* **Para los clientes:** Permite registro, exploración del catálogo, gestión de la cesta de compras y realización de pedidos (con opción de envío a domicilio o recogida en tienda), además de visualizar su historial de compras con descarga de albaranes en PDF.
* **Para los administradores/empleados:** Provee un panel de control privado para gestionar el estado de los pedidos, dar de alta/baja artículos y categorías, controlar el stock y administrar los usuarios registrados en el sistema.

## Stack Tecnológico

El proyecto se sustenta en una arquitectura moderna basada en microservicios, APIs y *serverless*:

* **Frontend (Móvil y Web):** [React Native](https://reactnative.dev/) gestionado a través del framework [Expo](https://expo.dev/).
* **Enrutamiento Frontend:** [Expo Router](https://docs.expo.dev/router/introduction/) (enrutamiento declarativo basado en el sistema de archivos de la carpeta `app/`).
* **Backend / API REST:** [FastAPI](https://fastapi.tiangolo.com/) (Python) servido como funciones *serverless*.
* **Base de Datos y Autenticación:** [Supabase](https://supabase.com/) (PostgreSQL relacional, Supabase Auth para JWT y Supabase Storage para los *buckets* de imágenes).
* **Hosting y Despliegue:** [Vercel](https://vercel.com/) (Aloja el backend de Python y la versión web compilada estáticamente) y **EAS Build** (Para la compilación en la nube de la App Móvil Android/iOS).

## Arquitectura del Sistema

El flujo de información en Domitex se divide en tres capas principales que garantizan seguridad y rendimiento:

1. **El Cliente (App Expo):** Realiza peticiones HTTP (REST) utilizando el token JWT del usuario logueado en la cabecera `Authorization: Bearer <token>`.
2. **El Intermediario Lógico (FastAPI):** Recibe las peticiones, valida el token JWT contra los servidores de Supabase, verifica los roles del usuario (`admin`, `empleado` o `cliente`) y ejecuta la lógica de negocio.
3. **La Persistencia (Supabase):** Almacena y protege los datos. **Nota de diseño crítico:** Aunque Supabase permite acceso directo desde el frontend, en Domitex hemos optado por pasar toda la lógica transaccional crítica (como compras, generación de referencias de pedido `00001A` y control de stock) por **FastAPI**. Esto mantiene un control estricto, evita manipulaciones desde el lado del cliente y facilita la integración futura de pasarelas de pago.