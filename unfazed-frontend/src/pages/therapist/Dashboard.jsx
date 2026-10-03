import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";

function Dashboard() {
  const [clientCount, setClientCount] = useState(0);
  const [todaySessions, setTodaySessions] = useState([]);
  const [pendingPaymentCount, setPendingPaymentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");

        const [
          clientsResponse,
          sessionsResponse,
          paymentsResponse,
        ] = await Promise.all([
          axiosInstance.get("/clients", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          axiosInstance.get("/sessions", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          axiosInstance.get("/payments", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        setClientCount(clientsResponse.data.count || 0);

        const payments = paymentsResponse.data.payments || [];

        const pendingPayments = payments.filter((payment) =>
          ["created", "pending"].includes(payment.status)
        );

        setPendingPaymentCount(pendingPayments.length);

        const sessions = sessionsResponse.data.sessions || [];

        const today = new Date();

        const sessionsToday = sessions.filter((session) => {
          const sessionDate = new Date(session.startTime);

          return (
            sessionDate.getFullYear() === today.getFullYear() &&
            sessionDate.getMonth() === today.getMonth() &&
            sessionDate.getDate() === today.getDate() &&
            !["cancelled", "no_show", "rescheduled"].includes(
              session.status
            )
          );
        });

        setTodaySessions(sessionsToday);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const formatTime = (value) =>
    new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <main className="uf-dashboard">
      {/* =====================================================
          WELCOME HERO
          ===================================================== */}

      <section className="uf-dashboard-hero">
        <div className="uf-dashboard-hero-copy">
          <p className="uf-eyebrow">Therapist workspace</p>

          <h1>Good to see you.</h1>

          <p className="uf-dashboard-hero-description">
            Here&apos;s what&apos;s happening across your practice today.
          </p>
        </div>

        <div className="uf-dashboard-hero-mark" aria-hidden="true">
          <span>U</span>
        </div>
      </section>

      {/* =====================================================
          OVERVIEW STATS
          ===================================================== */}

      <section className="uf-dashboard-stats">
        <article className="uf-dashboard-stat-card">
          <div className="uf-dashboard-stat-top">
            <span className="uf-dashboard-stat-label">
              Today&apos;s sessions
            </span>

            <span className="uf-dashboard-stat-icon uf-stat-icon-rose">
              S
            </span>
          </div>

          <div className="uf-dashboard-stat-value">
            {loading ? "—" : todaySessions.length}
          </div>

          <p className="uf-dashboard-stat-meta">
            Sessions on today&apos;s schedule
          </p>
        </article>

        <article className="uf-dashboard-stat-card">
          <div className="uf-dashboard-stat-top">
            <span className="uf-dashboard-stat-label">
              Active clients
            </span>

            <span className="uf-dashboard-stat-icon uf-stat-icon-cream">
              C
            </span>
          </div>

          <div className="uf-dashboard-stat-value">
            {loading ? "—" : clientCount}
          </div>

          <p className="uf-dashboard-stat-meta">
            Clients currently in your practice
          </p>
        </article>

        <article className="uf-dashboard-stat-card">
          <div className="uf-dashboard-stat-top">
            <span className="uf-dashboard-stat-label">
              Pending payments
            </span>

            <span className="uf-dashboard-stat-icon uf-stat-icon-pink">
              ₹
            </span>
          </div>

          <div className="uf-dashboard-stat-value">
            {loading ? "—" : pendingPaymentCount}
          </div>

          <p className="uf-dashboard-stat-meta">
            Payments that need attention
          </p>
        </article>

        <article className="uf-dashboard-stat-card">
          <div className="uf-dashboard-stat-top">
            <span className="uf-dashboard-stat-label">
              New leads
            </span>

            <span className="uf-dashboard-stat-icon uf-stat-icon-sage">
              N
            </span>
          </div>

          <div className="uf-dashboard-stat-value">0</div>

          <p className="uf-dashboard-stat-meta">
            New enquiries received today
          </p>
        </article>
      </section>

      {/* =====================================================
          MAIN DASHBOARD GRID
          ===================================================== */}

      <section className="uf-dashboard-grid">
        {/* Today's practice */}

        <article className="uf-dashboard-panel uf-dashboard-schedule-panel">
          <div className="uf-dashboard-panel-header">
            <div>
              <p className="uf-eyebrow">Schedule</p>
              <h2>Today&apos;s practice</h2>
            </div>

            <span className="uf-dashboard-panel-count">
              {loading ? "—" : `${todaySessions.length} sessions`}
            </span>
          </div>

          {loading ? (
            <div className="uf-dashboard-empty-state">
              <div className="uf-dashboard-empty-icon">...</div>

              <div>
                <h3>Loading today&apos;s schedule</h3>
                <p>
                  Your upcoming sessions will appear here shortly.
                </p>
              </div>
            </div>
          ) : todaySessions.length === 0 ? (
            <div className="uf-dashboard-empty-state">
              <div className="uf-dashboard-empty-icon">+</div>

              <div>
                <h3>No sessions scheduled</h3>
                <p>
                  Your calendar is clear for today.
                </p>
              </div>
            </div>
          ) : (
            <div className="uf-dashboard-session-list">
              {todaySessions.map((session) => (
                <article
                  className="uf-dashboard-session"
                  key={session._id}
                >
                  <div className="uf-dashboard-session-time">
                    <strong>{formatTime(session.startTime)}</strong>
                    <span>{formatTime(session.endTime)}</span>
                  </div>

                  <div className="uf-dashboard-session-line" />

                  <div className="uf-dashboard-session-content">
                    <h3>
                      {session.client?.name || "Client"}
                    </h3>

                    <p>
                      {session.sessionType || "Therapy session"}
                    </p>
                  </div>

                  <span className="uf-dashboard-session-status">
                    Scheduled
                  </span>
                </article>
              ))}
            </div>
          )}
        </article>

        {/* Practice pulse */}

        <article className="uf-dashboard-panel uf-dashboard-pulse-panel">
          <div className="uf-dashboard-panel-header">
            <div>
              <p className="uf-eyebrow">Practice overview</p>
              <h2>Practice Pulse</h2>
            </div>

            <span className="uf-dashboard-pulse-mark">
              U
            </span>
          </div>

          <div className="uf-dashboard-pulse-content">
            <div className="uf-dashboard-pulse-visual">
              <div className="uf-pulse-orbit uf-pulse-orbit-one" />
              <div className="uf-pulse-orbit uf-pulse-orbit-two" />
              <div className="uf-pulse-core">U</div>
            </div>

            <div className="uf-dashboard-pulse-copy">
              <h3>Your practice is taking shape.</h3>

              <p>
                Your practice insights will appear here as
                activity builds up.
              </p>
            </div>
          </div>

          <div className="uf-dashboard-pulse-footer">
            <div>
              <span>Clients</span>
              <strong>{loading ? "—" : clientCount}</strong>
            </div>

            <div>
              <span>Today</span>
              <strong>
                {loading ? "—" : todaySessions.length}
              </strong>
            </div>

            <div>
              <span>Payments</span>
              <strong>
                {loading ? "—" : pendingPaymentCount}
              </strong>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}

export default Dashboard;