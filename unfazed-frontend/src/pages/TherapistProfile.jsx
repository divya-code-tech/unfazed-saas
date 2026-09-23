import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

import Hero from "../components/profile/Hero";
import About from "../components/profile/About";
import ServiceCard from "../components/profile/ServiceCard";

function TherapistProfile() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [therapist, setTherapist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
  if (!therapist) {
    return;
  }

  const profileTitle = `${therapist.name} | Unfazed`;

  document.title = profileTitle;

  const metaTags = {
    description:
      therapist.bio ||
      `View ${therapist.name}'s therapist profile, services, and booking information on Unfazed.`,

    "og:title": profileTitle,
    "og:description":
      therapist.bio ||
      `View ${therapist.name}'s therapist profile, services, and booking information on Unfazed.`,
    "og:type": "profile",
    "og:url": window.location.href,
    "og:image": therapist.avatar || `${window.location.origin}/unfazed-og.png`,
  };

  Object.entries(metaTags).forEach(([name, content]) => {
    const selector = name.startsWith("og:")
      ? `meta[property="${name}"]`
      : `meta[name="${name}"]`;

    let meta = document.head.querySelector(selector);

    if (!meta) {
      meta = document.createElement("meta");

      if (name.startsWith("og:")) {
        meta.setAttribute("property", name);
      } else {
        meta.setAttribute("name", name);
      }

      document.head.appendChild(meta);
    }

    meta.setAttribute("content", content);
  });
}, [therapist]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axiosInstance.get(
          `/therapists/${slug}`
        );

        setTherapist(response.data.therapist);
      } catch (requestError) {
        console.error(
          "Failed to load therapist profile:",
          requestError
        );

        setError(
          requestError.response?.data?.message ||
            "This therapist profile could not be found."
        );
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadProfile();
    }
  }, [slug]);

  if (loading) {
    return (
      <main className="uf-public-profile-page">
        <div className="uf-public-profile-state">
          Loading therapist profile...
        </div>
      </main>
    );
  }

  if (error || !therapist) {
    return (
      <main className="uf-public-profile-page">
        <div className="uf-public-profile-state uf-public-profile-error">
          <span className="uf-eyebrow">Profile unavailable</span>

          <h1>Therapist profile not found</h1>

          <p>
            {error ||
              "The profile you're looking for is unavailable."}
          </p>

          <button
            type="button"
            className="uf-button uf-button-primary"
            onClick={() => navigate("/")}
          >
            Return to Unfazed
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="uf-public-profile-page">
      <header className="uf-public-profile-nav">
        <a href="/" className="uf-public-profile-brand">
          <span className="uf-brand-mark">U</span>

          <span>
            <strong>Unfazed</strong>
            <small>Therapist booking</small>
          </span>
        </a>
      </header>

      <div className="uf-public-profile-container">
        <Hero therapist={therapist} />

        <About therapist={therapist} />

        <section
          id="services"
          className="uf-profile-services"
        >
          <div className="uf-profile-section-heading">
            <span className="uf-eyebrow">Services</span>
            <h2>Available session</h2>
            <p>
              Review the session details and continue to
              booking.
            </p>
          </div>

          <ServiceCard
            title="Individual therapy session"
            description="A scheduled one-to-one therapy session with this therapist."
            duration={therapist.sessionDuration}
            price={therapist.sessionPrice}
          />
        </section>
      </div>
    </main>
  );
}

export default TherapistProfile;
