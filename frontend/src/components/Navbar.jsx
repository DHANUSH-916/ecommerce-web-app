import { useEffect, useState } from "react";
import {
  NavLink,
  useNavigate,
} from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");

    return savedUser
      ? JSON.parse(savedUser)
      : null;
  });

  useEffect(() => {
    const updateUser = () => {
      const savedUser =
        localStorage.getItem("user");

      setUser(
        savedUser
          ? JSON.parse(savedUser)
          : null
      );
    };

    window.addEventListener(
      "authChanged",
      updateUser
    );

    window.addEventListener(
      "storage",
      updateUser
    );

    return () => {
      window.removeEventListener(
        "authChanged",
        updateUser
      );

      window.removeEventListener(
        "storage",
        updateUser
      );
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);

    window.dispatchEvent(
      new Event("authChanged")
    );

    navigate("/");
  };

  return (
    <nav className="navbar">
      <NavLink to="/" className="brand">
        ShopZone
      </NavLink>

      <div className="nav-links">
        <NavLink to="/">
          Home
        </NavLink>

        {user && user.role === "user" && (
          <>
            <NavLink to="/cart">
              Cart
            </NavLink>

            <NavLink to="/orders">
              My Orders
            </NavLink>
          </>
        )}

        {user && user.role === "admin" && (
          <NavLink to="/admin">
            Admin
          </NavLink>
        )}

        {!user ? (
          <>
            <NavLink to="/login">
              Login
            </NavLink>

            <NavLink to="/register">
              Register
            </NavLink>
          </>
        ) : (
          <>
            <span className="user-name">
              Hi, {user.name}
            </span>

            <button
              className="logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;