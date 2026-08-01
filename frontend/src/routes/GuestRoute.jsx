import { Navigate } from "react-router-dom";

function GuestRoute({ children }) {
  const token = localStorage.getItem("token");

  if (token) {
    const user = JSON.parse(
      localStorage.getItem("user") || "null"
    );

    if (user?.role === "admin") {
      return <Navigate to="/admin" replace />;
    }

    return <Navigate to="/" replace />;
  }

  return children;
}

export default GuestRoute;