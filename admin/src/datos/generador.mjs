// Generador de datos de prueba de Deliviz (Karol).
// Lo usan dos lugares:
//   1. El panel, mientras no existan los endpoints de Vaneza (src/datos/baseDatos.js).
//   2. El script /backend/prisma/seed-datos-prueba.mjs, que llena la base real para todo el equipo.
// Es determinista: con la misma semilla y el mismo "ahora" produce los mismos datos.
// Genera varias semanas de entregas para que los reportes (P6) tengan qué mostrar.

// ---------- utilidades ----------
function crearAleatorio(semilla) {
  let a = semilla >>> 0;
  const r = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.entero = (min, max) => Math.floor(r() * (max - min + 1)) + min;
  r.de = (lista) => lista[Math.floor(r() * lista.length)];
  r.ponderado = (pares) => {
    const total = pares.reduce((s, [, p]) => s + p, 0);
    let x = r() * total;
    for (const [v, p] of pares) { if ((x -= p) < 0) return v; }
    return pares[pares.length - 1][0];
  };
  return r;
}

const MIN = 60 * 1000;
const enMinutos = (fecha, min) => new Date(fecha.getTime() + min * MIN);
function aHora(dia, h, m, s = 0) { const f = new Date(dia); f.setHours(h, m, s, 0); return f; }

// ---------- catálogos ----------
export const BODEGAS = [
  { id: 'BOD-01', nombre: 'Bodega Central', direccion: 'Av. Siglo XXI 8105, Parque Industrial', lat: 21.8712, lng: -102.2981, activa: true },
  { id: 'BOD-02', nombre: 'Bodega Norte', direccion: 'Carr. a Zacatecas km 4.5', lat: 21.9291, lng: -102.2943, activa: true },
];

export const REPARTIDORES = [
  { id: 'R-0148', nombre: 'Luis Hernández', zona: 'Zona centro', telefono: '449 118 2030', activo: true },
  { id: 'R-0152', nombre: 'Carlos Mendoza', zona: 'Zona norte', telefono: '449 207 5512', activo: true },
  { id: 'R-0161', nombre: 'Ana Torres', zona: 'Zona oriente', telefono: '449 331 8870', activo: true },
  { id: 'R-0170', nombre: 'Jorge Ibarra', zona: 'Zona sur', telefono: '449 410 2291', activo: true },
  { id: 'R-0175', nombre: 'Paola Cervantes', zona: 'Zona poniente', telefono: '449 552 9034', activo: true },
];

export const ADMINISTRADORES = [
  { id: 'ADM-01', nombre: 'Vane', correo: 'vane@deliviz.mx', rol: 'Administradora' },
];

export const MOTIVOS_EXCEPCION = ['Nadie recibió', 'Dirección incorrecta', 'Rechazó el paquete'];
export const TIPOS_INCIDENTE = ['Paquete dañado', 'Etiqueta ilegible', 'Mojado o derramado', 'Otro'];
export const MOTIVOS_TRANSFERENCIA = ['Cambio de zona', 'Ruta saturada', 'Falla en la unidad'];
export const RELACIONES = ['titular', 'familiar', 'vecino', 'recepción del edificio'];

const NOMBRES = ['Mariana', 'Roberto', 'Cecilia', 'Andrés', 'Fernanda', 'Luciana', 'Héctor', 'Patricia', 'Jorge', 'Daniela', 'Sofía', 'Miguel', 'Rosa Elena', 'Tomás', 'Alejandra', 'Ricardo', 'Valeria', 'Eduardo', 'Gabriela', 'Arturo', 'Ximena', 'Raúl', 'Diana', 'Óscar', 'Mónica', 'Fernando', 'Liliana', 'Emilio', 'Regina', 'Iván'];
const APELLIDOS = ['Ortega', 'Salas', 'Pérez', 'Villalobos', 'Lozano', 'Barrios', 'Ramírez', 'Nava', 'Esparza', 'Muñoz', 'Márquez', 'Díaz', 'Prieto', 'Vega', 'Guerrero', 'Ruvalcaba', 'Delgado', 'Romo', 'Macías', 'Medina', 'Chávez', 'Luévano', 'Martínez', 'Rangel', 'Jiménez', 'Aguilar', 'Reyes', 'Esquivel'];
const CALLES = [
  ['Av. Aguascalientes Sur', 'Jardines de la Asunción'], ['Calle Nieto', 'Centro'], ['Blvd. a Zacatecas', 'Las Américas'],
  ['Av. Universidad', 'Bosques del Prado'], ['Calle Madero', 'Centro'], ['Av. López Mateos', 'San Luis'], ['Calle Juárez', 'Barrio de Guadalupe'],
  ['Av. Convención Oriente', 'Del Trabajo'], ['Calle Hornedo', 'Centro'], ['Av. Siglo XXI', 'Villas de Nuestra Señora'], ['Calle Morelos', 'Centro'],
  ['Av. Héroe de Nacozari', 'San Pablo'], ['Calle Allende', 'San Marcos'], ['Calle Libertad', 'Obraje'], ['Av. Tecnológico', 'Ojocaliente'],
  ['Av. Las Américas', 'La Fuente'], ['Calle Venustiano Carranza', 'Centro'], ['Av. Colosio', 'Pulgas Pandas'], ['Calle Rivero y Gutiérrez', 'Centro'],
];
// Centro aproximado de cada zona (para que las coordenadas tengan sentido en el mapa)
const CENTRO_ZONA = {
  'R-0148': [21.8818, -102.2916], 'R-0152': [21.9120, -102.2980], 'R-0161': [21.8830, -102.2610],
  'R-0170': [21.8520, -102.2890], 'R-0175': [21.8800, -102.3230],
};

// Cuatro trazos de firma (SVG, viewBox 0 0 200 80). En producción la firma es un PNG en S3.
export const FIRMAS = [
  'M8 52 C 22 20, 34 20, 30 50 C 28 64, 40 40, 52 36 C 60 34, 58 54, 66 50 C 74 46, 80 32, 88 38 C 96 44, 92 56, 104 50 C 118 42, 126 34, 138 40 C 150 46, 160 44, 176 36',
  'M10 46 C 20 16, 40 16, 36 52 C 34 66, 46 30, 58 34 C 70 38, 62 56, 74 50 C 84 44, 92 22, 102 30 C 110 38, 104 58, 118 48 L 132 38 C 146 30, 160 46, 188 30 M 20 62 L 150 58',
  'M14 40 C 30 10, 44 60, 56 34 C 64 18, 70 58, 84 40 C 94 26, 100 50, 112 44 C 126 36, 134 20, 148 30 C 160 40, 170 36, 184 26',
  'M12 50 C 18 30, 30 24, 36 40 C 40 52, 46 56, 54 42 C 62 28, 68 30, 72 46 C 76 58, 86 50, 94 38 C 102 26, 116 30, 120 44 C 124 56, 140 48, 150 38 C 160 28, 172 34, 186 42',
];

// ---------- generación ----------
/**
 * @param {{ semilla?: number, ahora?: Date, semanas?: number }} opciones
 */
export function generarDatos({ semilla = 20260920, ahora = new Date(), semanas = 5 } = {}) {
  const r = crearAleatorio(semilla);
  const paquetes = [];
  const eventos = [];
  let idEvento = 1;
  let consecutivoGuia = 44001;

  const hoy = new Date(ahora); hoy.setHours(0, 0, 0, 0);
  const nuevoId = () => `EV-${String(idEvento++).padStart(6, '0')}`;
  const nombrePersona = () => `${r.de(NOMBRES)} ${r.de(APELLIDOS)} ${r.de(APELLIDOS)}`;
  const nombreRep = (id) => REPARTIDORES.find((x) => x.id === id).nombre;

  function nuevoPaquete(repId, extra = {}) {
    const [calle, colonia] = r.de(CALLES);
    const [clat, clng] = CENTRO_ZONA[repId];
    return {
      guia: `DLV-${consecutivoGuia++}`,
      destinatario: nombrePersona(),
      telefono: `449${r.entero(1000000, 9999999)}`,
      direccion: `${calle} ${r.entero(10, 2400)}`,
      colonia,
      ciudad: 'Aguascalientes',
      lat: +(clat + (r() - 0.5) * 0.03).toFixed(5),
      lng: +(clng + (r() - 0.5) * 0.03).toFixed(5),
      tamano: r.ponderado([['Caja chica', 3], ['Caja mediana', 5], ['Caja grande', 2], ['Sobre', 2]]),
      peso: +(r() * 8 + 0.3).toFixed(1),
      origen: r.ponderado([['Nacional', 9], ['Internacional', 1]]),
      repartidorId: repId,
      estado: 'por_recoger',
      ...extra,
    };
  }

  function evento(p, tipo, fecha, repId, datos = {}, foto = null, lugar = null) {
    const e = {
      id: nuevoId(), guia: p.guia, tipo, fecha: new Date(fecha).toISOString(), repartidorId: repId,
      lat: lugar ? lugar.lat : p.lat, lng: lugar ? lugar.lng : p.lng, foto, datos,
    };
    eventos.push(e);
    return e;
  }

  // Un día normal de trabajo. `hastaAhora` recorta los eventos que aún no pasan (el día de hoy).
  function simularDia(dia, esHoyFlag) {
    // En "hoy" las horas se acomodan antes del momento actual (y después de medianoche)
    // para que nada quede en el futuro ni se cruce con el día anterior.
    const inicioHoy = esHoyFlag ? new Date(Math.max(hoy.getTime() + 5 * MIN, ahora.getTime() - 7 * 60 * MIN)) : null;
    const ventanaHoy = esHoyFlag ? (ahora - inicioHoy) / MIN : 0;
    const base = esHoyFlag ? inicioHoy : aHora(dia, 7, 40);
    const salidaHoy = esHoyFlag ? enMinutos(inicioHoy, ventanaHoy * 0.18) : null;

    for (const rep of REPARTIDORES) {
      const cantidad = r.entero(8, 13);
      const bodega = BODEGAS[0];
      const salida = salidaHoy ?? aHora(dia, 9, r.entero(0, 25));
      for (let i = 0; i < cantidad; i++) {
        const p = nuevoPaquete(rep.id, { creado: base.toISOString() });
        paquetes.push(p);

        const llegada = esHoyFlag ? enMinutos(base, r() * Math.min(60, ventanaHoy * 0.15)) : enMinutos(base, r.entero(0, 60) + i);
        const estadoFisico = r.ponderado([['bien', 94], ['danado', 4], ['incompleto', 2]]);
        evento(p, 'llegada_bodega', llegada, rep.id, { estadoPaquete: estadoFisico, bodega: bodega.nombre }, 'bodega', bodega);
        evento(p, 'salida_ruta', salida, rep.id, {}, null, bodega);
        p.estado = 'en_ruta';
        let responsable = rep.id;
        let t = salida;

        if (!esHoyFlag && r() < 0.04) {
          const otro = r.de(REPARTIDORES.filter((x) => x.id !== rep.id));
          t = enMinutos(t, r.entero(40, 150));
          evento(p, 'transferencia', t, responsable, { de: responsable, a: otro.id, motivo: r.de(MOTIVOS_TRANSFERENCIA), aceptadaEn: enMinutos(t, r.entero(3, 20)).toISOString() }, 'bodega');
          responsable = otro.id;
          p.repartidorId = otro.id;
        }
        if (!esHoyFlag && r() < 0.03) {
          t = enMinutos(t, r.entero(10, 60));
          evento(p, 'incidente', t, responsable, { tipo: r.de(TIPOS_INCIDENTE), descripcion: 'Registrado en ruta.' }, 'danado');
        }

        // Resultado
        const entrega = esHoyFlag
          ? enMinutos(salida, (0.1 + r() * 0.9) * ((ahora - salida) / MIN))
          : enMinutos(salida, r.entero(55, 8 * 60));
        if (esHoyFlag && (entrega > ahora || r() < 0.3)) continue; // sigue en ruta
        const falla = !esHoyFlag && r() < 0.1;
        if (falla) {
          evento(p, 'excepcion', entrega, responsable, { motivo: r.ponderado([[MOTIVOS_EXCEPCION[0], 60], [MOTIVOS_EXCEPCION[1], 25], [MOTIVOS_EXCEPCION[2], 15]]) }, 'puerta');
          p.estado = 'excepcion';
          // 60% se vuelve a intentar al día siguiente y se entrega
          const manana = new Date(dia); manana.setDate(manana.getDate() + 1);
          if (manana.getDay() === 0) manana.setDate(manana.getDate() + 1); // los domingos no hay reparto
          if (r() < 0.6 && manana < hoy) {
            const segundo = aHora(manana, r.entero(10, 16), r.entero(0, 59), r.entero(0, 59));
            registrarEntrega(p, segundo, responsable);
          }
        } else {
          registrarEntrega(p, enMinutos(entrega, 0), responsable);
        }
      }
    }
  }

  function registrarEntrega(p, fecha, repId) {
    const relacion = r.ponderado([['titular', 70], ['familiar', 15], ['vecino', 7], ['recepción del edificio', 8]]);
    const recibio = relacion === 'titular' ? p.destinatario : nombrePersona();
    const f = new Date(fecha); f.setSeconds(r.entero(0, 59));
    evento(p, 'entrega', f, repId, { recibio, relacion, distanciaM: r.entero(3, 22), firma: r.entero(0, FIRMAS.length - 1) }, 'entrega');
    p.estado = 'entregado';
  }

  // Semanas anteriores (sin domingos)
  for (let d = semanas * 7; d >= 1; d--) {
    const dia = new Date(hoy); dia.setDate(dia.getDate() - d);
    if (dia.getDay() === 0) continue;
    simularDia(dia, false);
  }
  // Hoy
  consecutivoGuia = 48310;
  simularDia(hoy, true);

  // Por recoger (todavía no llegan a bodega)
  for (let i = 0; i < 6; i++) {
    paquetes.push(nuevoPaquete(r.de(REPARTIDORES).id, { estado: 'por_recoger', creado: ahora.toISOString() }));
  }

  // ---------- casos del mockup (pantalla 18) ----------
  const luis = 'R-0148';
  const carlos = 'R-0152';
  const casoBase = { ciudad: 'Aguascalientes', tamano: 'Caja mediana', peso: 3.2, origen: 'Nacional', creado: ahora.toISOString() };
  const hHoy = (h, m, s = 0) => {
    // Las horas del mockup si ya pasaron; si no, se recorren hacia atrás.
    const f = aHora(hoy, h, m, s);
    return f <= ahora ? f : enMinutos(ahora, -(aHora(hoy, 13, 30) - f) / MIN - 20);
  };

  const p190 = { ...casoBase, guia: 'DLV-48190', destinatario: 'Roberto Salas Cuéllar', telefono: '4499876543', direccion: 'Calle Nieto 118', colonia: 'Centro', lat: 21.8823, lng: -102.2826, repartidorId: carlos, estado: 'entregado' };
  paquetes.push(p190);
  evento(p190, 'llegada_bodega', hHoy(8, 12, 37), luis, { estadoPaquete: 'bien', bodega: 'Bodega Central' }, 'bodega', BODEGAS[0]);
  evento(p190, 'salida_ruta', hHoy(9, 5), luis, {}, null, { lat: 21.8745, lng: -102.2940 });
  evento(p190, 'transferencia', hHoy(10, 24), luis, { de: luis, a: carlos, motivo: 'Cambio de zona', aceptadaEn: hHoy(10, 31).toISOString() }, 'bodega', { lat: 21.8790, lng: -102.2893 });
  evento(p190, 'entrega', hHoy(13, 5, 18), carlos, { recibio: 'Roberto Salas Cuéllar', relacion: 'titular', distanciaM: 6, firma: 0 }, 'entrega');

  const p213 = { ...casoBase, guia: 'DLV-48213', destinatario: 'Mariana Ortega Ruiz', telefono: '4491234567', direccion: 'Av. Aguascalientes Sur 2143', colonia: 'Jardines de la Asunción', lat: 21.8598, lng: -102.2869, repartidorId: luis, estado: 'en_ruta' };
  paquetes.push(p213);
  evento(p213, 'llegada_bodega', hHoy(8, 12, 37), luis, { estadoPaquete: 'bien', bodega: 'Bodega Central' }, 'bodega', BODEGAS[0]);
  evento(p213, 'salida_ruta', enMinutos(ahora, -300), luis, {}, null, BODEGAS[0]);

  const p302 = { ...casoBase, guia: 'DLV-48302', destinatario: 'Ricardo Romo Delgado', telefono: '4495550199', direccion: 'Av. Tecnológico 1402', colonia: 'Ojocaliente', lat: 21.8712, lng: -102.2640, repartidorId: 'R-0161', estado: 'en_ruta' };
  paquetes.push(p302);
  evento(p302, 'llegada_bodega', enMinutos(ahora, -440), 'R-0161', { estadoPaquete: 'bien', bodega: 'Bodega Central' }, 'bodega', BODEGAS[0]);
  evento(p302, 'salida_ruta', enMinutos(ahora, -380), 'R-0161', {}, null, BODEGAS[0]);

  const p251 = { ...casoBase, guia: 'DLV-48251', destinatario: 'Valeria Macías Chávez', telefono: '4492201133', direccion: 'Calle Allende 415', colonia: 'San Marcos', lat: 21.8781, lng: -102.3001, repartidorId: 'R-0170', estado: 'excepcion' };
  paquetes.push(p251);
  evento(p251, 'llegada_bodega', enMinutos(ahora, -420), 'R-0170', { estadoPaquete: 'bien', bodega: 'Bodega Central' }, 'bodega', BODEGAS[0]);
  evento(p251, 'salida_ruta', enMinutos(ahora, -345), 'R-0170', {}, null, BODEGAS[0]);
  evento(p251, 'excepcion', enMinutos(ahora, -95), 'R-0170', { motivo: 'Nadie recibió', notas: 'Toqué dos veces y llamé al teléfono del cliente.' }, 'puerta');

  const p277 = { ...casoBase, guia: 'DLV-48277', destinatario: 'Eduardo Medina Luévano', telefono: '4498812200', direccion: 'Av. López Mateos 1301', colonia: 'San Luis', lat: 21.8790, lng: -102.3050, repartidorId: luis, estado: 'en_ruta' };
  paquetes.push(p277);
  evento(p277, 'llegada_bodega', hHoy(8, 15, 2), luis, { estadoPaquete: 'bien', bodega: 'Bodega Central' }, 'bodega', BODEGAS[0]);
  evento(p277, 'salida_ruta', enMinutos(ahora, -300), luis, {}, null, BODEGAS[0]);
  evento(p277, 'incidente', enMinutos(ahora, -140), luis, { tipo: 'Paquete dañado', descripcion: 'Se golpeó una esquina al acomodar la carga en la unidad.' }, 'danado');

  eventos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  return {
    generadoEn: ahora.toISOString(),
    bodegas: BODEGAS.map((b) => ({ ...b })),
    repartidores: REPARTIDORES.map((x) => ({ ...x })),
    administradores: ADMINISTRADORES.map((x) => ({ ...x })),
    paquetes,
    eventos,
    ajustes: { horasSinEventos: 6 },
    nombreRepartidor: nombreRep,
  };
}
