# Huecos del contrato detectados al integrar la app (para Vaneza)

La app sigue el contrato al pie de la letra (`docs/api-contrato.md`). Estos puntos no
bloquean compilar ni probar, pero sin ellos algunas pantallas de los mockups quedan
incompletas. Están ordenados por impacto.

## 1. Datos del destinatario (impacto alto: pantallas 2, 3, 8, 11, 15)

`GET /api/repartidor/paquetes` y `GET /api/paquetes/{guia}/historial` no devuelven a quién
se entrega ni dónde. Hoy la app muestra "Destinatario sin registrar", oculta el mapa y no
puede calcular "Estás en el domicilio, a 12 m".

**Propuesta:** agregar estos campos (todos opcionales, camelCase) a ambas respuestas.
La app **ya los lee** con estos nombres exactos (`src/api/tipos.ts` → `DatosDestinatario`);
en cuanto el backend los mande, aparecen sin tocar el front.

| Campo | Tipo | Ejemplo |
|---|---|---|
| `destinatario` | string | `"Mariana Ortega Ruiz"` |
| `telefono` | string | `"4491234567"` |
| `direccion` | string | `"Av. Aguascalientes Sur 2143"` |
| `colonia` | string | `"Jardines de la Asunción"` |
| `ciudad` | string | `"Aguascalientes, Ags."` |
| `latitud` / `longitud` | number | `21.8598` / `-102.2869` |
| `ventana` | string | `"11:00 a 13:00"` |
| `indicaciones` | string | `"Portón negro, el timbre no funciona."` |
| `descripcion` | string | `"1 paquete, caja mediana"` |
| `peso` | number (kg) | `3.2` |

## 2. Transferencias: el lado de quien entrega (pantalla 9)

El contrato dice que `transferencia` la registra quien **recibe**. Así quedó implementado
(Escanear → "Recibir transferencia" → foto → `POST /api/eventos`). Lo que no existe:

- Registrar el aviso de quien **entrega** (elegir nuevo responsable, motivo y su foto, como
  en el mockup 9). En modo real la app muestra instrucciones en lugar de ese formulario.
- Una lista de transferencias pendientes para que al receptor le aparezca el aviso en Mi ruta.
- Una lista de repartidores y bodegas para elegir el destino.

**Propuesta mínima:** `GET /api/repartidor/transferencias-pendientes` y un campo opcional
`destinoId` + `motivoTransferencia` en el evento. Si no, se queda como está.

## 3. Login por número de repartidor (pantalla 1)

El mockup pide "Número de repartidor (R-0148)"; el contrato usa `email`. **La app usa email**
(contrato). Si se quiere el número, basta con que el login acepte `numero` además de `email`.

## 4. Otros detalles menores

- **SMS al cliente (pantalla 15):** no hay endpoint; la tarjeta "Cliente avisado" se omitió
  para no mostrar algo que no ocurre.
- **Paquetes "por recoger":** el contrato no tiene lista de lo que llega a bodega. La pestaña
  muestra los paquetes que el repartidor ya registró en bodega hoy.
- **Datos del repartidor (zona, teléfono):** `usuario` solo trae `id`, `nombre`, `email`, `rol`.
- **Relación "otro":** el enum `relacionReceptor` tiene `otro`, el mockup 13 no. La app lo
  ofrece para poder mandar todos los valores válidos.
- **Motivo "otro" en excepción:** igual; el mockup 16 muestra 3 motivos y el contrato 4.
- **`POST /api/eventos` con paquete nuevo:** la app asume que `llegada_bodega` con una guía que
  no existe crea el paquete (así lo indica "Paquete nuevo" en la tabla). Confirmarlo.
