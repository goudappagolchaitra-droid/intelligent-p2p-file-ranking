
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Network, Eye, EyeOff } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister(e) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password: password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Registration failed.");
        return;
      }

      // Remove old local-only account data
      localStorage.removeItem("peerrank_user");
      localStorage.removeItem("peerrank_logged_in");
      localStorage.removeItem("peerrank_access_token");

      alert("Account created successfully! Please login.");

      navigate("/login");

    } catch (error) {
      setError("Cannot connect to the server. Please try again.");
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleRegister}>
        <Link to="/" className="auth-brand">
          <Network /> PeerRank
        </Link>

        <h1>Create account</h1>
        <p>Join the PeerRank network.</p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <label>Full name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          required
        />

        <label>Email address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />

        <label>Password</label>
        <div className="password-input">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            required
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={
              showPassword ? "Hide password" : "Show password"
            }
          >
            {showPassword ? <EyeOff /> : <Eye />}
          </button>
        </div>

        <label>Confirm password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter password"
          required
        />

        <button className="auth-submit" type="submit">
          Create Account
        </button>

        <p className="auth-bottom">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
