import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [action, setAction] = useState("create"); // 'create' or 'join'
  const [roomName, setRoomName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [password, setPassword] = useState("");

  // Fetch active rooms (only for members)
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch("/api/rooms/active", {
          credentials: "include",
        });
        const data = await response.json();
        setRooms(data);
      } catch (err) {
        console.error("Failed to fetch rooms:", err);
      }
    };
    if (user) fetchRooms();
  }, [user]);

  // Create Room
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/rooms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: roomName, password }),
        credentials: "include",
      });
      const { roomId } = await response.json();
      navigate(`/room/${roomId}`); // Redirect to the room
    } catch (err) {
      alert("Failed to create room");
    }
  };

  // Join Room
  const handleJoinRoom = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/rooms/${roomId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        credentials: "include",
      });
      if (response.ok) navigate(`/room/${roomId}`); // Redirect to the room
      else alert("Invalid credentials");
    } catch (err) {
      alert("Failed to join room");
    }
  };


  return (
    <div className="home-container">
        <div className="intro">
            <h1>{user.displayName}, Welcome to CodeCollab!!</h1>
            <p>Create and join virtual rooms with friends, family, or colleagues.</p>
        </div>
      <div className="room-actions">
        <button onClick={() => setAction("create")}>Create Room</button>
        <button onClick={() => setAction("join")}>Join Room</button>
      </div>

      {action === "create" ? (
        <form onSubmit={handleCreateRoom}>
          <input
            type="text"
            placeholder="Room Name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Room Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Create</button>
        </form>
      ) : (
        <form onSubmit={handleJoinRoom}>
          <input
            type="text"
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Room Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Join</button>
        </form>
      )}

      <div className="active-rooms">
        <h2>Your Active Rooms</h2>
        {rooms.map((room) => (
          <div key={room.roomId} className="room-card">
            <h3>{room.name}</h3>
            <button onClick={() => navigate(`/room/${room.roomId}`)}>
              Rejoin
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
