import { AuthProvider } from "./context/AuthContext";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import RoomPage from "./pages/RoomPage";
import PrivateRoute from "./components/PrivateRoute";
import { VoiceProvider } from "./context/VoiceContext";
import { VideoProvider } from "./context/VideoContext";
import Login from "./pages/Login";

function App() {
  return (
    <VideoProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Login />} />

            <Route element={<PrivateRoute />}>
              <Route path="/home" element={<Home />} />
              <Route path="/room/:roomId" element={<RoomPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </VideoProvider>
  );
}

export default App;
