const WebSocket = require('ws');
const httpServer = require('http').createServer();
const io = require('socket.io')(httpServer, {
  cors: {
    origin: '*',
  },
});

httpServer.on('error', function(error) {
  console.error('Server error:', error);
});

httpServer.listen(3000, function() {
  console.log('Server listening on port 3000');
});

const wss = new WebSocket.Server({ port: 5000 }, function() {
  console.log('WebSocket server started');
});

wss.on('connection', function connection(ws) {
  console.log('New client connected');
 
  ws.on('message', function incoming(message) {
    console.log('Received message:', message);
 
    // Broadcast the message to all other clients
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', function close() {
    console.log('Client disconnected');
  });
});

io.on('connection', function(socket) {
  console.log('Client connected:', socket.id);
 
  socket.on('message', function(message) {
    console.log('Received message from', socket.id, ':', message);
 
    const parsedMessage = JSON.parse(message);
 
    switch (parsedMessage.type) {
      case 'offer':
      case 'answer':
      case 'icecandidate':
        broadcastMessage(socket.id, parsedMessage);
        break;
      default:
        console.error('Unknown message type:', parsedMessage.type);
        break;
    }
  });
 
  socket.on('disconnect', function() {
    console.log('Client disconnected:', socket.id);
  });
});
 
function broadcastMessage(senderId, message) {
  io.sockets.sockets.forEach(function(socket) {
    if (socket.id !== senderId) {
      socket.send(JSON.stringify(message));
    }
  });
}


