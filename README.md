# Deliviz · App del repartidor

React Native + Expo SDK 57 + React Navigation 7. Pantallas 1 a 17 de los mockups v1.0,
conectadas a la API .NET según `docs/api-contrato.md`.

- Pantallas 1 a 10 en **JavaScript** (Sayuri).
- Pantallas 11 a 17 y "Recibir transferencia" en **TypeScript**.
- Capa de API, cola de subida, GPS, sesión y contexto en **TypeScript**.

---

## 1. Arrancar en 3 pasos

```bash
npm install
cp .env.example .env        # y edita EXPO_PUBLIC_API_URL (ver sección 3)
npx expo start -c
```

Escanea el QR con **Expo Go para SDK 57**. Todo lo que usa la app viene incluido en Expo Go
(cámara, GPS, mapas, webview para la firma, almacenamiento seguro), no hace falta un development build.

Antes de subir cambios corre `npm run verificar`, que ejecuta `tsc --noEmit` y ESLint.

## 2. Probar sin backend (modo simulado)

Si no hay `EXPO_PUBLIC_API_URL` (o con `EXPO_PUBLIC_USAR_MOCK=true`), la app usa `src/api/mock.ts`.
Esa API simulada tiene **las mismas formas y reglas que el contrato**: responde 400, 403, 404 y 409
en los mismos casos, y el reenvío de un evento responde `yaExistia`.

- **Usuario:** cualquier correo válido con contraseña de 6 o más caracteres. Por ejemplo,
  `repartidor1@deliviz.test` / `Deliviz123!`.
- **Guías para llegada a bodega:** `DLV-48290`, `DLV-48291`, `DLV-48292`. Cualquier otra guía
  se da de alta como paquete nuevo.
- **Transferencia para recibir:** `DLV-48288`, que trae Ana Torres. Aparece como aviso en Mi ruta.
- **Pantalla 17:** en Perfil, activa **"Simular sin señal"**, haz entregas y verás la cola.
  Desactívalo y todo se sube solo.

## 3. Conectar con la API .NET

1. Levanta el backend como indica el contrato (`docker compose up -d`, `dotnet run`), pero
   **escuchando en toda la red**, no solo en localhost:
   ```bash
   dotnet run --urls http://0.0.0.0:5080
   ```
2. En `.env` pon `EXPO_PUBLIC_API_URL=http://<IP-de-tu-compu>:5080` y `EXPO_PUBLIC_USAR_MOCK=false`.
   En el emulador de Android la dirección es `http://10.0.2.2:5080`.
3. Entra con `repartidor1@deliviz.test` / `Deliviz123!`.

> ⚠️ **Fotos con Azurite (local).** El `uploadUrl` que devuelve `/api/fotos/sas` apunta a
> `http://127.0.0.1:10000/...`. Desde el teléfono, esa dirección es **el propio teléfono**, así que
> la subida falla y la evidencia se queda "En espera" en la pantalla 17. Hay que ajustar dos cosas:
> - Azurite debe escuchar en toda la red: `azurite-blob --blobHost 0.0.0.0` (o el puerto expuesto en docker compose).
> - La cadena `ConnectionStrings:BlobStorage` debe apuntar a la IP de la red local:
>   `DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://<IP-de-tu-compu>:10000/devstoreaccount1;`
>
> En Azure no pasa: el SAS es HTTPS y público.

> **HTTP sin TLS.** Expo Go permite `http://` a la red local. En un build de producción,
> Android e iOS bloquean HTTP, así que la API en Azure debe usar **HTTPS**.

## 4. Flujo completo y endpoints

| # | Pantalla | Archivo | Qué manda a la API |
|---|---|---|---|
| 1 | Inicio de sesión | `LoginScreen.js` | `POST /api/auth/login` (email y password). Solo entra el rol `repartidor` |
| 2 | Mi ruta | `MiRutaScreen.js` | `GET /api/repartidor/paquetes`, que se une con lo guardado en el teléfono |
| 3 | Detalle | `DetallePaqueteScreen.js` | `GET /api/paquetes/{guia}/historial`, con fotos por URL temporal |
| 4 | Escanear guía | `EscanearGuiaScreen.js` | Valida con el historial: 404 es paquete nuevo, `en_bodega` o `entregado` se rechaza |
| 5-6 | Foto y estado de llegada | `FotoLlegadaScreen.js`, `EstadoPaqueteScreen.js` | Evento `llegada_bodega` con foto y `condicion` |
| 7 | Salida a ruta | `SalidaRutaScreen.js` | Un evento `salida_ruta` **por guía**, sin foto |
| 8 | Ruta en curso | `RutaEnCursoScreen.js` | Nada, solo usa el GPS |
| 9 | Transferir / Recibir | `TransferirScreen.js`, `RecibirTransferenciaScreen.tsx` | Evento `transferencia` registrado por **quien recibe**, con foto |
| 10 | Reportar problema | `ReportarProblemaScreen.js` | Evento `incidente` con foto y `comentario` ("Tipo: descripción") |
| 11 | Llegada al domicilio | `LlegadaDomicilioScreen.tsx` | Nada, solo GPS y distancia al domicilio |
| 12 | Foto de entrega | `FotoEntregaScreen.tsx` | Foto del paquete (se revisa antes de seguir) |
| 13 | Firma | `FirmaReceptorScreen.tsx` | Firma PNG, `nombreReceptor` y `relacionReceptor`. La hora y el GPS se fijan aquí |
| 14 | Confirmar | `ConfirmarEntregaScreen.tsx` | Evento `entrega` con foto y firma |
| 15 | Entrega completada | `EntregaCompletadaScreen.tsx` | Avance real de la subida (cola) |
| 16 | No pude entregar | `NoPudeEntregarScreen.tsx` | Evento `excepcion` con foto y `motivo` (y `comentario` si es "otro") |
| 17 | Pendientes de subir | `PendientesSubirScreen.tsx` | La cola: reintentar o descartar rechazos |

### Cómo se sube cada evento (`src/services/cola.ts`)

1. La acción se guarda **primero en el teléfono**. La foto se comprime (lado mayor 1600 px,
   JPEG 0.7) y se copia a documentos. La firma se guarda como PNG. Luego se encola.
2. `POST /api/eventos`, con un `id` UUID generado por la app, así que reenviarlo no duplica el evento.
   `fechaCaptura` va en ISO con zona horaria (`-06:00`) y se incluyen `latitud` y `longitud`.
3. Por cada foto que exige el evento: `POST /api/fotos/sas` y después
   `PUT uploadUrl` con los headers `x-ms-blob-type: BlockBlob` y `Content-Type` (`image/jpeg` o `image/png`).
4. Cómo se maneja cada resultado:
   - **Sin red o error 5xx:** el evento queda "En espera" y se reintenta solo al volver la
     red, al volver la app a primer plano y cada 30 s.
   - **SAS vencido:** se pide uno nuevo y se reutiliza el mismo archivo.
   - **400, 403 o 409:** el evento queda "Rechazado" con el `detail` de la API y se puede descartar.
   - **401:** se cierra la sesión, pero la cola se conserva y termina de subir al volver a entrar.
   - **Orden:** los eventos de una misma guía se envían en orden. Si uno falla, los siguientes esperan.

## 5. Coexistencia JavaScript + TypeScript

- `tsconfig.json` usa `allowJs: true` para que JS y TS se importen entre sí, y
  `checkJs: false` para que los `.js` compilen tal cual. Los `.ts` y `.tsx` usan `strict`.
- Los componentes `.js` que también se usan desde `.tsx` declaran sus props con **JSDoc**
  (`/** @param {{ titulo: string, icono?: ... }} props */`). Sin eso, TypeScript marca como
  obligatorias todas las props desestructuradas (`icono`, `style`, `cargando`…). Los JSDoc son
  solo comentarios y no cambian el comportamiento.
- Las rutas y sus parámetros están tipados en `src/navigation/types.ts`. En las pantallas `.tsx`,
  `navigation.navigate('FirmaReceptor', {...})` se revisa al compilar.
- **Regla para código nuevo:** escríbelo en `.tsx`. Si un `.tsx` usa un componente `.js`,
  agrega el JSDoc de sus props.

## 6. Dónde está cada cosa

```
src/
  api/          tipos.ts (DTOs del contrato), http.ts (fetch + ProblemDetails),
                deliviz.ts (API real), mock.ts (API simulada), config.ts (.env)
  context/      AppContext.tsx: sesión, paquetes y acciones que generan eventos
  navigation/   AppNavigator.tsx (stack + tabs), types.ts (rutas tipadas)
  services/     cola.ts, evidencia.ts, ubicacion.ts, sesion.ts, almacen.ts
  screens/      .js (1-10) y .tsx (11-17)
  components/   componentes comunes en JS, con props tipadas por JSDoc
  modelo.ts     modelo de la app y conversión desde las respuestas de la API
docs/
  api-contrato.md, huecos-del-contrato.md, Deliviz_Mockups_App_Repartidor.pdf
```

## 7. Pendiente del lado del backend

Ver `docs/huecos-del-contrato.md`. Lo principal es que la API todavía no devuelve nombre,
dirección ni coordenadas del destinatario. La app ya lee esos campos, así que aparecen
en cuanto el backend los mande.
