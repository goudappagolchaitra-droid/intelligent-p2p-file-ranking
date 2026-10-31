
import { useState } from "react";
import { Link } from "react-router-dom";
import { Network } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setMessage(
      "Password reset is not connected to an email service yet."
    );
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <Link to="/" className="auth-brand">
          <Network/> PeerRank
        </Link>

        <h1>Forgot password?</h1>
        <p>Enter your registered email address.</p>

        <label>Email address</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />

        <button className="auth-submit" type="submit">
          Continue
        </button>

        {message && <p>{message}</p>}

        <p className="auth-bottom">
          <Link to="/login">Back to Login</Link>
        </p>
      </form>
    </div>
  );
}
