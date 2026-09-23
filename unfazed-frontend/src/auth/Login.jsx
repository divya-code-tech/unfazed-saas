import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [role, setRole] = useState("therapist");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await login(email.trim(), password, role);

      if (role === "therapist") {
        navigate("/therapist/dashboard");
      } else {
        navigate("/client-portal");
      }
    } catch (requestError) {
      console.error("Login error:", requestError);

      setError(
        requestError.response?.data?.message ||
          "Unable to sign in. Please check your details and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-mark">U</span>

          <div>
            <h1>Unfazed</h1>
            <p>Practice with clarity.</p>
          </div>
        </div>

        <div className="auth-heading">
          <h2>Welcome back</h2>
          <p>
            Sign in to continue managing your practice.
          </p>
        </div>

        <div className="role-switcher">
          <button
            type="button"
            className={role === "therapist" ? "active" : ""}
            onClick={() => setRole("therapist")}
          >
            Therapist
          </button>

          <button
            type="button"
            className={role === "client" ? "active" : ""}
            onClick={() => setRole("client")}
          >
            Client
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email address</label>

          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />

          <label htmlFor="password">Password</label>

          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? "Signing in..."
              : `Sign in as ${role === "therapist" ? "Therapist" : "Client"}`}
          </button>
        </form>

        <p className="auth-footer">
          New to Unfazed?{" "}
          <button
            type="button"
            onClick={() => navigate("/register")}
          >
            Create an account
          </button>
        </p>
      </section>
    </main>
  );
}

export default Login;