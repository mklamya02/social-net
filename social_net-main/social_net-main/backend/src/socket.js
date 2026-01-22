const envVar = require("./config/EnvVariable");
let io;
const connectedUsers = new Map();

const initSocket = (server) => {
  const { Server } = require("socket.io");

  io = new Server(server, {
    cors: {
      origin: envVar.VITE_CLIENT_URL,
      methods: ["GET", "POST", "PATCH"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("register", (userId) => {
      connectedUsers.set(userId, socket.id);
    });

    socket.on("disconnect", () => {
      for (const [userId, id] of connectedUsers.entries()) {
        if (id === socket.id) connectedUsers.delete(userId);
      }
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};

const emitToUser = (userId, event, payload) => {
  const socketId = connectedUsers.get(userId);
  if (io && socketId) {
    io.to(socketId).emit(event, payload);
  }
};

const broadcast = (event, payload) => {
  if (io) {
    io.emit(event, payload);
  }
};

module.exports = {
  initSocket,
  emitToUser,
  broadcast,
  connectedUsers
};
