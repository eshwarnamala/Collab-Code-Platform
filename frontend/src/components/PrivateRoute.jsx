// import React from "react";
// import { useAuth } from "../context/AuthContext";
// import { useNavigate } from "react-router-dom";
// import { useEffect } from "react";

// const PrivateRoute = ({ children }) => {
//   const { user } = useAuth();
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (!user) navigate("/");
//   }, [user]);

//   return user ? children : null;
// };

// export default PrivateRoute;


import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <p>Loading...</p>; // Prevent rendering before authentication is checked

  return user ? <Outlet /> : <Navigate to="/" replace />;
};

export default PrivateRoute;


