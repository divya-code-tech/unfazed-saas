import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    languages: "",
    specializations: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError("Name, email and password are required.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),

        languages: form.languages
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),

        specializations: form.specializations
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };

      await axiosInstance.post(
        "/auth/therapist/register",
        payload
      );

      setSuccess(
        "Account created successfully. You can sign in now."
      );

      setForm({
        name: "",
        email: "",
        password: "",
        phone: "",
        languages: "",
        specializations: "",
      });
    } catch (requestError) {
      console.error("Registration error:", requestError);

      setError(
        requestError.response?.data?.message ||
          "Unable to create your account. Please try again."
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
            <p>Therapist workspace</p>
          </div>
        </div>

        <div className="auth-heading">
          <h2>Create your therapist account</h2>

          <p>
            Set up your professional profile and start managing your
            client, scheduling and session workflow.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="name">Full name</label>

          <input
            id="name"
            name="name"
            type="text"
            placeholder="Your full name"
            value={form.name}
            onChange={handleChange}
            autoComplete="name"
          />

          <label htmlFor="email">Professional email</label>

          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
          />

          <label htmlFor="password">Password</label>

          <input
            id="password"
            name="password"
            type="password"
            placeholder="At least 6 characters"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
          />

          <label htmlFor="phone">Phone</label>

          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="Your phone number"
            value={form.phone}
            onChange={handleChange}
            autoComplete="tel"
          />

          <label htmlFor="languages">
            Languages
          </label>

          <input
            id="languages"
            name="languages"
            type="text"
            placeholder="English, Tamil"
            value={form.languages}
            onChange={handleChange}
          />

          <label htmlFor="specializations">
            Areas of focus
          </label>

          <input
            id="specializations"
            name="specializations"
            type="text"
            placeholder="Anxiety, Stress Management"
            value={form.specializations}
            onChange={handleChange}
          />

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="auth-success" role="status">
              {success}
            </div>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? "Creating account..."
              : "Create therapist account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
          >
            Sign in
          </button>
        </p>
      </section>
    </main>
  );
}

export default Register;