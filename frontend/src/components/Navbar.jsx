import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, login, logout } = useAuth();

  return (
    <nav className="navbar">
      {/* <div className="logo">CollabCode</div> */}
      <div className="auth-section">
        {user ? (
          <div className="user-info">
            {/* Display profile image */}
            <img
              src={user.profileImage} 
              alt="Profile"
              className="profile-image"
            />
            <h1><span>Welcome, {user.displayName}</span></h1>
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
