import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const users = new Set();

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join', (username) => {
    if (!username || username.trim() === '') {
      socket.emit('join error', 'Username cannot be empty');
      return;
    }
    
    if (users.has(username)) {
      socket.emit('join error', 'Username is already taken');
      return;
    }

    users.add(username);
    socket.username = username;
    socket.emit('join success', username);
    io.emit('user joined', username);
    io.emit('user list', Array.from(users));
  });

  socket.on('chat message', (msg) => {
    if (socket.username) {
      io.emit('chat message', { username: socket.username, message: msg });
    }
  });

  socket.on('disconnect', () => {
    if (socket.username) {
      users.delete(socket.username);
      io.emit('user left', socket.username);
      io.emit('user list', Array.from(users));
    }
    console.log('A user disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});