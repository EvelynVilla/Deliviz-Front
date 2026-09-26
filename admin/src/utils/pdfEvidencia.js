// Exportar evidencia (PDF) desde P3: todas las fotos, la firma y los timestamps.
// En web abre el diálogo de impresión del navegador con el documento ("Guardar como PDF").
// (expo-print en web solo imprime la página completa, por eso se usa un iframe propio.)
// En celular genera el archivo y abre el menú para compartirlo.
import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { describir } from '../components/LineaTiempo';
import { FIRMAS } from '../datos/generador.mjs';
import { FOTOS } from '../datos/fotos';
import { coordenadas, fechaHoraCompleta } from './formato';

async function urlFoto(clave) {
  if (!clave) return null;
  if (!FOTOS[clave]) return clave; // ya es una URL (S3)
  const a = Asset.fromModule(FOTOS[clave]);
  await a.downloadAsync();
  const uri = a.localUri ?? a.uri;
  return Platform.OS === 'web' ? new URL(uri, window.location.href).href : uri;
}

const escapar = (t = '') => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export async function exportarEvidenciaPdf(p) {
  const filas = await Promise.all(p.eventos.map(async (e) => {
    const d = describir(e);
    const foto = await urlFoto(e.foto);
    return `
      <tr>
        <td class="hora">${escapar(fechaHoraCompleta(e.fecha))}</td>
        <td>
          <b>${escapar(d.titulo)}</b><br/>
          <span class="gris">${escapar(d.detalle)}</span><br/>
          <span class="mini">GPS ${coordenadas(e.lat, e.lng)}</span>
          ${foto ? `<div><img src="${foto}" class="foto"/></div>` : ''}
        </td>
      </tr>`;
  }));

  const ent = p.entrega;
  const firma = ent ? `<svg viewBox="0 0 200 80" width="240" height="96"><path d="${FIRMAS[ent.datos.firma % FIRMAS.length]}" stroke="#0D1D3E" stroke-width="2.6" fill="none" stroke-linecap="round"/></svg>` : '';
  const fotoEntrega = ent ? await urlFoto(ent.foto) : null;

  const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Evidencia ${p.guia}</title>
  <style>
    @page { margin: 18mm; }
    body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #0D1D3E; font-size: 12px; }
    h1 { font-size: 22px; margin: 0; } h2 { font-size: 15px; margin: 22px 0 8px; }
    .gris { color: #56657F; } .mini { color: #8A97AD; font-size: 10.5px; }
    .cab { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #1B81F9; padding-bottom: 10px; }
    .marca { font-weight: 800; font-size: 18px; } .marca span { color: #1B81F9; }
    table { width: 100%; border-collapse: collapse; } td { vertical-align: top; padding: 8px 6px; border-bottom: 1px solid #EDF1F7; }
    td.hora { width: 150px; color: #56657F; white-space: nowrap; }
    .foto { width: 190px; border-radius: 8px; margin-top: 6px; }
    .datos td { padding: 5px 6px; } .datos td:first-child { color: #56657F; width: 130px; }
    .evidencia { display: flex; gap: 16px; align-items: center; }
    .caja { border: 1px solid #E3E9F2; border-radius: 10px; padding: 8px; }
    .pie { margin-top: 26px; color: #8A97AD; font-size: 10px; }
  </style></head><body>
    <div class="cab">
      <div><div class="marca">Deli<span>viz</span></div><h1>Evidencia de entrega ${escapar(p.guia)}</h1>
      <div class="gris">${escapar(p.destinatario)}, ${escapar(p.direccion)}, ${escapar(p.colonia)}, ${escapar(p.ciudad)}</div></div>
      <div class="gris">Generado: ${escapar(fechaHoraCompleta(new Date()))}</div>
    </div>
    ${ent ? `
      <h2>Entrega</h2>
      <div class="evidencia">
        ${fotoEntrega ? `<img src="${fotoEntrega}" class="foto" style="width:240px"/>` : ''}
        <div class="caja">${firma}<div class="mini">Firma del receptor</div></div>
      </div>
      <table class="datos" style="margin-top:10px">
        <tr><td>Recibió</td><td><b>${escapar(ent.datos.recibio)}, ${escapar(ent.datos.relacion)}</b></td></tr>
        <tr><td>Fecha y hora</td><td><b>${escapar(fechaHoraCompleta(ent.fecha))}</b></td></tr>
        <tr><td>Ubicación</td><td><b>${coordenadas(ent.lat, ent.lng)} (a ${ent.datos.distanciaM} m del domicilio)</b></td></tr>
        <tr><td>Repartidor</td><td><b>${escapar(ent.repartidor)}</b></td></tr>
      </table>` : '<h2>Sin entrega registrada</h2>'}
    <h2>Historial del paquete</h2>
    <table>${filas.join('')}</table>
    <div class="pie">Hora y ubicación se registran automáticamente en el teléfono del repartidor y no se pueden editar.</div>
  </body></html>`;

  if (Platform.OS === 'web') {
    imprimirEnWeb(html);
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Evidencia ${p.guia}` });
}

function imprimirEnWeb(html) {
  const marco = document.createElement('iframe');
  Object.assign(marco.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
  document.body.appendChild(marco);
  const doc = marco.contentWindow.document;
  doc.open(); doc.write(html); doc.close();
  const imprimir = () => {
    marco.contentWindow.focus();
    marco.contentWindow.print();
    setTimeout(() => marco.remove(), 1500);
  };
  // Espera a que carguen las fotos antes de imprimir
  const imgs = [...doc.images];
  let faltan = imgs.length;
  if (!faltan) return setTimeout(imprimir, 100);
  imgs.forEach((im) => {
    if (im.complete) { if (--faltan === 0) setTimeout(imprimir, 100); return; }
    im.onload = im.onerror = () => { if (--faltan === 0) setTimeout(imprimir, 100); };
  });
}
