// frontend/src/components/Navbar.jsx
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, login, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="logo">CollabCode</div>
      <div className="auth-section">
        {user ? (
          <div className="user-info">
            {/* Display profile image */}
            <img
              src={user.profileImage} // Use the stored URL
              alt="Profile"
              className="profile-image"
            />
            <span>Welcome, {user.displayName}</span>
            <button onClick={logout}>Logout</button>
          </div>
        ) : (
          <button onClick={login}>Login with GitHub</button>
        )}
      </div> 
    </nav>
  );
};

export default Navbar;
