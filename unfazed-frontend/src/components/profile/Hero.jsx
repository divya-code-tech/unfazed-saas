function Hero({ therapist }) {
  const therapistName = therapist?.name || "Therapist";

  const initials = therapistName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <section className="uf-profile-hero">
      <div className="uf-profile-hero-main">
        <div className="uf-profile-avatar">
          {therapist?.avatar ? (
            <img
              src={therapist.avatar}
              alt={therapistName}
            />
          ) : (
            initials || "T"
          )}
        </div>

        <div className="uf-profile-hero-copy">
          <span className="uf-eyebrow">
            Therapist profile
          </span>

          <h1>{therapistName}</h1>

          <p className="uf-profile-intro">
            {therapist?.bio ||
              "Professional therapy services, scheduling, and client support through Unfazed."}
          </p>

          {therapist?.languages?.length > 0 && (
            <div className="uf-profile-meta">
              <span>Languages</span>

              <strong>
                {therapist.languages.join(" · ")}
              </strong>
            </div>
          )}
        </div>
      </div>

      <div className="uf-profile-hero-action">
        <a
          href="#services"
          className="uf-button uf-button-primary"
        >
          View services
        </a>
      </div>
    </section>
  );
}

export default Hero;