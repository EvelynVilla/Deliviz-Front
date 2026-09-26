# Deliviz — Contrato de la API (Fase 1)

**Responsable:** Vaneza · **Base URL local:** `http://localhost:5080`

Todas las fechas van en ISO 8601 con zona horaria (`2026-09-22T12:30:00-06:00`). Los nombres de campos van en camelCase y los valores de enums en snake_case.

Todos los endpoints, salvo el login y los internos, requieren el header `Authorization: Bearer <token>` de un usuario con rol `repartidor` (el historial también acepta `administrador`).

**Nota de arquitectura:** el flujo de fotos usa **únicamente Azure Blob Storage**, con dos contenedores: `entrante` (donde la app sube la foto original vía token SAS) y `definitivo` (donde la Azure Function de Carlos deja la foto comprimida y su miniatura, ya procesadas). No se usa AWS S3 en ningún punto del flujo.

## Errores

Los errores siguen el formato estándar *ProblemDetails*:

```json
{ "status": 409, "title": "Evento no permitido", "detail": "El paquete debe estar en ruta." }
```

| Código | Significado |
|---|---|
| 400 | Faltan datos o tienen formato incorrecto (el `detail` explica cuál) |
| 401 | No hay token, el token expiró o las credenciales son incorrectas |
| 403 | El recurso pertenece a otro repartidor |
| 404 | No existe el evento, la foto o el paquete |
| 409 | La acción no es válida con el estado actual del paquete |

## Valores de los enums

| Enum | Valores |
|---|---|
| `tipo` (evento) | `llegada_bodega`, `salida_ruta`, `transferencia`, `incidente`, `entrega`, `excepcion` |
| `estadoPaquete` | `en_bodega`, `en_ruta`, `entregado`, `no_entregado` |
| `origen` | `nacional`, `internacional` |
| `condicion` | `bien`, `danado`, `incompleto` |
| `motivo` | `nadie_recibio`, `direccion_incorrecta`, `rechazado`, `otro` |
| `relacionReceptor` | `titular`, `familiar`, `vecino`, `recepcion`, `otro` |
| `tipo` (foto) | `paquete`, `firma` |
| `estado` (foto) | `pendiente`, `procesada` |

## Qué exige cada evento

| Evento | Foto | Firma | Campos obligatorios extra | Estado requerido | Estado nuevo |
|---|---|---|---|---|---|
| `llegada_bodega` | Sí | No | `condicion` (`origen` opcional) | Paquete nuevo, `en_ruta` o `no_entregado` | `en_bodega` |
| `salida_ruta` | No | No | — | `en_bodega` o `no_entregado` | `en_ruta` (asignado a quien lo registra) |
| `transferencia` | Sí | No | — (la registra quien **recibe**) | `en_ruta` con otro repartidor | `en_ruta` (asignado a quien lo registra) |
| `incidente` | Sí | No | `comentario` | Cualquiera menos `entregado` | Sin cambio |
| `entrega` | Sí | Sí | `nombreReceptor`, `relacionReceptor` | `en_ruta`, asignado a ti | `entregado` |
| `excepcion` | Sí | No | `motivo` (`comentario` si es `otro`) | `en_ruta`, asignado a ti | `no_entregado` |

---

## POST `/api/auth/login`

Sin autenticación.

```json
// Entrada
{ "email": "repartidor1@deliviz.test", "password": "Deliviz123!" }

// Salida 200
{
  "token": "eyJhbGciOi...",
  "expiraEn": "2026-09-23T00:30:00+00:00",
  "usuario": { "id": "…", "nombre": "Repartidor Uno", "email": "repartidor1@deliviz.test", "rol": "repartidor" }
}
```

## POST `/api/eventos`

Registra un evento. **El `id` lo genera la app** (UUID v4). Reenviar el mismo `id` no duplica el evento: responde `200` con `"yaExistia": true`.

```json
// Entrada (ejemplo de entrega)
{
  "id": "0b0f5a4e-1111-4c1a-9a55-000000000003",
  "numeroGuia": "DLV-0001",
  "tipo": "entrega",
  "nombreReceptor": "María López",
  "relacionReceptor": "familiar",
  "latitud": 22.1498,
  "longitud": -100.9760,
  "fechaCaptura": "2026-09-22T12:30:00-06:00"
}

// Salida 201 (o 200 si ya existía)
{
  "id": "0b0f5a4e-1111-4c1a-9a55-000000000003",
  "numeroGuia": "DLV-0001",
  "tipo": "entrega",
  "estadoPaquete": "entregado",
  "requiereFotoPaquete": true,
  "requiereFirma": true,
  "fechaCaptura": "2026-09-22T18:30:00+00:00",
  "fechaRecepcion": "2026-09-22T18:30:04+00:00",
  "yaExistia": false
}
```

Los campos `requiereFotoPaquete` y `requiereFirma` le dicen a la app cuántos SAS debe pedir para este evento.

## GET `/api/eventos/{id}`

Devuelve el evento y el estado de sus fotos. `evidenciaCompleta` es `true` cuando todas las fotos que exige el evento ya llegaron al contenedor `definitivo`.

```json
{
  "id": "…", "numeroGuia": "DLV-0001", "tipo": "entrega", "estadoPaquete": "entregado",
  "fechaCaptura": "…", "fechaRecepcion": "…",
  "evidenciaCompleta": false,
  "fotos": [ { "id": "…", "tipo": "paquete", "estado": "procesada" }, { "id": "…", "tipo": "firma", "estado": "pendiente" } ]
}
```

## POST `/api/fotos/sas`

Devuelve una URL temporal (15 minutos) para subir **un** archivo al contenedor `entrante` de Azure Blob. Primero se registra el evento y después se pide el SAS. Si la subida falla, se vuelve a pedir y se reutiliza el mismo archivo.

```json
// Entrada
{ "eventoId": "0b0f5a4e-1111-4c1a-9a55-000000000003", "tipo": "firma" }

// Salida 200
{
  "fotoId": "…",
  "blobName": "0b0f5a4e-1111-4c1a-9a55-000000000003/firma-3f2a….png",
  "uploadUrl": "https://<cuenta>.blob.core.windows.net/entrante/…?sv=…&sig=…",
  "expiraEn": "2026-09-22T18:45:04+00:00"
}
```

Para subir: `PUT <uploadUrl>` con headers `x-ms-blob-type: BlockBlob` y `Content-Type: image/jpeg` (foto) o `image/png` (firma), y el archivo como cuerpo.

## GET `/api/repartidor/paquetes`

Devuelve los paquetes que el repartidor autenticado trae asignados **en este momento** (los que están `en_ruta` con él). Un paquete deja de aparecer aquí en cuanto se entrega, se transfiere a otro repartidor, o queda `no_entregado` por una excepción.

```json
// Salida 200
[
  {
    "id": "7d06ca1b-8ccb-4e33-8802-183ac6504c97",
    "numeroGuia": "DLV-0001",
    "estado": "en_ruta",
    "origen": "internacional",
    "ultimoEvento": "salida_ruta",
    "ultimaActividad": "2026-09-24T17:53:41.737274+00:00"
  }
]
```

- `ultimoEvento` y `ultimaActividad` reflejan el evento más reciente de ese paquete (útil para mostrar "última actualización hace X" en la lista).
- La lista puede venir vacía `[]` si el repartidor no trae ningún paquete asignado ahora mismo.

## GET `/api/paquetes/{guia}/historial`

Devuelve la línea de tiempo completa de un paquete por su número de guía: todos sus eventos, en orden, con el estado de sus fotos y una URL de lectura temporal (15 minutos) para verlas en el contenedor `definitivo`. Accesible por repartidores y administradores.

```json
// Salida 200
{
  "id": "7d06ca1b-8ccb-4e33-8802-183ac6504c97",
  "numeroGuia": "DLV-0001",
  "estado": "entregado",
  "origen": "internacional",
  "urlsDisponibles": true,
  "eventos": [
    {
      "id": "11111111-1111-1111-1111-111111111111",
      "tipo": "llegada_bodega",
      "latitud": 22.1565,
      "longitud": -100.9855,
      "fechaCaptura": "2026-09-22T15:00:00+00:00",
      "fechaRecepcion": "2026-09-23T02:39:00.085176+00:00",
      "condicion": "bien",
      "motivo": null,
      "comentario": null,
      "nombreReceptor": null,
      "relacionReceptor": null,
      "fotos": [
        { "id": "…", "tipo": "paquete", "estado": "procesada", "url": "https://<cuenta>.blob.core.windows.net/definitivo/fotos/…?sv=…&sig=…" }
      ]
    }
  ]
}
```

- **`urlsDisponibles`**: `true` en cuanto la API tiene configurada la cadena de conexión de Blob Storage (`ConnectionStrings:BlobStorage`) — que ya está disponible tanto en local (con Azurite) como en Azure. Solo sería `false` si esa cadena faltara por completo.
- El campo `url` de cada foto solo se genera para fotos con `estado: "procesada"` (las que ya pasaron por la Azure Function de Carlos, de `entrante` a `definitivo`). Una foto `pendiente` siempre trae `"url": null`.
- 404 si el número de guía no existe.

## POST `/api/internal/fotos/procesada`

Solo para la Azure Function. Requiere el header `X-Internal-Key`. Es idempotente. Carlos la llama cuando ya movió la foto de `entrante` a `definitivo` (comprimida + miniatura).

```json
// Entrada
{
  "blobName": "0b0f5a4e-…/paquete-9c1d….jpg",
  "s3Key": "fotos/0b0f5a4e-…/paquete-9c1d….jpg",
  "s3ThumbKey": "miniaturas/0b0f5a4e-…/paquete-9c1d….jpg"
}
// Salida 204 sin cuerpo
```

> Nota: los campos se llaman `s3Key`/`s3ThumbKey` por razones históricas (el diseño original usaba AWS S3), pero ahora contienen la **ruta dentro del contenedor `definitivo` de Azure Blob** (por ejemplo `fotos/<blobName>` y `miniaturas/<blobName>`). No representan nada de S3.

---

## Cómo probar en local

1. `docker compose up -d` (levanta Postgres y Azurite)
2. `dotnet run` desde `Deliviz/`
3. Abre `http://localhost:5080/scalar` para explorar todos los endpoints
4. Usuarios de prueba (contraseña `Deliviz123!`): `repartidor1@deliviz.test`, `repartidor2@deliviz.test`, `admin@deliviz.test`

## Configuración de Blob Storage

En `appsettings.json` (o `appsettings.Development.json` en local):

```json
"Blob": {
  "Contenedor": "entrante",
  "MinutosVigenciaSas": 15,
  "ContenedorDefinitivo": "definitivo",
  "MinutosVigenciaLectura": 15
}
```

La cadena de conexión va en `ConnectionStrings:BlobStorage` — en local es `UseDevelopmentStorage=true` (Azurite); en Azure, la cadena real de la Storage Account que Carlos configura.

## Estado del backend

- **Fase 1 (completa):** login, eventos, tokens SAS para fotos, endpoint interno.
- **Fase 2 (completa):** reglas de negocio para transferencias/incidentes/excepciones, trigger en PostgreSQL que impide editar o borrar eventos, lista de paquetes del repartidor.
- **Fase 3 (completa):** historial por guía con URLs de lectura temporales del contenedor `definitivo` de Azure Blob. Todo el flujo de fotos (entrante → procesamiento → definitivo) usa exclusivamente Azure, sin AWS.
- **Opcional (si hay panel):** lista de paquetes con filtros y alertas.