
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Network,
  Eye,
  EyeOff,
  ArrowRight
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password: password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Invalid email or password.");
        return;
      }

      if (!data.access_token || !data.user) {
        setError("Invalid login response from server.");
        return;
      }

      // Clear previous login information
      localStorage.removeItem("peerrank_user");
      localStorage.removeItem("peerrank_logged_in");
      localStorage.removeItem("peerrank_access_token");

      // Save user information
      localStorage.setItem(
        "peerrank_user",
        JSON.stringify(data.user)
      );

      // Save login status
      localStorage.setItem("peerrank_logged_in", "true");

      // Save JWT access token
      localStorage.setItem(
        "peerrank_access_token",
        data.access_token
      );

      // Navigate to dashboard
      navigate("/dashboard");

    } catch (error) {
      setError(
        "Cannot connect to the server. Please try again."
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleLogin}>
        <Link to="/" className="auth-brand">
          <Network /> PeerRank
        </Link>

        <h1>Welcome back!</h1>

        <p>
          Login to access your PeerRank workspace.
        </p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <label>Email address</label>

        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="password-heading">
          <label>Password</label>

          <Link to="/forgot-password">
            Forgot password?
          </Link>
        </div>

        <div className="password-input">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

        <button
          className="auth-submit"
          type="submit"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
          {!loading && <ArrowRight size={17} />}
        </button>

        <p className="auth-bottom">
          Don't have an account?{" "}
          <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}
