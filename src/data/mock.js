// Datos simulados mientras Vaneza publica los endpoints reales.
// La forma de cada objeto sigue el modelo de datos del documento de división del trabajo
// (paquetes, eventos, transferencias). Cuando exista la API, solo cambia src/services/api.js.

const FOTO_BODEGA = require('../../assets/foto-bodega.jpg');
const FOTO_DANADO = require('../../assets/foto-danado.jpg');

export const fotosDemo = { bodega: FOTO_BODEGA, danado: FOTO_DANADO };

export const BODEGA_CENTRAL = {
  id: 'BOD-01',
  nombre: 'Bodega Central',
  lat: 21.8712,
  lng: -102.2981,
};

export const usuarioDemo = {
  numero: 'R-0148',
  nombre: 'Luis Hernández',
  nombreCorto: 'Luis',
  zona: 'Ruta zona centro',
  telefono: '449 118 2030',
};

// Hoy a una hora dada (para que el historial se vea como el del mockup).
function hoyA(h, m, s = 0) {
  const d = new Date();
  d.setHours(h, m, s, 0);
  return d.toISOString();
}

function eventosBase(guia) {
  return [
    {
      id: `${guia}-e1`,
      tipo: 'llegada_bodega',
      fecha: hoyA(8, 12, 37),
      lugar: 'Bodega Central',
      estadoPaquete: 'bien',
      foto: FOTO_BODEGA,
      responsable: 'Luis Hernández',
    },
    {
      id: `${guia}-e2`,
      tipo: 'salida_ruta',
      fecha: hoyA(9, 5),
      lugar: 'Bodega Central',
      responsable: 'Luis Hernández',
    },
  ];
}

const base = {
  ciudad: 'Aguascalientes, Ags.',
  tamano: 'Caja mediana',
  peso: 3.2,
  requiere: 'Foto y firma',
};

const enRuta = [
  {
    guia: 'DLV-48213',
    destinatario: 'Mariana Ortega Ruiz',
    telefono: '4491234567',
    direccion: 'Av. Aguascalientes Sur 2143',
    colonia: 'Jardines de la Asunción',
    lat: 21.8598, lng: -102.2869,
    ventana: '11:00 a 13:00',
    indicaciones: 'Portón negro, el timbre no funciona. Llamar al llegar.',
  },
  {
    guia: 'DLV-48190',
    destinatario: 'Roberto Salas Cuéllar',
    telefono: '4499876543',
    direccion: 'Calle Nieto 118',
    colonia: 'Centro',
    lat: 21.8823, lng: -102.2826,
    ventana: '12:00 a 14:00',
  },
  {
    guia: 'DLV-48244',
    destinatario: 'Cecilia Pérez Ávila',
    telefono: '4495551122',
    direccion: 'Blvd. a Zacatecas 1120',
    colonia: 'Las Américas',
    lat: 21.8951, lng: -102.2979,
    ventana: '13:00 a 15:00',
  },
  {
    guia: 'DLV-48258',
    destinatario: 'Andrés Villalobos',
    telefono: '4493332211',
    direccion: 'Av. Universidad 902',
    colonia: 'Bosques del Prado',
    lat: 21.9112, lng: -102.3105,
    ventana: '13:00 a 15:00',
  },
  {
    guia: 'DLV-48261',
    destinatario: 'Fernanda Lozano',
    telefono: '4497778899',
    direccion: 'Calle Madero 455',
    colonia: 'Centro',
    lat: 21.8835, lng: -102.2921,
    ventana: '14:00 a 16:00',
  },
  {
    guia: 'DLV-48270',
    destinatario: 'Luciana Barrios',
    telefono: '4492224466',
    direccion: 'Av. López Mateos 1301',
    colonia: 'San Luis',
    lat: 21.8781, lng: -102.3052,
    ventana: '15:00 a 17:00',
  },
  {
    guia: 'DLV-48275',
    destinatario: 'Héctor Ramírez',
    telefono: '4496663311',
    direccion: 'Calle Juárez 210',
    colonia: 'Barrio de Guadalupe',
    lat: 21.8871, lng: -102.2958,
    ventana: '16:00 a 18:00',
  },
].map((p, i) => ({ ...base, ...p, orden: 6 + i, estado: 'en_ruta', eventos: eventosBase(p.guia) }));

const porRecoger = [
  { guia: 'DLV-48290', destinatario: 'Patricia Nava Soto', direccion: 'Av. Convención Oriente 612', colonia: 'Del Trabajo', lat: 21.8856, lng: -102.2765, ventana: 'Mañana, 10:00 a 12:00', origen: 'Nacional' },
  { guia: 'DLV-48291', destinatario: 'Jorge Esparza León', direccion: 'Calle Hornedo 330', colonia: 'Centro', lat: 21.8808, lng: -102.2951, ventana: 'Mañana, 11:00 a 13:00', origen: 'Internacional' },
  { guia: 'DLV-48292', destinatario: 'Daniela Muñoz Rivas', direccion: 'Av. Siglo XXI 4410', colonia: 'Villas de Nuestra Señora', lat: 21.8469, lng: -102.2911, ventana: 'Mañana, 12:00 a 14:00', origen: 'Nacional' },
].map((p, i) => ({ ...base, ...p, telefono: '4490000000', orden: 13 + i, estado: 'por_recoger', eventos: [] }));

const entregados = [
  { guia: 'DLV-48150', destinatario: 'Rosa Elena Díaz', direccion: 'Calle Morelos 88', colonia: 'Centro', hora: [9, 41] },
  { guia: 'DLV-48152', destinatario: 'Miguel Ángel Prieto', direccion: 'Av. Héroe de Nacozari 1502', colonia: 'San Pablo', hora: [10, 2] },
  { guia: 'DLV-48161', destinatario: 'Carolina Vega', direccion: 'Calle Allende 415', colonia: 'San Marcos', hora: [10, 18] },
  { guia: 'DLV-48177', destinatario: 'Tomás Guerrero', direccion: 'Av. Adolfo López Mateos 820', colonia: 'Circunvalación Norte', hora: [10, 31] },
  { guia: 'DLV-48182', destinatario: 'Alejandra Ruvalcaba', direccion: 'Calle Libertad 67', colonia: 'Obraje', hora: [10, 44] },
].map((p, i) => ({
  ...base,
  ...p,
  telefono: '4490000000',
  lat: 21.88, lng: -102.29,
  ventana: '09:00 a 11:00',
  orden: 1 + i,
  estado: 'entregado',
  entregadoEn: hoyA(p.hora[0], p.hora[1]),
  eventos: [
    ...eventosBase(p.guia),
    { id: `${p.guia}-e3`, tipo: 'entrega', fecha: hoyA(p.hora[0], p.hora[1]), lugar: p.direccion, responsable: 'Luis Hernández' },
  ],
}));

export const paquetesDemo = [...enRuta, ...porRecoger, ...entregados];

// Transferencia que otro repartidor le mandó a Luis (pantalla para aceptar o rechazar).
export const transferenciasDemo = [
  {
    id: 'TR-2031',
    de: { numero: 'R-0161', nombre: 'Ana Torres' },
    motivo: 'Ruta saturada',
    fecha: hoyA(10, 24),
    foto: FOTO_BODEGA,
    paquete: {
      ...base,
      guia: 'DLV-48288',
      destinatario: 'Sofía Márquez Lara',
      telefono: '4494441100',
      direccion: 'Calle Venustiano Carranza 540',
      colonia: 'Centro',
      lat: 21.8841, lng: -102.2989,
      ventana: '15:00 a 17:00',
      orden: 16,
      estado: 'en_transferencia',
      eventos: [
        { id: 'DLV-48288-e1', tipo: 'llegada_bodega', fecha: hoyA(8, 3), lugar: 'Bodega Central', estadoPaquete: 'bien', foto: FOTO_BODEGA, responsable: 'Ana Torres' },
        { id: 'DLV-48288-e2', tipo: 'salida_ruta', fecha: hoyA(8, 50), lugar: 'Bodega Central', responsable: 'Ana Torres' },
      ],
    },
  },
];

// Destinos posibles para una transferencia (pantalla 9).
export const destinosTransferencia = [
  { id: 'R-0152', tipo: 'repartidor', nombre: 'Carlos Mendoza', detalle: 'R-0152, zona norte, en ruta' },
  { id: 'R-0161', tipo: 'repartidor', nombre: 'Ana Torres', detalle: 'R-0161, zona oriente, en ruta' },
  { id: 'BOD-02', tipo: 'bodega', nombre: 'Bodega Norte', detalle: 'Segunda bodega' },
];
