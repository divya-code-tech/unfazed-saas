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
        const payments =
          paymentsResponse.data.payments || [];

        const pendingPayments = payments.filter(
          (payment) =>
            ["created", "pending"].includes(payment.status)
         );

    setPendingPaymentCount(
      pendingPayments.length
   );

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

  return (
    <main>
      <header>
        <p>THERAPIST WORKSPACE</p>

        <h1>Good to see you.</h1>

        <p>
          Here's what's happening across your practice today.
        </p>
      </header>

      <section>
        <article>
          <p>Today's sessions</p>
          <h2>{loading ? "—" : todaySessions.length}</h2>
        </article>

        <article>
          <p>Active clients</p>
          <h2>{loading ? "—" : clientCount}</h2>
        </article>

        <article>
          <p>Pending payments</p>
          <h2>
            {loading ? "—" : pendingPaymentCount}
          </h2>
        </article>

        <article>
          <p>New leads</p>
          <h2>0</h2>
        </article>
      </section>

      <section>
        <h2>Today's practice</h2>

        {loading ? (
          <p>Loading today's schedule...</p>
        ) : todaySessions.length === 0 ? (
          <p>No sessions scheduled yet.</p>
        ) : (
          <div>
            {todaySessions.map((session) => (
              <article key={session._id}>
                <h3>{session.client?.name || "Client"}</h3>

                <p>
                  {new Date(session.startTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {" – "}
                  {new Date(session.endTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>

                <p>
                  {session.sessionType || "Therapy session"}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2>Practice Pulse</h2>

        <p>
          Your practice insights will appear here as activity builds up.
        </p>
      </section>
    </main>
  );
}

export default Dashboard;