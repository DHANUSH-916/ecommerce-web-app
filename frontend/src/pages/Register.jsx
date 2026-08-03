import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import api from "../services/api";
import "../styles/auth.css";
import shoppingImage from "../assets/auth-shopping.jpg";

function Register() {
  const navigate = useNavigate();

 const [formData, setFormData] = useState({
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
});

  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };
  const getPasswordStrength = (password) => {
  let score = 0;

  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  return score;
};

const strength = getPasswordStrength(formData.password);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (formData.password !== formData.confirmPassword) {
  setError("Passwords do not match.");
  return;
}

    if (!acceptedTerms) {
      setError("Please accept the Terms & Conditions.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await api.post("/register", formData);
      navigate("/login");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">

        <div className="auth-left">

          <h1>Join ShopZone</h1>

          <p>
            Create your account and enjoy secure shopping,
            exclusive deals, and fast delivery.
          </p>

          <div className="auth-features">
            <div className="auth-feature">
              🛍 Thousands of Products
            </div>

            <div className="auth-feature">
              🚚 Fast & Reliable Delivery
            </div>

            <div className="auth-feature">
              🔒 Secure Checkout
            </div>

            <div className="auth-feature">
              ⭐ Trusted Shopping Experience
            </div>
          </div>

          <img
  src={shoppingImage}
  alt="Shopping"
  className="auth-image"
/>


        </div>

        <div className="auth-right">

          <div className="auth-card">

            <h2>Create Account 🚀</h2>

            <p>
              Register to start shopping with ShopZone.
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

              <label>Full Name</label>

              <input
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                required
              />

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
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword ? (
                    <FaEyeSlash />
                  ) : (
                    <FaEye />
                  )}
                </button>

              </div>
              <div className="strength-container">
  <div
    className="strength-bar"
    style={{
      width: `${strength * 20}%`,
      background:
        strength <= 2
          ? "#ef4444"
          : strength <= 4
          ? "#f59e0b"
          : "#22c55e",
    }}
  ></div>
</div>

<p className="strength-text">
  {strength <= 2
    ? "Weak Password"
    : strength <= 4
    ? "Medium Password"
    : "Strong Password"}
</p>

     <label>Confirm Password</label>

<div className="password-field">
  <input
    type={showPassword ? "text" : "password"}
    name="confirmPassword"
    placeholder="Confirm your password"
    value={formData.confirmPassword}
    onChange={handleChange}
    required
  />

  <button
    type="button"
    className="password-toggle"
    onClick={() => setShowPassword(!showPassword)}
  >
    {showPassword ? <FaEyeSlash /> : <FaEye />}
  </button>
</div>

{formData.confirmPassword && (
  <p
    style={{
      color:
        formData.password === formData.confirmPassword
          ? "#16a34a"
          : "#dc2626",
      fontWeight: 600,
      marginTop: "6px",
    }}
  >
    {formData.password === formData.confirmPassword
      ? "✅ Passwords match"
      : "❌ Passwords do not match"}
  </p>
)}

              <label className="terms-checkbox">
  <input
    type="checkbox"
    checked={acceptedTerms}
    onChange={() =>
      setAcceptedTerms(!acceptedTerms)
    }
  />

  <span>
    I agree to the Terms & Conditions
  </span>
</label>

              <button
                className="auth-btn"
                disabled={loading}
              >
                {loading
                  ? "Creating Account..."
                  : "Create Account"}
              </button>

            </form>

            <div className="auth-footer">

              Already have an account?{" "}

              <Link to="/login">
                Login
              </Link>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default Register;