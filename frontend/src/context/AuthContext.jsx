// // frontend/src/context/AuthContext.jsx
// import { createContext, useContext, useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const navigate = useNavigate();

//   // Check if user is logged in on initial load
//   useEffect(() => {
//     const checkAuth = async () => {
//       try {
//         const response = await fetch("/auth/current-user", { credentials: "include" });
//         const data = await response.json();
//         if (data.user) {
//             setUser(data.user);
//             // navigate("/home");
//         }
//       } catch (err) {
//         console.error("Auth check failed:", err);
//       }
//     };
//     checkAuth();
//   }, []);

//   // Login redirect
//   const login = () => {
//     window.location.href = "http://localhost:5000/auth/github";
//   };

//   // Logout
//   const logout = async () => {
//     await fetch("/auth/logout", { credentials: "include" });
//     setUser(null);
//     navigate("/");
//   };

//   return (
//     <AuthContext.Provider value={{ user, login, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);


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
        const response = await fetch("/auth/current-user", { credentials: "include" });
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user)); // Persist login state
        } else {
          setUser(null);
          localStorage.removeItem("user"); // Clear storage on logout
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setUser(null);
        localStorage.removeItem("user");
      }
      setIsLoading(false); // Authentication check completed
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
    localStorage.removeItem("user"); // Clear storage on logout
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
