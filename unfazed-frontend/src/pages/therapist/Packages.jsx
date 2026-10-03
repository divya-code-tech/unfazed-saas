import { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../api/axiosInstance";

const INITIAL_FORM = {
  name: "",
  description: "",
  sessionCount: "3",
  sessionDuration: "60",
  price: "",
  validityDays: "",
  isActive: true,
};

const SESSION_COUNT_OPTIONS = [3, 6, 12];
const SESSION_DURATION_OPTIONS = [30, 45, 60, 90];

function Packages() {
  const [packages, setPackages] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);

  const [editingPackageId, setEditingPackageId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isEditing = Boolean(editingPackageId);

  const perSessionRate = useMemo(() => {
    const price = Number(form.price);
    const sessionCount = Number(form.sessionCount);

    if (
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isFinite(sessionCount) ||
      sessionCount <= 0
    ) {
      return null;
    }

    return price / sessionCount;
  }, [form.price, form.sessionCount]);

  const loadPackages = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axiosInstance.get("/packages");

      setPackages(response.data.packages || []);
    } catch (requestError) {
      console.error("Failed to load packages:", requestError);

      setError(
        requestError.response?.data?.message ||
          "Unable to load packages."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setEditingPackageId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    const sessionCount = Number(form.sessionCount);
    const sessionDuration = Number(form.sessionDuration);
    const price = Number(form.price);
    const validityDays = Number(form.validityDays);

    if (!form.name.trim()) {
      setError("Package name is required.");
      return;
    }

    if (!SESSION_COUNT_OPTIONS.includes(sessionCount)) {
      setError("Package session count must be 3, 6, or 12.");
      return;
    }

    if (!SESSION_DURATION_OPTIONS.includes(sessionDuration)) {
      setError("Please select a valid session duration.");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setError("Package price must be greater than 0.");
      return;
    }

    if (!Number.isInteger(validityDays) || validityDays <= 0) {
      setError("Validity must be a whole number greater than 0.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      sessionCount,
      sessionDuration,
      price,
      currency: "INR",
      validityDays,
      isActive: form.isActive,
    };

    try {
      setSaving(true);

      if (isEditing) {
        const response = await axiosInstance.put(
          `/packages/${editingPackageId}`,
          payload
        );

        setMessage(
          response.data.message ||
            "Package updated successfully."
        );
      } else {
        const response = await axiosInstance.post(
          "/packages",
          payload
        );

        setMessage(
          response.data.message ||
            "Package created successfully."
        );
      }

      resetForm();
      await loadPackages();
    } catch (requestError) {
      console.error("Failed to save package:", requestError);

      setError(
        requestError.response?.data?.message ||
          "Unable to save package."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (packageData) => {
    setMessage("");
    setError("");

    setEditingPackageId(packageData._id);

    setForm({
      name: packageData.name || "",
      description: packageData.description || "",
      sessionCount: String(packageData.sessionCount || 3),
      sessionDuration: String(
        packageData.sessionDuration || 60
      ),
      price:
        packageData.price !== undefined
          ? String(packageData.price)
          : "",
      validityDays:
        packageData.validityDays !== undefined
          ? String(packageData.validityDays)
          : "",
      isActive: packageData.isActive !== false,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (packageData) => {
    const confirmed = window.confirm(
      `Delete the package "${packageData.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");
      setError("");

      await axiosInstance.delete(
        `/packages/${packageData._id}`
      );

      if (editingPackageId === packageData._id) {
        resetForm();
      }

      setMessage("Package deleted successfully.");

      await loadPackages();
    } catch (requestError) {
      console.error(
        "Failed to delete package:",
        requestError
      );

      setError(
        requestError.response?.data?.message ||
          "Unable to delete package."
      );
    }
  };

 return (
  <div className="uf-page uf-packages-page">
    <header className="uf-packages-header">
      <div>
        <p className="uf-eyebrow">Payments & packages</p>

        <h1>Session Packages</h1>

        <p className="uf-muted">
          Create and manage flexible session packages for your clients.
        </p>
      </div>

      <div className="uf-packages-header-badge">
        <span>Available options</span>
        <strong>3 · 6 · 12 sessions</strong>
      </div>
    </header>

    {message && (
      <div className="uf-packages-alert uf-packages-alert-success">
        {message}
      </div>
    )}

    {error && (
      <div className="uf-packages-alert uf-packages-alert-error">
        {error}
      </div>
    )}

    <section className="uf-packages-workspace">
      <div className="uf-package-editor uf-surface">
        <div className="uf-packages-section-heading">
          <div>
            <p className="uf-eyebrow">
              {isEditing ? "Update package" : "New package"}
            </p>

            <h2>
              {isEditing
                ? "Edit Package"
                : "Create Package"}
            </h2>

            <p className="uf-muted">
              Configure the sessions, pricing, and validity your clients will receive.
            </p>
          </div>

          {isEditing && (
            <span className="uf-package-edit-badge">
              Editing
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="uf-package-form">
          <div className="uf-package-form-grid">
            <div className="uf-package-form-full">
              <label
                className="uf-label"
                htmlFor="package-name"
              >
                Package Name
              </label>

              <input
                className="uf-input"
                id="package-name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Stress Support Pack"
                maxLength={100}
                required
              />
            </div>

            <div className="uf-package-form-full">
              <label
                className="uf-label"
                htmlFor="package-description"
              >
                Description
              </label>

              <textarea
                className="uf-textarea"
                id="package-description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe what this package includes..."
                maxLength={1000}
                rows="4"
              />
            </div>

            <div>
              <label
                className="uf-label"
                htmlFor="package-session-count"
              >
                Number of Sessions
              </label>

              <select
                className="uf-input"
                id="package-session-count"
                name="sessionCount"
                value={form.sessionCount}
                onChange={handleChange}
              >
                {SESSION_COUNT_OPTIONS.map((count) => (
                  <option key={count} value={count}>
                    {count} sessions
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="uf-label"
                htmlFor="package-session-duration"
              >
                Session Duration
              </label>

              <select
                className="uf-input"
                id="package-session-duration"
                name="sessionDuration"
                value={form.sessionDuration}
                onChange={handleChange}
              >
                {SESSION_DURATION_OPTIONS.map(
                  (duration) => (
                    <option
                      key={duration}
                      value={duration}
                    >
                      {duration} minutes
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label
                className="uf-label"
                htmlFor="package-price"
              >
                Total Package Price (₹)
              </label>

              <input
                className="uf-input"
                id="package-price"
                name="price"
                type="number"
                min="0.01"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                placeholder="Enter package price"
                required
              />

              {perSessionRate !== null && (
                <p className="uf-package-helper">
                  Per-session rate:{" "}
                  <strong>
                    ₹
                    {perSessionRate.toLocaleString(
                      "en-IN",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                  </strong>
                </p>
              )}
            </div>

            <div>
              <label
                className="uf-label"
                htmlFor="package-validity"
              >
                Validity (days)
              </label>

              <input
                className="uf-input"
                id="package-validity"
                name="validityDays"
                type="number"
                min="1"
                step="1"
                value={form.validityDays}
                onChange={handleChange}
                placeholder="e.g. 90"
                required
              />
            </div>

            <div className="uf-package-form-full">
              <label className="uf-package-checkbox">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                />

                <span>
                  <strong>Package is active</strong>
                  <small>
                    Clients can currently use this package.
                  </small>
                </span>
              </label>
            </div>
          </div>

          <div className="uf-package-form-actions">
            <button
              type="submit"
              className="uf-button uf-button-primary"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : isEditing
                ? "Update Package"
                : "Create Package"}
            </button>

            {isEditing && (
              <button
                type="button"
                className="uf-button uf-button-secondary"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      <aside className="uf-package-guidance">
        <div className="uf-package-guidance-card">
          <span className="uf-package-guidance-icon">✦</span>

          <p className="uf-eyebrow">Package setup</p>

          <h3>Build a clear offer for clients</h3>

          <p>
            Combine a session count, duration, package price,
            and validity period into one easy-to-understand option.
          </p>

          <div className="uf-package-guidance-items">
            <div>
              <strong>3 / 6 / 12</strong>
              <span>Session options</span>
            </div>

            <div>
              <strong>30–90 min</strong>
              <span>Session duration</span>
            </div>

            <div>
              <strong>Flexible</strong>
              <span>Validity period</span>
            </div>
          </div>
        </div>
      </aside>
    </section>

    <section className="uf-packages-library">
      <div className="uf-packages-section-heading">
        <div>
          <p className="uf-eyebrow">Package library</p>

          <h2>Your Packages</h2>

          <p className="uf-muted">
            Review, edit, and manage the packages currently available in your practice.
          </p>
        </div>

        <span className="uf-packages-count">
          {packages.length}{" "}
          {packages.length === 1 ? "package" : "packages"}
        </span>
      </div>

      {loading ? (
        <div className="uf-package-empty">
          <h3>Loading packages...</h3>
          <p>Please wait while your package library loads.</p>
        </div>
      ) : packages.length === 0 ? (
        <div className="uf-package-empty">
          <div className="uf-package-empty-icon">＋</div>

          <h3>No packages created yet</h3>

          <p>
            Create your first session package above to make
            packaged sessions available to your clients.
          </p>
        </div>
      ) : (
        <div className="uf-package-grid">
          {packages.map((packageData) => {
            const packagePerSessionRate =
              Number(packageData.price) /
              Number(packageData.sessionCount);

            return (
              <article
                key={packageData._id}
                className="uf-package-card"
              >
                <div className="uf-package-card-top">
                  <div>
                    <span className="uf-package-session-badge">
                      {packageData.sessionCount} sessions
                    </span>

                    <h3>{packageData.name}</h3>
                  </div>

                  <span
                    className={`uf-package-status ${
                      packageData.isActive
                        ? "active"
                        : "inactive"
                    }`}
                  >
                    {packageData.isActive
                      ? "Active"
                      : "Inactive"}
                  </span>
                </div>

                {packageData.description && (
                  <p className="uf-package-description">
                    {packageData.description}
                  </p>
                )}

                <div className="uf-package-price">
                  <span>Total package price</span>

                  <strong>
                    ₹
                    {Number(
                      packageData.price
                    ).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                </div>

                <div className="uf-package-details">
                  <div>
                    <span>Per-session rate</span>
                    <strong>
                      ₹
                      {packagePerSessionRate.toLocaleString(
                        "en-IN",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Duration</span>
                    <strong>
                      {packageData.sessionDuration} min
                    </strong>
                  </div>

                  <div>
                    <span>Validity</span>
                    <strong>
                      {packageData.validityDays} days
                    </strong>
                  </div>
                </div>

                <div className="uf-package-card-actions">
                  <button
                    type="button"
                    className="uf-button uf-button-secondary"
                    onClick={() =>
                      handleEdit(packageData)
                    }
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="uf-package-button-delete"
                    onClick={() =>
                      handleDelete(packageData)
                    }
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  </div>
);
}

export default Packages;