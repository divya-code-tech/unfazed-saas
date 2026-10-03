import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";

function Profile() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    languages: "",
    specializations: "",
    sessionDuration: 60,
    bufferTime: 0,
    sessionPrice: 0,
    timezone: "Asia/Kolkata",
    slug: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await axiosInstance.get("/therapists/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const therapist = response.data.therapist;

        setForm({
          name: therapist.name || "",
          email: therapist.email || "",
          phone: therapist.phone || "",
          bio: therapist.bio || "",
          languages: (therapist.languages || []).join(", "),
          specializations: (therapist.specializations || []).join(", "),
          sessionDuration: therapist.sessionDuration ?? 60,
          bufferTime: therapist.bufferTime ?? 0,
          sessionPrice: therapist.sessionPrice ?? 0,
          timezone: therapist.timezone || "Asia/Kolkata",
          slug: therapist.slug || "",
        });
      } catch (requestError) {
        console.error("Failed to load therapist profile:", requestError);

        setError(
          requestError.response?.data?.message ||
            "Unable to load your profile."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const token = localStorage.getItem("token");

      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        bio: form.bio.trim(),
        languages: form.languages
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        specializations: form.specializations
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        sessionDuration: Number(form.sessionDuration),
        bufferTime: Number(form.bufferTime),
        sessionPrice: Number(form.sessionPrice),
        timezone: form.timezone.trim(),
        slug: form.slug.trim(),
      };

      const response = await axiosInstance.patch(
        "/therapists/me",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const therapist = response.data.therapist;

      setForm((previous) => ({
        ...previous,
        name: therapist.name || "",
        phone: therapist.phone || "",
        bio: therapist.bio || "",
        languages: (therapist.languages || []).join(", "),
        specializations: (therapist.specializations || []).join(", "),
        sessionDuration: therapist.sessionDuration ?? 60,
        bufferTime: therapist.bufferTime ?? 0,
        sessionPrice: therapist.sessionPrice ?? 0,
        timezone: therapist.timezone || "Asia/Kolkata",
        slug: therapist.slug || "",
      }));

      setMessage("Profile updated successfully.");
    } catch (requestError) {
      console.error("Failed to update therapist profile:", requestError);

      setError(
        requestError.response?.data?.message ||
          "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="uf-surface uf-profile-editor">
        <p>Loading profile...</p>
      </section>
    );
  }

  return (
  <section className="uf-page uf-profile-page">
    <header className="uf-profile-header">
      <div className="uf-profile-header-copy">
        <span className="uf-eyebrow">Therapist profile</span>

        <h1>Profile settings</h1>

        <p>
          Manage the information clients see and configure how your
          sessions are presented.
        </p>
      </div>

      <div className="uf-profile-identity">
        <div className="uf-profile-identity-avatar">
          {form.name?.charAt(0)?.toUpperCase() || "T"}
        </div>

        <div className="uf-profile-identity-copy">
          <strong>{form.name || "Your profile"}</strong>
          <span>Professional profile</span>
        </div>
      </div>
    </header>

    <form onSubmit={handleSubmit} className="uf-profile-workspace">

      <div className="uf-profile-content">

        {/* =========================
            BASIC INFORMATION
            ========================= */}

        <section className="uf-surface uf-profile-card">

          <div className="uf-profile-card-header">
            <div>
              <span className="uf-profile-card-kicker">
                Personal details
              </span>

              <h2>Basic information</h2>

              <p>
                Keep the information clients use to understand who you are.
              </p>
            </div>

            <span className="uf-profile-card-index">01</span>
          </div>

          <div className="uf-profile-fields">

            <div className="uf-profile-field">
              <label className="uf-label" htmlFor="name">
                Full name
              </label>

              <input
                className="uf-input"
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
              />
            </div>

            <div className="uf-profile-field">
              <label className="uf-label" htmlFor="email">
                Professional email
              </label>

              <input
                className="uf-input"
                id="email"
                value={form.email}
                disabled
              />
            </div>

            <div className="uf-profile-field">
              <label className="uf-label" htmlFor="phone">
                Phone
              </label>

              <input
                className="uf-input"
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
              />
            </div>

            <div className="uf-profile-field">
              <label className="uf-label" htmlFor="timezone">
                Timezone
              </label>

              <input
                className="uf-input"
                id="timezone"
                name="timezone"
                value={form.timezone}
                onChange={handleChange}
              />
            </div>

            <div className="uf-profile-field uf-profile-field-wide">
              <label className="uf-label" htmlFor="bio">
                About you
              </label>

              <textarea
                className="uf-textarea"
                id="bio"
                name="bio"
                rows="5"
                value={form.bio}
                onChange={handleChange}
                placeholder="Tell clients about your approach and the support you provide."
              />

              <span className="uf-profile-helper">
                A short introduction helps clients understand your approach
                before booking a session.
              </span>
            </div>

            <div className="uf-profile-field">
              <label className="uf-label" htmlFor="languages">
                Languages
              </label>

              <input
                className="uf-input"
                id="languages"
                name="languages"
                value={form.languages}
                onChange={handleChange}
                placeholder="English, Tamil"
              />
            </div>

            <div className="uf-profile-field">
              <label className="uf-label" htmlFor="specializations">
                Areas of focus
              </label>

              <input
                className="uf-input"
                id="specializations"
                name="specializations"
                value={form.specializations}
                onChange={handleChange}
                placeholder="Anxiety, Stress Management"
              />
            </div>

          </div>
        </section>


        {/* =========================
            SESSION SETTINGS
            ========================= */}

        <section className="uf-surface uf-profile-card">

          <div className="uf-profile-card-header">
            <div>
              <span className="uf-profile-card-kicker">
                Practice preferences
              </span>

              <h2>Session settings</h2>

              <p>
                Configure the structure and pricing used for your sessions.
              </p>
            </div>

            <span className="uf-profile-card-index">02</span>
          </div>

          <div className="uf-profile-settings">

            <div className="uf-profile-setting">
              <div className="uf-profile-setting-icon">
                ◷
              </div>

              <div className="uf-profile-setting-body">
                <span className="uf-profile-setting-label">
                  Session duration
                </span>

                <select
                  className="uf-input"
                  id="sessionDuration"
                  name="sessionDuration"
                  value={form.sessionDuration}
                  onChange={handleChange}
                >
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                </select>
              </div>
            </div>

            <div className="uf-profile-setting">
              <div className="uf-profile-setting-icon">
                +
              </div>

              <div className="uf-profile-setting-body">
                <span className="uf-profile-setting-label">
                  Buffer time
                </span>

                <input
                  className="uf-input"
                  id="bufferTime"
                  name="bufferTime"
                  type="number"
                  min="0"
                  value={form.bufferTime}
                  onChange={handleChange}
                />

                <span className="uf-profile-setting-hint">
                  Minutes between sessions
                </span>
              </div>
            </div>

            <div className="uf-profile-setting">
              <div className="uf-profile-setting-icon">
                ₹
              </div>

              <div className="uf-profile-setting-body">
                <span className="uf-profile-setting-label">
                  Session fee
                </span>

                <input
                  className="uf-input"
                  id="sessionPrice"
                  name="sessionPrice"
                  type="number"
                  min="0"
                  value={form.sessionPrice}
                  onChange={handleChange}
                />

                <span className="uf-profile-setting-hint">
                  Standard fee per session
                </span>
              </div>
            </div>

          </div>
        </section>


        {/* =========================
            PUBLIC PROFILE
            ========================= */}

        <section className="uf-surface uf-profile-card">

          <div className="uf-profile-card-header">
            <div>
              <span className="uf-profile-card-kicker">
                Client-facing details
              </span>

              <h2>Public profile</h2>

              <p>
                Choose the address clients can use to view your profile.
              </p>
            </div>

            <span className="uf-profile-card-index">03</span>
          </div>

          <div className="uf-profile-public-box">

            <div className="uf-profile-public-icon">
              ↗
            </div>

            <div className="uf-profile-public-content">

              <div className="uf-profile-public-heading">
                <div>
                  <strong>Your profile link</strong>

                  <span>
                    This is the public address clients can use.
                  </span>
                </div>
              </div>

              <label className="uf-label" htmlFor="slug">
                Profile slug
              </label>

              <input
                className="uf-input"
                id="slug"
                name="slug"
                value={form.slug}
                onChange={handleChange}
              />

              <div className="uf-profile-url">
                unfazed.in/
                <strong>{form.slug || "your-profile"}</strong>
              </div>

            </div>

          </div>
        </section>

      </div>


      {/* =========================
          PROFILE SIDEBAR
          ========================= */}

      <aside className="uf-profile-sidebar">

        <section className="uf-surface uf-profile-overview">

          <span className="uf-profile-overview-label">
            Profile overview
          </span>

          <div className="uf-profile-overview-avatar">
            {form.name?.charAt(0)?.toUpperCase() || "T"}
          </div>

          <h2>
            {form.name || "Your profile"}
          </h2>

          <p>
            {form.specializations || "Add your areas of focus"}
          </p>

          <div className="uf-profile-overview-divider" />

          <div className="uf-profile-overview-stat">
            <span>Email</span>
            <strong>{form.email || "Not available"}</strong>
          </div>

          <div className="uf-profile-overview-stat">
            <span>Duration</span>
            <strong>{form.sessionDuration} min</strong>
          </div>

          <div className="uf-profile-overview-stat">
            <span>Session fee</span>
            <strong>
              ₹
              {Number(form.sessionPrice || 0).toLocaleString("en-IN")}
            </strong>
          </div>

        </section>


        <section className="uf-profile-save">

          <div className="uf-profile-save-icon">
            ✓
          </div>

          <div className="uf-profile-save-content">
            <span>Profile changes</span>

            <h3>Ready to save?</h3>

            <p>
              Update your profile when you're happy with the changes.
            </p>
          </div>

          <button
            type="submit"
            className="uf-button uf-button-primary"
            disabled={saving}
          >
            {saving ? "Saving changes..." : "Save profile"}
          </button>

        </section>


        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        {message && (
          <div className="auth-success" role="status">
            {message}
          </div>
        )}

      </aside>

    </form>
  </section>
);
}

export default Profile;