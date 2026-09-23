function About({ therapist }) {
  const specializations = therapist?.specializations || [];

  return (
    <section className="uf-profile-about">
      <div className="uf-profile-section-heading">
        <span className="uf-eyebrow">About</span>
        <h2>About the therapist</h2>
      </div>

      <div className="uf-profile-about-content">
        <div className="uf-profile-bio">
          <p>
            {therapist?.bio ||
              "This therapist has not added a profile description yet."}
          </p>
        </div>

        <div className="uf-profile-specializations">
          <h3>Areas of focus</h3>

          {specializations.length > 0 ? (
            <div className="uf-specialization-list">
              {specializations.map((specialization) => (
                <span
                  className="uf-specialization-tag"
                  key={specialization}
                >
                  {specialization}
                </span>
              ))}
            </div>
          ) : (
            <p className="uf-profile-empty">
              Specializations will appear here once added.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default About;
