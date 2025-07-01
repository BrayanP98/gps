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

function crc16xmodem(buffer) {
  let crc = 0x0000;
  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer[i] << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
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



async function buscarImei(imei) {
  try {
      const registro = await history.findOne({ imei });
    if (registro) {
      return { success: true, registro};
    } else {
      return { success: false, mensaje: "IMEI no registrado" };
    }
  } catch (err) {
    console.error("❌ Error al buscar IMEI:", err);
    return { success: false, mensaje: "Error interno" };
  }
}




module.exports = {
  bufferToHex,
  crc16,
  saveHistory,
  buscarImei,
  crc16xmodem

 
};