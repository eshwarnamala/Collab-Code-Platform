// frontend/src/App.jsx
import { AuthProvider } from "./context/AuthContext";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import RoomPage from "./pages/RoomPage";
import PrivateRoute from "./components/PrivateRoute";
import { VoiceProvider } from './context/VoiceContext';
import Login from "./pages/Login";

function App() {
  return (
    <VoiceProvider>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          
          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/home" element={<Home />} />
            <Route path="/room/:roomId" element={<RoomPage />} />
          </Route>

          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </VoiceProvider>
  );
}

export default App;
