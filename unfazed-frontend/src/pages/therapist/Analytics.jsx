import { useEffect, useState } from "react";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import axiosInstance from "../../api/axiosInstance";

function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [upgradeRequired, setUpgradeRequired] =
    useState(false);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError("");
        setUpgradeRequired(false);

        const response = await axiosInstance.get(
          "/analytics"
        );

        setAnalytics(response.data.data);
      } catch (requestError) {
        console.error(
          "Failed to load analytics:",
          requestError
        );

        if (
          requestError.response?.status === 403 &&
          requestError.response?.data?.upgradeRequired
        ) {
          setUpgradeRequired(true);
          return;
        }

        setError(
          requestError.response?.data?.message ||
            "Unable to load analytics."
        );
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <main className="uf-analytics-page">
        <header>
          <p>ANALYTICS</p>
          <h1>Practice Analytics</h1>
          <p>Loading your practice insights...</p>
        </header>
      </main>
    );
  }

  if (upgradeRequired) {
    return (
      <main className="uf-analytics-page">
        <header>
          <p>ANALYTICS</p>
          <h1>Practice Analytics</h1>
          <p>
            Analytics is not available on your current
            subscription plan.
          </p>
        </header>

        <section>
          <article>
            <h2>Upgrade required</h2>

            <p>
              Upgrade your plan to access revenue trends,
              active-client insights, and no-show analytics.
            </p>

            <p>
              Contact the administrator to upgrade your subscription plan.
            </p>
          </article>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="uf-analytics-page">
        <header>
          <p>ANALYTICS</p>
          <h1>Practice Analytics</h1>
        </header>

        <section>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  const revenueTrend = analytics?.revenueTrend || [];

 return (
  <main className="uf-analytics-page">
    <div className="uf-analytics-header">
      <div>
        <p className="uf-eyebrow">Practice insights</p>

        <h1>Practice Analytics</h1>

        <p className="uf-muted">
          A clear view of your practice performance and revenue activity.
        </p>
      </div>

      <div className="uf-analytics-period">
        <span>Current period</span>
        <strong>This month</strong>
      </div>
    </div>

    <section className="uf-analytics-kpis">
      <article className="uf-analytics-kpi-card">
        <div className="uf-analytics-kpi-top">
          <span className="uf-analytics-kpi-label">
            Revenue this month
          </span>

          <span className="uf-analytics-kpi-icon">
            ₹
          </span>
        </div>

        <h2>
          ₹
          {Number(
            analytics?.revenue || 0
          ).toLocaleString("en-IN")}
        </h2>

        <p>
          Recorded paid revenue for the current period
        </p>
      </article>

      <article className="uf-analytics-kpi-card">
        <div className="uf-analytics-kpi-top">
          <span className="uf-analytics-kpi-label">
            Active clients
          </span>

          <span className="uf-analytics-kpi-icon">
            C
          </span>
        </div>

        <h2>
          {analytics?.activeClients || 0}
        </h2>

        <p>
          Clients currently active in your practice
        </p>
      </article>

      <article className="uf-analytics-kpi-card">
        <div className="uf-analytics-kpi-top">
          <span className="uf-analytics-kpi-label">
            No-show rate
          </span>

          <span className="uf-analytics-kpi-icon">
            %
          </span>
        </div>

        <h2>
          {analytics?.noShowRate || 0}%
        </h2>

        <p>
          Sessions marked as no-show
        </p>
      </article>

      <article className="uf-analytics-kpi-card">
        <div className="uf-analytics-kpi-top">
          <span className="uf-analytics-kpi-label">
            Total sessions
          </span>

          <span className="uf-analytics-kpi-icon">
            S
          </span>
        </div>

        <h2>
          {analytics?.totalSessions || 0}
        </h2>

        <p>
          Completed and scheduled session activity
        </p>
      </article>
    </section>

    <section className="uf-analytics-chart-card">
      <div className="uf-analytics-section-header">
        <div>
          <p className="uf-eyebrow">Revenue activity</p>

          <h2>Revenue trend</h2>

          <p className="uf-muted">
            Track paid revenue across the available dates.
          </p>
        </div>
      </div>

      {revenueTrend.length === 0 ? (
        <div className="uf-analytics-empty">
          <div className="uf-analytics-empty-icon">
            ₹
          </div>

          <h3>No revenue recorded yet</h3>

          <p>
            Paid revenue will appear here once completed payments
            are recorded.
          </p>
        </div>
      ) : (
        <div className="uf-analytics-chart">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart
              data={revenueTrend}
              margin={{
                top: 20,
                right: 20,
                left: 5,
                bottom: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="date"
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString(
                    "en-IN",
                    {
                      day: "2-digit",
                      month: "short",
                    }
                  )
                }
              />

              <YAxis />

              <Tooltip
                formatter={(value) => [
                  `₹${Number(value).toLocaleString(
                    "en-IN"
                  )}`,
                  "Revenue",
                ]}
                labelFormatter={(label) =>
                  new Date(label).toLocaleDateString(
                    "en-IN",
                    {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    }
                  )
                }
              />

              <Line
                type="monotone"
                dataKey="revenue"
                strokeWidth={3}
                dot
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>

    <section className="uf-analytics-summary-grid">
      <article className="uf-analytics-summary-card">
        <div className="uf-analytics-section-header">
          <div>
            <p className="uf-eyebrow">Session activity</p>
            <h2>Session overview</h2>
          </div>
        </div>

        <div className="uf-analytics-summary-rows">
          <div className="uf-analytics-summary-row">
            <span>Completed and scheduled</span>
            <strong>
              {analytics?.totalSessions || 0}
            </strong>
          </div>

          <div className="uf-analytics-summary-row">
            <span>No-show sessions</span>
            <strong>
              {analytics?.noShowSessions || 0}
            </strong>
          </div>

          <div className="uf-analytics-summary-row">
            <span>No-show rate</span>
            <strong>
              {analytics?.noShowRate || 0}%
            </strong>
          </div>
        </div>
      </article>

      <article className="uf-analytics-summary-card uf-analytics-summary-highlight">
        <div className="uf-analytics-section-header">
          <div>
            <p className="uf-eyebrow">Practice snapshot</p>
            <h2>At a glance</h2>
          </div>
        </div>

        <div className="uf-analytics-mini-metrics">
          <div>
            <span>Active clients</span>
            <strong>
              {analytics?.activeClients || 0}
            </strong>
          </div>

          <div>
            <span>Revenue</span>
            <strong>
              ₹
              {Number(
                analytics?.revenue || 0
              ).toLocaleString("en-IN")}
            </strong>
          </div>
        </div>

        <p>
          Use these metrics together to understand your
          current practice activity.
        </p>
      </article>
    </section>
  </main>
);
}

export default Analytics;