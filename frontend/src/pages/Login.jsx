import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/home");
  }, [user]);

  return (
    <div className="login-page">
      <h1>Collaborative Coding Platform</h1>
      <button onClick={() => window.location.href = "http://localhost:5000/auth/github"}>
        Login with GitHub
      </button>
    </div>
  );
};

export default Login;