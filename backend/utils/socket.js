import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      // origin: "https://collab-code-platform-client.vercel.app",
      origin: "https://collab-code-platform-client.onrender.com",
      // origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Join a room
    socket.on("join-room", (roomId) => {
      socket.join(roomId);
      // console.log(`User ${socket.id} joined room ${roomId}`);
    });

    // Handle code changes
    socket.on("code-change", ({ roomId, code, filePath, fileName }) => {
      socket.to(roomId).emit("code-update", { code, filePath, fileName });
    });

    // Listen for cursor position changes
    // socket.on("cursor-position", ({ roomId, cursor, userId, username }) => {
    //     // console.log(`Cursor position received from ${username} (${userId}):`, cursor);
    //   socket.to(roomId).emit("cursor-update", { cursor, userId, username });
    // });

    socket.on("cursor-position", ({ roomId, cursor, userId, username, filePath, fileName }) => {
      socket.to(roomId).emit("cursor-update", {
        cursor,
        userId,
        username,
        filePath,
        fileName,
      });
    });
    

    
    

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};
