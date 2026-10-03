import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";

function Subscription() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSubscription = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axiosInstance.get(
          "/subscription/me"
        );

        setSubscription(response.data.subscription);
      } catch (requestError) {
        console.error(
          "Failed to load subscription:",
          requestError
        );

        setError(
          requestError.response?.data?.message ||
            "Unable to load subscription details."
        );
      } finally {
        setLoading(false);
      }
    };

    loadSubscription();
  }, []);

  if (loading) {
    return (
      <main className="uf-subscription-page">
        <header className="uf-page-header">
          <div>
            <span className="uf-eyebrow">Subscription</span>
            <h1>Your plan</h1>
            <p>
              View your current plan and available subscription
              options.
            </p>
          </div>
        </header>

        <section className="uf-subscription-loading">
          <div className="uf-loading-pulse" />
          <div className="uf-loading-lines">
            <span />
            <span />
            <span />
          </div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="uf-subscription-page">
        <header className="uf-page-header">
          <div>
            <span className="uf-eyebrow">Subscription</span>
            <h1>Your plan</h1>
          </div>
        </header>

        <section className="uf-subscription-error">
          <strong>We couldn't load your subscription</strong>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  const currentPlan = subscription?.currentPlan;
  const availablePlans = subscription?.availablePlans || [];

  const featureItems = [
    {
      key: "analyticsEnabled",
      label: "Practice analytics",
    },
    {
      key: "chatEnabled",
      label: "Client chat",
    },
    {
      key: "customBrandingEnabled",
      label: "Custom branding",
    },
  ];

  return (
    <main className="uf-subscription-page">
      <header className="uf-page-header">
        <div>
          <span className="uf-eyebrow">Subscription</span>
          <h1>Choose the plan that fits your practice</h1>
          <p>
            Review your current subscription and compare the
            capabilities available across plans.
          </p>
        </div>

        <div className="uf-subscription-current-badge">
          <span>Current plan</span>
          <strong>{currentPlan?.displayName}</strong>
        </div>
      </header>

      <section className="uf-subscription-current">
        <div className="uf-subscription-current-copy">
          <span className="uf-section-kicker">
            Your current subscription
          </span>

          <h2>{currentPlan?.displayName}</h2>

          <p>
            Your practice is currently using the{" "}
            {currentPlan?.displayName} plan.
          </p>
        </div>

        <div className="uf-subscription-stats">
          <div className="uf-subscription-stat">
            <strong>{currentPlan?.maxClients}</strong>
            <span>Active clients</span>
          </div>

          <div className="uf-subscription-stat">
            <strong>
              {currentPlan?.maxSessionsPerMonth}
            </strong>
            <span>Sessions / month</span>
          </div>

          <div className="uf-subscription-stat">
            <strong>{currentPlan?.maxPackages}</strong>
            <span>Packages</span>
          </div>
        </div>
      </section>

      <section className="uf-subscription-plans">
        <div className="uf-subscription-section-heading">
          <div>
            <span className="uf-section-kicker">
              Available plans
            </span>
            <h2>Plan comparison</h2>
          </div>

          <p>
            Plan limits and features are managed by your
            practice subscription configuration.
          </p>
        </div>

        <div className="uf-subscription-grid">
          {availablePlans.map((plan) => {
            const isCurrent =
              plan.tier === subscription?.currentTier;

            return (
              <article
                key={plan.tier}
                className={`uf-subscription-card ${
                  isCurrent ? "current" : ""
                }`}
              >
                <div className="uf-subscription-card-top">
                  <div>
                    <span className="uf-subscription-plan-label">
                      {plan.tier}
                    </span>

                    <h3>{plan.displayName}</h3>
                  </div>

                  {isCurrent && (
                    <span className="uf-subscription-current-pill">
                      Current
                    </span>
                  )}
                </div>

                <div className="uf-subscription-limits">
                  <div>
                    <span>Clients</span>
                    <strong>{plan.maxClients}</strong>
                  </div>

                  <div>
                    <span>Sessions / month</span>
                    <strong>
                      {plan.maxSessionsPerMonth}
                    </strong>
                  </div>

                  <div>
                    <span>Packages</span>
                    <strong>{plan.maxPackages}</strong>
                  </div>
                </div>

                <div className="uf-subscription-features">
                  {featureItems.map((feature) => (
                    <div
                      className="uf-subscription-feature"
                      key={feature.key}
                    >
                      <span
                        className={
                          plan[feature.key]
                            ? "enabled"
                            : "disabled"
                        }
                      >
                        {plan[feature.key] ? "✓" : "—"}
                      </span>

                      <span>{feature.label}</span>
                    </div>
                  ))}
                </div>

                {isCurrent ? (
                  <div className="uf-subscription-card-footer">
                    <span>
                      This is your active subscription.
                    </span>
                  </div>
                ) : (
                  <div className="uf-subscription-card-footer">
                    <span>
                      Contact the administrator to change
                      your subscription plan.
                    </span>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default Subscription;