import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Load user from localStorage if available
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("http://localhost:5000/auth/current-user", { credentials: "include" });
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user)); 
        } else {
          setUser(null);
          localStorage.removeItem("user"); 
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setUser(null);
        localStorage.removeItem("user");
      }
      setIsLoading(false); 
    };
    checkAuth();
  }, []);

  // Login redirect
  const login = () => {
    window.location.href = "http://localhost:5000/auth/github";
  };

  // Logout
  const logout = async () => {
    await fetch("/auth/logout", { credentials: "include" });
    setUser(null);
    localStorage.removeItem("user"); 
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
