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
      <main>
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
      <main>
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
      <main>
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
    <main>
      <header>
        <p>ANALYTICS</p>

        <h1>Practice Analytics</h1>

        <p>
          A monthly view of your practice performance.
        </p>
      </header>

      <section>
        <article>
          <p>Revenue this month</p>

          <h2>
            ₹
            {Number(
              analytics?.revenue || 0
            ).toLocaleString("en-IN")}
          </h2>
        </article>

        <article>
          <p>Active clients</p>

          <h2>
            {analytics?.activeClients || 0}
          </h2>
        </article>

        <article>
          <p>No-show rate</p>

          <h2>
            {analytics?.noShowRate || 0}%
          </h2>
        </article>

        <article>
          <p>Total sessions</p>

          <h2>
            {analytics?.totalSessions || 0}
          </h2>
        </article>
      </section>

      <section>
        <h2>Revenue trend</h2>

        {revenueTrend.length === 0 ? (
          <p>
            No paid revenue has been recorded for this
            month yet.
          </p>
        ) : (
          <div
            style={{
              width: "100%",
              height: 320,
            }}
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart
                data={revenueTrend}
                margin={{
                  top: 20,
                  right: 20,
                  left: 10,
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
                  strokeWidth={2}
                  dot
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section>
        <h2>Session overview</h2>

        <p>
          Completed and scheduled session activity:
          {" "}
          {analytics?.totalSessions || 0}
        </p>

        <p>
          No-show sessions:
          {" "}
          {analytics?.noShowSessions || 0}
        </p>

        <p>
          No-show rate:
          {" "}
          {analytics?.noShowRate || 0}%
        </p>
      </section>
    </main>
  );
}

export default Analytics;