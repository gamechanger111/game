const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const players = {};  // store latest state of each player

io.on('connection', (socket) => {
  console.log('connected:', socket.id);

  socket.on('updateState', (state) => {
    players[socket.id] = state;
  });

  socket.on('disconnect', () => {
    console.log('disconnect', socket.id);
    delete players[socket.id];
  });
});

// Send updates periodically
setInterval(() => {
  io.emit('stateUpdate', players);
}, 100);  // every 100 ms

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server listening on", PORT));
