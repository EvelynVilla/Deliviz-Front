# Pruebas de punta a punta (app → Blob → S3 → panel)

Cada prueba se marca como OK o se reporta al responsable con la guía, la hora y una captura.

| # | Qué se hace | Qué se revisa en el panel | Responsable si falla |
|---|---|---|---|
| 1 | Crear un repartidor en P5 | Puede entrar a la app con su número y la contraseña inicial | Vaneza |
| 2 | Escanear una guía y tomar la foto de llegada (pantallas 4 a 6) | P3 muestra "Llegada a bodega" con miniatura, hora y estado | Sayuri / Carlos |
| 3 | Salir a ruta con varios paquetes (pantalla 7) | Cada paquete tiene "Salida a ruta" sin foto, misma hora | Sayuri / Vaneza |
| 4 | Transferir a otro repartidor y aceptarla (pantalla 9) | "Transferencia de responsable" con foto; el responsable cambia solo al aceptar | Sayuri / Vaneza |
| 5 | Reportar un problema (pantalla 10) | Aparece en P4 como incidente y en la línea de tiempo | Sayuri / Vaneza |
| 6 | Entregar con foto y firma (pantallas 11 a 15) | Evidencia completa en P3 con coordenadas y distancia; el cliente recibe SMS | Evelyn / Carlos |
| 7 | No pude entregar (pantalla 16) | Alerta de excepción en P4 con foto y motivo | Evelyn / Vaneza |
| 8 | Entregar en modo avión y luego activar datos (pantalla 17) | La evidencia llega sola y con la hora original, sin duplicados | Evelyn |
| 9 | Dejar un paquete en ruta más horas que el límite de P7 | Aparece la alerta "sin eventos" | Vaneza |
| 10 | Exportar evidencia (PDF) desde P3 | El PDF trae todas las fotos, la firma y los timestamps | Karol |
| 11 | Compartir enlace y abrirlo en una ventana privada | P8 abre sin sesión y deja de funcionar al vencer | Karol / Vaneza |
| 12 | Revisar P6 después de las pruebas | Los indicadores cuentan las entregas nuevas | Karol |
| 13 | Revisar Blob después de 24 h | No quedan fotos atoradas en el contenedor entrante | Carlos |
