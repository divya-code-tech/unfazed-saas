function ServiceCard({
  title,
  description,
  duration,
  price,
  currency = "₹",
}) {
  return (
    <article className="uf-service-card">
      <div className="uf-service-card-top">
        <div>
          <span className="uf-eyebrow">Service</span>
          <h3>{title}</h3>
        </div>

        <span className="uf-service-duration">
          {duration} min
        </span>
      </div>

      <p className="uf-service-description">
        {description}
      </p>

      <div className="uf-service-card-bottom">
        <div className="uf-service-price">
          <span>Session fee</span>
          <strong>
            {currency}
            {Number(price || 0).toLocaleString("en-IN")}
          </strong>
        </div>

        <button
          type="button"
          className="uf-button uf-button-primary"
        >
          Book session
        </button>
      </div>
    </article>
  );
}

export default ServiceCard;
