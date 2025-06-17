const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });
console.log('🌐 WebSocket activo en ws://localhost:8080');

let clients = [];

wss.on('connection', (ws) => {
  console.log('✅ Cliente conectado');
  clients.push(ws);

  ws.on('close', () => {
    clients = clients.filter(client => client !== ws);
    console.log('❌ Cliente desconectado');
  });
});

// 🔁 Función para emitir coordenadas a todos los clientes
function broadcastCoordinates(lat, lon) {
  const data = JSON.stringify({ lat, lon });
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// ✨ Simulación (puedes quitar esto y conectar con tu GPS real)


module.exports = { broadcastCoordinates };
