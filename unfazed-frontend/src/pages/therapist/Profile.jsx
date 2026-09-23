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
    <section className="uf-profile-editor">
      <div className="uf-profile-editor-header">
        <div>
          <span className="uf-eyebrow">Therapist profile</span>
          <h1>Profile settings</h1>
          <p>
            Manage the information clients see on your public profile and
            configure your session details.
          </p>
        </div>
      </div>

      <form
        className="uf-surface uf-profile-form"
        onSubmit={handleSubmit}
      >
        <div className="uf-profile-form-section">
          <div>
            <h2>Basic information</h2>
            <p>
              This information is used across your therapist profile.
            </p>
          </div>

          <div className="uf-profile-form-grid">
            <div>
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

            <div>
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

            <div>
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

            <div>
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

            <div className="uf-profile-form-full">
              <label className="uf-label" htmlFor="bio">
                About
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
            </div>

            <div>
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

            <div>
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
        </div>

        <hr className="uf-divider" />

        <div className="uf-profile-form-section">
          <div>
            <h2>Session settings</h2>
            <p>
              These settings are used when presenting your available service.
            </p>
          </div>

          <div className="uf-profile-form-grid">
            <div>
              <label className="uf-label" htmlFor="sessionDuration">
                Session duration
              </label>
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

            <div>
              <label className="uf-label" htmlFor="bufferTime">
                Buffer time
              </label>
              <input
                className="uf-input"
                id="bufferTime"
                name="bufferTime"
                type="number"
                min="0"
                value={form.bufferTime}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="uf-label" htmlFor="sessionPrice">
                Session fee (₹)
              </label>
              <input
                className="uf-input"
                id="sessionPrice"
                name="sessionPrice"
                type="number"
                min="0"
                value={form.sessionPrice}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <hr className="uf-divider" />

        <div className="uf-profile-form-section">
          <div>
            <h2>Public profile link</h2>
            <p>
              This is the link clients can use to view your profile.
            </p>
          </div>

          <div>
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

            <p className="uf-profile-slug-preview">
              unfazed.in/{form.slug || "your-profile"}
            </p>
          </div>
        </div>

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

        <div className="uf-profile-form-actions">
          <button
            type="submit"
            className="uf-button uf-button-primary"
            disabled={saving}
          >
            {saving ? "Saving changes..." : "Save profile"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default Profile;