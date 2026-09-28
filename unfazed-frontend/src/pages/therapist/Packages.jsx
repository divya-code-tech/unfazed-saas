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
    <div>
      <header>
        <p>PAYMENTS & PACKAGES</p>

        <h1>Session Packages</h1>

        <p>
          Create and manage 3, 6, and 12-session packages
          for your clients.
        </p>
      </header>

      <section style={{ marginTop: "30px" }}>
        <h2>
          {isEditing
            ? "Edit Package"
            : "Create Package"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginTop: "15px" }}>
            <label htmlFor="package-name">
              <strong>Package Name</strong>
            </label>
            <br />
            <input
              id="package-name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Stress Support Pack"
              maxLength={100}
              required
              style={{
                marginTop: "6px",
                padding: "8px",
                width: "400px",
                maxWidth: "100%",
              }}
            />
          </div>

          <div style={{ marginTop: "15px" }}>
            <label htmlFor="package-description">
              <strong>Description</strong>
            </label>
            <br />
            <textarea
              id="package-description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe what this package includes..."
              maxLength={1000}
              rows="4"
              style={{
                marginTop: "6px",
                padding: "8px",
                width: "500px",
                maxWidth: "100%",
              }}
            />
          </div>

          <div style={{ marginTop: "15px" }}>
            <label htmlFor="package-session-count">
              <strong>Number of Sessions</strong>
            </label>
            <br />
            <select
              id="package-session-count"
              name="sessionCount"
              value={form.sessionCount}
              onChange={handleChange}
              style={{
                marginTop: "6px",
                padding: "8px",
              }}
            >
              {SESSION_COUNT_OPTIONS.map((count) => (
                <option key={count} value={count}>
                  {count} sessions
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: "15px" }}>
            <label htmlFor="package-session-duration">
              <strong>Session Duration</strong>
            </label>
            <br />
            <select
              id="package-session-duration"
              name="sessionDuration"
              value={form.sessionDuration}
              onChange={handleChange}
              style={{
                marginTop: "6px",
                padding: "8px",
              }}
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

          <div style={{ marginTop: "15px" }}>
            <label htmlFor="package-price">
              <strong>Total Package Price (₹)</strong>
            </label>
            <br />
            <input
              id="package-price"
              name="price"
              type="number"
              min="0.01"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              placeholder="Enter package price"
              required
              style={{
                marginTop: "6px",
                padding: "8px",
                width: "200px",
              }}
            />

            {perSessionRate !== null && (
              <p style={{ marginTop: "8px" }}>
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

          <div style={{ marginTop: "15px" }}>
            <label htmlFor="package-validity">
              <strong>Validity (days)</strong>
            </label>
            <br />
            <input
              id="package-validity"
              name="validityDays"
              type="number"
              min="1"
              step="1"
              value={form.validityDays}
              onChange={handleChange}
              placeholder="e.g. 90"
              required
              style={{
                marginTop: "6px",
                padding: "8px",
                width: "200px",
              }}
            />
          </div>

          <div style={{ marginTop: "15px" }}>
            <label>
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
              />{" "}
              Package is active
            </label>
          </div>

          <div style={{ marginTop: "20px" }}>
            <button
              type="submit"
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
                onClick={resetForm}
                disabled={saving}
                style={{ marginLeft: "10px" }}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>

        {message && (
          <p style={{ marginTop: "15px" }}>
            {message}
          </p>
        )}

        {error && (
          <p style={{ marginTop: "15px" }}>
            {error}
          </p>
        )}
      </section>

      <hr style={{ margin: "35px 0" }} />

      <section>
        <h2>Your Packages</h2>

        {loading ? (
          <p>Loading packages...</p>
        ) : packages.length === 0 ? (
          <p>
            No packages created yet. Create your first
            package above.
          </p>
        ) : (
          <div>
            {packages.map((packageData) => {
              const packagePerSessionRate =
                Number(packageData.price) /
                Number(packageData.sessionCount);

              return (
                <article
                  key={packageData._id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    padding: "18px",
                    marginTop: "15px",
                    maxWidth: "650px",
                  }}
                >
                  <h3>{packageData.name}</h3>

                  {packageData.description && (
                    <p>{packageData.description}</p>
                  )}

                  <p>
                    <strong>Sessions:</strong>{" "}
                    {packageData.sessionCount}
                  </p>

                  <p>
                    <strong>Duration:</strong>{" "}
                    {packageData.sessionDuration} minutes
                  </p>

                  <p>
                    <strong>Total Price:</strong> ₹
                    {Number(
                      packageData.price
                    ).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>

                  <p>
                    <strong>Per-session rate:</strong>{" "}
                    ₹
                    {packagePerSessionRate.toLocaleString(
                      "en-IN",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                  </p>

                  <p>
                    <strong>Validity:</strong>{" "}
                    {packageData.validityDays} days
                  </p>

                  <p>
                    <strong>Status:</strong>{" "}
                    {packageData.isActive
                      ? "Active"
                      : "Inactive"}
                  </p>

                  <div style={{ marginTop: "15px" }}>
                    <button
                      type="button"
                      onClick={() =>
                        handleEdit(packageData)
                      }
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(packageData)
                      }
                      style={{ marginLeft: "10px" }}
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