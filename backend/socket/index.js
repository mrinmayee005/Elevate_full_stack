const { Server } = require('socket.io');

let io;
const onlineUsers = new Map();

function initSocket(server, allowedOrigins) {
  io = new Server(server, {
    cors: {
      credentials: true,
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`Socket CORS blocked origin: ${origin}`));
      }
    }
  });

  io.on('connection', (socket) => {
    socket.on('register', ({ userId, role }) => {
      if (!userId) return;
      onlineUsers.set(String(userId), socket.id);
      socket.join(String(userId));
      socket.join(role);
    });

    socket.on('join:department', (departmentId) => socket.join(`department:${departmentId}`));
    socket.on('message:send', (payload) => io.emit('message:new', payload));

    socket.on('disconnect', () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) onlineUsers.delete(userId);
      }
    });
  });
}

function emitToUser(userId, event, payload) {
  if (io && userId) io.to(String(userId)).emit(event, payload);
}

function emitToRole(role, event, payload) {
  if (io) io.to(role).emit(event, payload);
}

function emitToDepartment(departmentId, event, payload) {
  if (io) io.to(`department:${departmentId}`).emit(event, payload);
}

function emitAll(event, payload) {
  if (io) io.emit(event, payload);
}

module.exports = { initSocket, emitToUser, emitToRole, emitToDepartment, emitAll };
