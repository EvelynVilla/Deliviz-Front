# Deliviz · Panel de administrador (parte de Karol)

Hecho con **React Native + Expo** (el mismo stack que la app del repartidor). Corre en el
navegador con `react-native-web` y también abre en celular con Expo Go.

## Cómo correrlo
1. `npm install`
2. `npx expo start --web` (se abre en http://localhost:8081)
3. Entra con **vane@deliviz.mx** y cualquier contraseña de 6 caracteres o más.

Para verlo en el celular: `npx expo start` y escanea el QR con Expo Go.
Para publicarlo en Azure Static Web Apps (lo hace Carlos): `npm run build` genera la carpeta `dist`.

## Pantallas
| # | Pantalla | Dirección en el navegador |
|---|---|---|
| P1 | Inicio de sesión | `/login` |
| P2 | Lista de paquetes | `/paquetes` |
| P3 | Vista de paquete (pantalla 18 del mockup) | `/paquetes/DLV-48190` |
| P4 | Alertas | `/alertas` |
| P5 | Repartidores | `/repartidores` |
| P6 | Reportes | `/reportes` |
| P7 | Ajustes | `/ajustes` |
| P8 | Vista pública de evidencia (sin sesión) | `/evidencia/demo` |

## Dónde está cada cosa
- `src/pantallas`: una pantalla por archivo (P1 a P8).
- `src/components`: componentes comunes (tarjetas, línea de tiempo, mapa del recorrido, gráficas, firma…).
- `src/api/cliente.js`: acceso a datos. Hoy usa datos de prueba; cada función dice qué endpoint de Vaneza la reemplaza.
- `src/api/consultas.js`: hooks de TanStack Query que usan las pantallas.
- `src/datos/generador.mjs`: generador de datos de prueba (5 semanas de entregas). Lo usa también el script del backend.
- `src/reportes/indicadores.js`: cálculo de los indicadores de P6 sobre los datos de prueba.
- `src/utils/pdfEvidencia.js`: "Exportar evidencia (PDF)".

## Backend (carpeta `backend/` del zip)
- `backend/reportes/consultas.js` y `rutas.js`: las consultas SQL de los indicadores (con Prisma) y la ruta `GET /api/reportes`. Revisarlas con Vaneza contra su esquema final.
- `backend/prisma/seed-datos-prueba.mjs`: llena la base real con los mismos datos de prueba para todo el equipo.

## Pendiente de conectar
- Vaneza: endpoints de consulta, alertas, repartidores, ajustes y enlace para compartir (ver comentarios en `cliente.js`).
- Carlos: fotos y miniaturas en S3 (hoy son imágenes locales en `assets/img`) y el despliegue en Static Web Apps.
