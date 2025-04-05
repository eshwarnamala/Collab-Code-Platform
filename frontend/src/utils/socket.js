import io from "socket.io-client";

const socket = io("https://collab-code-platform-server.onrender.com", {
  transports: ["websocket"],
});

export default socket;
