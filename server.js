const net = require('net');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const { bufferToHex, crc16,  saveHistory } = require('./src/function.js');
require("./database");
// Configuración
const PUERTO= 5000;
const HTTP_PORT = process.env.PORT || 8080;

// Inicializar Express + HTTP + WebSocket
const app = express();
const server = http.createServer(app); // ✅ Servidor HTTP

// ✅ WebSocket adjunto al servidor HTTP
// Servir archivos estáticos del frontend

server.listen(HTTP_PORT, () => {
 console.log(`Server listening on port ${HTTP_PORT}`);
});

const wss = new WebSocket.Server({ server }); 
app.use(express.static(path.join(__dirname, 'public')));
// Servir frontend

app.get("/", async(req, res) => {
 
  res.render("index.html")

 
});

// WebSocket

function enviarCoordenadas(lat, lon, course, speed) {
  console.log(lat,lon,course)
  const mensaje = JSON.stringify({ lat, lon, course, speed});
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(mensaje);
    }
  });
}
//console.log(`📡 WebSocket en ws://localhost:${PORT_WS}`);



// TCP Server
// 🧠 Utilidad para mostrar los datos en hexadecimal

// 🚀 Crear servidor TCP
const servert = net.createServer((socket) => {
  const remote = `${socket.remoteAddress}:${socket.remotePort}`;
  console.log(`📡 Conexión desde ${remote}`);

  socket.on('data', (data) => {
    console.log(`📨 Datos recibidos (${data.length} bytes)`);
    console.log('HEX:', bufferToHex(data));

    // Distinguir si es encabezado 0x78 0x78 (paquete normal) o 0x79 0x79 (extendido)
    const header = data.slice(0, 2).toString('hex');
function generarACKLogin(serial1 = 0x00, serial2 = 0x01) {
  const payload = Buffer.from([0x05, 0x01, serial1, serial2]); // Longitud, tipo, serial
  const crc = crc16(payload);
  const crcBuf = Buffer.alloc(2);
  crcBuf.writeUInt16BE(crc);

  return Buffer.concat([
    Buffer.from([0x78, 0x78]),
    payload,
    crcBuf,
    Buffer.from([0x0D, 0x0A])
  ]);
}
const conexionesIMEI = new Map();
const bufferPendiente = new Map(); // socket → array

function guardarTemporalOHistorial(socket, lat, lon, course, speed) {
  const imei = conexionesIMEI.get(socket);

  if (imei) {
    // ✅ Ya se conoce el IMEI, guardar directo
    saveHistory(imei, lat, lon, course, speed);
  } else {
    // ⚠️ Guardar temporalmente
    if (!bufferPendiente.has(socket)) {
      bufferPendiente.set(socket, []);
    }
    bufferPendiente.get(socket).push({ lat, lon, course, speed });
    console.log('🕒 Coordenadas almacenadas temporalmente, esperando login');
  }
}
    if (header === '7878') {
      const tipo = data[3];

      // ✅ Login
      if (tipo === 0x01 && data.length >= 16) {
        const imei = [...data.slice(4, 12)].map(b => b.toString(16).padStart(2, '0')).join('');
        console.log(`📍 IMEI estimado: ${imei}`);
        const ack = Buffer.from('787805010001d9dc0d0a', 'hex');
        socket.write(ack);

         
        console.log('📤 ACK enviado para LOGIN');


         if (bufferPendiente.has(socket)) {
    const datosPendientes = bufferPendiente.get(socket);
    for (const { lat, lon, course, speed } of datosPendientes) {
      saveHistory(imei, lat, lon, course, speed);
    }
    bufferPendiente.delete(socket);
    console.log(`✅ Se guardaron ${datosPendientes.length} coordenadas pendientes para ${imei}`);
  }
      }
console.log(`📦 Tipo de paquete recibido: 0x${tipo.toString(16)}`);

/////////////////////////////////////////////
// ✅ Estado LBS tipo 0x13
if (tipo === 0x13 && data.length >= 15) {
  const mcc = (data[4] << 8) | data[5];
  const mnc = data[6];
  const lac = (data[7] << 8) | data[8];
  const cellId = (data[9] << 8) | data[10];

  console.log(`📦 Tipo de paquete 0x13 (Estado LBS / Heartbeat)
📶 MCC: ${mcc}
📡 MNC: ${mnc}
🏙️  LAC: ${lac}
📍 Cell ID: ${cellId}`);

  const serial1 = data[data.length - 6];
  const serial2 = data[data.length - 5];
  const payload = Buffer.from([0x05, 0x13, serial1, serial2]);
  const crc = crc16(payload);
  const crcBuf = Buffer.alloc(2);
  crcBuf.writeUInt16BE(crc);

  const ack = Buffer.concat([
    Buffer.from([0x78, 0x78]),
    payload,
    crcBuf,
    Buffer.from([0x0D, 0x0A]),
  ]);
  socket.write(ack);
  console.log('📤 ACK enviado para paquete 0x13');
}

if (tipo === 0xA0 && data.length >= 41) {
  const year = 2000 + data[4];
  const month = data[5];
  const day = data[6];
  const hour = data[7];
  const minute = data[8];
  const second = data[9];

  const gpsInfo = data[10];
  const gpsValid = (gpsInfo & 0x80) >> 7;
  const satellites = gpsInfo & 0x1F;

  let lat = data.readUInt32BE(11) / 30000 / 60;
  let lon =- data.readUInt32BE(15) / 30000 / 60;

  const speed = data[19];
  const courseStatus = data.readUInt16BE(20);
  const isLatNegative = (courseStatus & 0x8000) !== 0;
  const isLonNegative = (courseStatus & 0x4000) !== 0;
  const course = courseStatus & 0x03FF;

  if (isLatNegative) lat *-1;
  if (isLonNegative) lon *-1;

  const mcc = data.readUInt16BE(22);
  const mnc = data[24];
  const lac = data.readUInt16BE(25);
  const cellId = data.readUInt32BE(27);

  const deviceId = [...data.slice(31, 35)].map(b => b.toString(16).padStart(2, '0')).join('');

  console.log(`📦 Tipo de paquete 0xA0 (Posición extendida)
🕒 Fecha/Hora: ${year}-${month}-${day} ${hour}:${minute}:${second}
📡 Satélites: ${satellites} | GPS válido: ${gpsValid}
📍 Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}
🚗 Velocidad: ${speed} km/h | Curso: ${course}°
📶 MCC: ${mcc}, MNC: ${mnc}, LAC: ${lac}, CellID: ${cellId}
🔐 ID parcial: ${deviceId}`);

guardarTemporalOHistorial(socket, lat, lon, course, speed);


  // ACK
  const serial1 = data[data.length - 6];
  const serial2 = data[data.length - 5];
  const payload = Buffer.from([0x05, 0xA0, serial1, serial2]);
  const crc = crc16(payload);
  const crcBuf = Buffer.alloc(2);
  crcBuf.writeUInt16BE(crc);
  const ack = Buffer.concat([
    Buffer.from([0x78, 0x78]),
    payload,
    crcBuf,
    Buffer.from([0x0D, 0x0A]),
  ]);
  socket.write(ack);
  console.log('📤 ACK enviado para paquete 0xA0');
}

/////////////////////////////////
// ✅ Paquete extendido tipo 0xA4
if (tipo === 0xA4 && data.length >= 45) {
  const year = 2000 + data[4];
  const month = data[5];
  const day = data[6];
  const hour = data[7];
  const minute = data[8];
  const second = data[9];

  const gpsInfo = data[10];
  const gpsValid = (gpsInfo & 0x80) >> 7;
  const satellites = gpsInfo & 0x1F;

  const latRaw = data.readUInt32BE(11);
  const latitude = latRaw / 30000 / 60;

  const lonRaw = data.readUInt32BE(15);
  const longitude = -lonRaw / 30000 / 60;
    

   const course = data.readUInt16BE(20) & 0x03FF;
 
  const isLatNegative = (course & 0x8000) !== 0;
  const isLonNegative = (course & 0x4000) !== 0;

  if (isLatNegative) latitude = -latitude;
if (isLonNegative) longitude = -longitude;


 
  const speed = data[19];


  const mcc = data.readUInt16BE(22);
  const mnc = data[24];
  const lac = data.readUInt16BE(25);
  const cellId = data.readUInt32BE(27);

  const deviceID = [...data.slice(33, 37)].map(b => b.toString(16).padStart(2, '0')).join('');

  console.log(`📦 Tipo de paquete 0xA4 (Datos extendidos GPS)
🕒 Fecha: ${year}-${month}-${day} ${hour}:${minute}:${second}
📡 GPS válido: ${gpsValid}, Satélites: ${satellites}
🌍 Latitud: ${latitude.toFixed(6)}, Longitud: ${longitude.toFixed(6)}
🚗 Velocidad: ${speed} km/h, Curso: ${course}°
📶 Torre: MCC=${mcc}, MNC=${mnc}, LAC=${lac}, CellID=${cellId}
🔐 ID dispositivo (parcial): ${deviceID}`);

 
enviarCoordenadas(latitude, longitude, course, speed); // 🔥 Aquí se manda al front
 
 
 // Puedes responder con un ACK genérico si lo deseas:
  const serial1 = data[data.length - 6];
  const serial2 = data[data.length - 5];
  const payload = Buffer.from([0x05, 0xA4, serial1, serial2]);
  const crc = crc16(payload);
  const crcBuf = Buffer.alloc(2);
  crcBuf.writeUInt16BE(crc);
  const ack = Buffer.concat([
    Buffer.from([0x78, 0x78]),
    payload,
    crcBuf,
    Buffer.from([0x0D, 0x0A]),
  ]);
  socket.write(ack);
  console.log('📤 ACK enviado para paquete 0xA4');
}



        // ✅ Posición tipo 0x12
      if (tipo === 0x22 && data.length >= 28) {
  const year = 2000 + data[4];
  const month = data[5];
  const day = data[6];
  const hour = data[7];
  const minute = data[8];
  const second = data[9];

  const satellites = data[10] & 0x0F;

  let lat = data.readUInt32BE(11) / 30000 / 60;
  let lon = data.readUInt32BE(15) / 30000 / 60;
  const speed = data[19];

  const courseStatus = data.readUInt16BE(20);
  const isLatNegative = (courseStatus & 0x8000) !== 0;
  const isLonNegative = (courseStatus & 0x4000) !== 0;

  if (isLatNegative) lat *= -1;
  if (isLonNegative) lon *= -1;

  console.log(`📍 POSICIÓN:
🗓️ ${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}
📡 Satélites: ${satellites}
📍 Lat: ${lat.toFixed(6)}
📍 Lon: ${lon.toFixed(6)}
🚗 Vel: ${speed} km/h`);
enviarCoordenadas(lat, lon); // 🔥 Aquí se manda al front
  const serial1 = data[data.length - 6];
  const serial2 = data[data.length - 5];
  const payload = Buffer.from([0x05, 0x22, serial1, serial2]);
  const crc = crc16(payload);
  const crcBuf = Buffer.alloc(2);
  crcBuf.writeUInt16BE(crc);

  const ack = Buffer.concat([
    Buffer.from([0x78, 0x78]),
    payload,
    crcBuf,
    Buffer.from([0x0D, 0x0A]),
  ]);
  socket.write(ack);
  console.log('📤 ACK enviado para POSICIÓN 0x22');
}


    } else if (header === '7979') {
      // Paquete extendido
      const tipoExtendido = data[4];

      if (tipoExtendido === 0x94) {
  console.log('🔎 Paquete extendido tipo 0x94 recibido (datos de sensores o dispositivos)');

  const serial1 = data[data.length - 6];
  const serial2 = data[data.length - 5];
  const payload = Buffer.from([0x05, 0x94, serial1, serial2]);
  const crc = crc16(payload);
  const crcBuf = Buffer.alloc(2);
  crcBuf.writeUInt16BE(crc);

  const ack = Buffer.concat([
    Buffer.from([0x78, 0x78]),
    payload,
    crcBuf,
    Buffer.from([0x0D, 0x0A]),
  ]);
  socket.write(ack);

  // 👇 Aquí definimos correctamente la posición del estado de sensores (ajusta si tu protocolo lo requiere)
  const pos = 6; // posición después de 79 79 01 LEN 94 xx xx (verifica con tu paquete HEX)

  const estadoSensores = data.readUInt16BE(pos);
  const bin = estadoSensores.toString(2).padStart(16, '0');

  console.log(`Estado binario: ${bin}`);
  console.log(`ACC: ${bin[0] === '1' ? 'Encendido' : 'Apagado'}`);
  console.log(`Motor: ${bin[1] === '1' ? 'Encendido' : 'Apagado'}`);
  console.log(`Entrada 1: ${bin[4] === '1' ? 'Activa' : 'Inactiva'}`);
  console.log(`Entrada 2: ${bin[5] === '1' ? 'Activa' : 'Inactiva'}`);

  console.log('📤 ACK enviado para EXTENDIDO 0x94');
}
 else {
        console.log(`📦 Paquete extendido tipo desconocido: 0x${tipoExtendido.toString(16)}`);
      }
    } else {
      console.log(`⚠️ Encabezado no reconocido: ${header}`);
    }
  });

  socket.on('error', (err) => {
    console.error(`❌ Error con ${remote}:`, err.message);
  });

  socket.on('close', () => {
    console.log(`🔌 Conexión cerrada con ${remote}`);
  });
});

servert.listen(PUERTO, '0.0.0.0', () => {
  console.log(`🚀 Servidor TCP escuchando en puerto ${PUERTO}`);
});
