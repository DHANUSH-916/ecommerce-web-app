import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import api from "../services/api";
import "../styles/auth.css";
import shoppingImage from "../assets/auth-shopping.jpg";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/login", formData);

      localStorage.setItem(
        "token",
        response.data.access_token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      if (rememberMe) {
        localStorage.setItem("rememberEmail", formData.email);
      }

      window.dispatchEvent(new Event("authChanged"));

      if (response.data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">

        <div className="auth-left">

          <h1>ShopZone</h1>

          <p>
            Shop smarter with thousands of premium
            products, secure payments, and lightning-fast
            delivery.
          </p>

          <div className="auth-features">
            <div className="auth-feature">
              🛒 Premium Products
            </div>

            <div className="auth-feature">
              🚚 Fast Delivery
            </div>

            <div className="auth-feature">
              🔒 Secure Payments
            </div>

            <div className="auth-feature">
              ⭐ Trusted by Thousands
            </div>
          </div>

          <img
  src={shoppingImage}
  alt="Shopping"
  style={{
    width: "350px",
    height: "350px",
    border: "3px solid red",
    background: "white",
    display: "block",
    marginTop: "30px"
  }}
/>

        </div>

        <div className="auth-right">

          <div className="auth-card">

            <h2>Welcome Back 👋</h2>

            <p>
              Login to continue your shopping journey.
            </p>

            {error && (
              <p className="error-message">
                {error}
              </p>
            )}

            <form
              className="auth-form"
              onSubmit={handleSubmit}
            >

              <label>Email Address</label>

              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <label>Password</label>

              <div className="password-field">

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                >
                  {showPassword ? (
                    <FaEyeSlash />
                  ) : (
                    <FaEye />
                  )}
                </button>

              </div>

              <div className="auth-options">

                <label>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={() =>
                      setRememberMe(
                        !rememberMe
                      )
                    }
                  />

                  Remember Me
                </label>

                <Link to="#">
                  Forgot Password?
                </Link>

              </div>

              <button
                className="auth-btn"
                disabled={loading}
              >
                {loading
                  ? "Logging In..."
                  : "Login"}
              </button>

            </form>

            <div className="auth-footer">

              Don't have an account?{" "}

              <Link to="/register">
                Create Account
              </Link>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default Login;