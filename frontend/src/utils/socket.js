import io from "socket.io-client";

// const socket = io("https://collab-code-platform-server.onrender.com", {
const socket = io("http://localhost:5000", {
  transports: ["websocket"],
});

export default socket;
