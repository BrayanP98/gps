function bufferToHex(buffer) {
  return [...buffer].map(b => b.toString(16).padStart(2, '0')).join(' ');
}

// ✅ CRC16 para ACKs
function crc16(buffer) {
  let crc = 0xFFFF;
  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xA001;
      } else {
        crc >>>= 1;
      }
    }
  }
  return crc;
}



function enviarCoordenadas(lat, lon, course, speed) {
  const mensaje = JSON.stringify({ lat, lon, course, speed});
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(mensaje);
    }
  });
}

module.exports = {
  bufferToHex,
  crc16,
  enviarCoordenadas
 
};