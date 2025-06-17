const net = require('net');

const client = new net.Socket();

client.connect(14291, '6.tcp.ngrok.io', () => {
  console.log('✅ Conectado al servidor');

  // Envía un mensaje tipo GPS (hexadecimal)
  const hex = '78780d01035933907518046200018edd9po';
  const buffer = Buffer.from(hex, 'hex');
  client.write(buffer);
});

client.on('data', (data) => {
  console.log('📨 Respuesta:', data.toString('hex'));
});

client.on('close', () => {
  console.log('🔌 Conexión cerrada');
});
