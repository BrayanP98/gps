const WebSocket = require('ws');

const history=require('./modules/history.js');

/////////////


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


async function saveHistory (imei,lat,lon,course,speed){
//let dispositive = await history.findOne({ imei });


  try {
    const nuevaEntrada = {
      lon,
      lat,
      course,
      speed,
      timestamp: new Date()
    };

    await history.findOneAndUpdate(
      { imei },
      { $push: { historial: nuevaEntrada } },
      { upsert: true }
    );

    console.log(`📍 Punto guardado para IMEI ${imei}`);
  } catch (err) {
    console.error('❌ Error al guardar historial:', err);
  }


}




module.exports = {
  bufferToHex,
  crc16,
  saveHistory

 
};