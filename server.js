const net = require('net');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const history=require('./src/modules/history.js');
const User = require("./src/modules/user.js");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth.js");

const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET || "clave_secreta";
dotenv.config();


const socketIMEIs = new Map();

const { bufferToHex, crc16,  saveHistory, buscarImei} = require('./src/function.js');
require("./database");
// Configuración
const PUERTO= 5000;
const HTTP_PORT = process.env.PORT || 8080;

// Inicializar Express + HTTP + WebSocket
const app = express();
const server = http.createServer(app); // ✅ Servidor HTTP
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// ✅ WebSocket adjunto al servidor HTTP
// Servir archivos estáticos del frontend

server.listen(HTTP_PORT, () => {
 console.log(`Server listening on port ${HTTP_PORT}`);
});

const wss = new WebSocket.Server({ server }); 
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());            // ← para JSON
app.use(express.urlencoded({ extended: true })); // ← para formularios tipo `x-www-form-urlencoded`

// Servir frontend

app.use("/api/auth", authRoutes);

app.get("/dealer", async (req, res) => {
  const token = req.cookies.tokenSEssion; // Nombre de la cookie
  console.log("Token desde cookie:", token);
  if (!token) {
    return res.redirect("/login");
  }

  try {
    const decoded = jwt.verify(token, SECRET);
   // console.log("Usuario verificado:", decoded);

    const user = await User.findOne({ _id: decoded.userId   });
    
    console.log(user.dispositivos[1])

    
    res.render("dealer", {imeis: user.dispositivos });
  } catch (err) {
    console.error("Token inválido:", err);
    return res.redirect("/login");
  }
  

 
});
app.get("/login", async(req, res) => {

   



  res.render("login")

 
});
app.get("/sigInUp", async(req, res) => {
 
  res.render("sinIN")

 
});
app.get("/api/history", async (req, res) => {
  const imei = req.query.imei;

  console.log(imei)
  if (!imei) {
    return res.status(400).json({ success: false, error: "IMEI requerido" });
  }

  try {
    const historial = await history.findOne({ imei });

    if (!historial) {
      return res.status(404).json({ success: false, error: "Historial no encontrado" });
    }

    res.json({ success: true, historial });
  } catch (error) {
    res.status(500).json({ success: false, error: "Error interno" });
  }
});



const clientesPorIMEI = new Map();
// WebSocket
function enviarCoordenadas(lat, lon, course, speed, imei) {
 
  const mensaje = JSON.stringify({ lat, lon, course, speed, imei });

  const clientes = clientesPorIMEI.get(imei);
  if (!clientes) return;

  clientes.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(mensaje);
    }
  });
}

//console.log(`📡 WebSocket en ws://localhost:${PORT_WS}`);

const conexionesIMEI = new Map();
const imeiSockets = new Map();
////////////////////////////////////////////////////////

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
  

      if (data.tipo === 'suscribirse' && data.imei) {
      const imei = data.imei;
        // Vincular cliente a ese IMEI
        if (!clientesPorIMEI.has(imei)) {
          clientesPorIMEI.set(imei, new Set());
        }
        clientesPorIMEI.get(imei).add(ws);

        ws.imei = imei; // opcional, útil en desconexión
        console.log(`✅ Cliente suscrito al IMEI ${imei}`);
      }
      if (data.tipo === 'commands' && data.command&& data.imei) {
      var imei = data.imei;
        const command = data.command;
       console.log(command, imei)
        const comandoHex =  construirComandoGT06(command, imei);
     
         //console.log( construirComandoGT06(command, imei))
        const socket = imeiSockets.get(imei); // Busca socket por IMEI
  if (!socket) {
    return res.status(404).json({ success: false, message: "Dispositivo no conectado" });
  }

  try {
    const comandoBuffer = Buffer.from(comandoHex, 'hex');
    socket.write(comandoBuffer);
    console.log(`📤 Comando enviado a IMEI ${imei}: ${comandoHex}`);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error al enviar comando" });
  }



      }



    } catch (err) {
      console.error("❌ Error al parsear mensaje del cliente:", err.message);
    }
  });

  ws.on('close', () => {
    if (ws.imei && clientesPorIMEI.has(ws.imei)) {
      clientesPorIMEI.get(ws.imei).delete(ws);
      console.log(`🚪 Cliente desconectado de IMEI ${ws.imei}`);
    }
  });
});


// 🚀 Crear servidor TCP//////////////////////////////////////////////////////////////////////////////////////////////////////
const servert = net.createServer((socket) => {
  const remote = `${socket.remoteAddress}:${socket.remotePort}`;
  console.log(`📡 Conexión desde ${remote}`);

  socket.on('data',async  (data) => {
    console.log(`📨 Datos recibidos (${data.length} bytes)`);
    console.log('HEX:', bufferToHex(data));

    // Distinguir si es encabezado 0x78 0x78 (paquete normal) o 0x79 0x79 (extendido)
    const header = data.slice(0, 2).toString('hex');


    if (header === '7878') {




      const tipo = data[3];

      // ✅ Login
      if (tipo === 0x01 && data.length >= 16) {
        const imei = [...data.slice(4, 12)].map(b => b.toString(16).padStart(2, '0')).join('');
        console.log(`📍 IMEI estimado: ${imei}`);

      const resultado = await buscarImei(imei);
if (!resultado.success) {
      console.log(`❌ Acceso denegado: ${resultado.mensaje}`);
      const nack = Buffer.from("787805010001d9dc0d0a", "hex");
      socket.write(nack);
      socket.destroy(); // 🔥 Cierra conexión
      return;
    }




        const ack = Buffer.from('787805010001d9dc0d0a', 'hex');
        socket.write(ack);

         
        console.log('📤 ACK enviado para LOGIN');
        conexionesIMEI.set(socket, imei);
        imeiSockets.set(imei, socket);


        
  
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
let imei = conexionesIMEI.get(socket);
saveHistory(imei, lat, lon, course, speed);

enviarCoordenadas(lat, lon, course, speed, imei);

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

 
let imei = conexionesIMEI.get(socket);
enviarCoordenadas(latitude, longitude, course, speed, imei); // 🔥 Aquí se manda al front
 
 
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
let imei = conexionesIMEI.get(socket);
enviarCoordenadas(lat, lon, courseStatus, speed, imei);
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



///////////////////////////////////////////////comandos///////////////////////


function construirComandoGT06(tipo, imei) {
  const imeiHex = imei.slice(-8); // últimos 8 dígitos del IMEI
  const imeiBuffer = Buffer.from(imeiHex, 'hex');

  let payload;

  switch (tipo) {
    case "cutEngine": // 🔴 Corte de motor
      payload = Buffer.from("001004", "hex");
      break;

    case "restoreEngine": // 🟢 Restaurar motor
      payload = Buffer.from("001005", "hex");
      break;

    case "reboot": // 🔁 Reiniciar dispositivo
      payload = Buffer.from("001101", "hex");
      break;

    case "requestPosition": // 📍 Solicitar posición
      payload = Buffer.from("000000", "hex");
      break;

    default:
      throw new Error("Tipo de comando no reconocido");
  }

  // Armar paquete
  const protocolo = Buffer.from([0x80]);
  const serial = Buffer.from([0x00, 0x01]); // puedes incrementar si lo necesitas

  const longPayload = Buffer.concat([protocolo, payload, serial]);
  const longitud = Buffer.from([longPayload.length]);

  const crc = crc16(longPayload);
  const crcBuffer = Buffer.alloc(2);
  crcBuffer.writeUInt16BE(crc);

  const header = Buffer.from([0x78, 0x78]);
  const tail = Buffer.from([0x0D, 0x0A]);

  const comandoCompleto = Buffer.concat([
    header,
    longitud,
    longPayload,
    crcBuffer,
    tail,
  ]);

  return comandoCompleto;
}




