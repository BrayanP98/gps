const WebSocket = require('ws');

const history=require('./src/models/history.js');

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


function saveHistory(){



}




module.exports = {
  bufferToHex,
  crc16,
  saveHistory

 
};