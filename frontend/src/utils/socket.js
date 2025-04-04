import io from "socket.io-client";

const socket = io("https://collab-code-platform-server.vercel.app/auth/github"); 

export default socket;