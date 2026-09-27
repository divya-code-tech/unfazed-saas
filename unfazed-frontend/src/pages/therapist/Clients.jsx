import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";

function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("");
  const [sortField, setSortField] = useState("lastSession");
  const [sortDirection, setSortDirection] = useState("desc");


  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axiosInstance.get("/clients");

        setClients(response.data.clients || []);
      } catch (err) {
        console.error("Failed to load clients:", err);

        setError(
          err.response?.data?.message ||
            "Failed to load clients."
        );
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);

  if (loading) {
    return (
      <div>
        <h1>Clients</h1>
        <p>Loading clients...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Clients</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
  <div>
    <h1>Clients</h1>

    <p>
      {clients.length}{" "}
      {clients.length === 1 ? "client" : "clients"}
    </p>

    <input
  type="text"
  placeholder="Search clients by name or email..."
  value={searchTerm}
  onChange={(event) => setSearchTerm(event.target.value)}
  style={{
    width: "100%",
    maxWidth: "420px",
    padding: "10px 12px",
    marginTop: "16px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    boxSizing: "border-box",
  }}
/>
 <select
  value={statusFilter}
  onChange={(event) => setStatusFilter(event.target.value)}
  style={{
    marginTop: "12px",
    marginLeft: "12px",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    backgroundColor: "#ffffff",
  }}
>
  <option value="all">All statuses</option>
  <option value="active">Active</option>
  <option value="inactive">Inactive</option>
</select>

<input
  type="text"
  placeholder="Filter by tag..."
  value={tagFilter}
  onChange={(event) => setTagFilter(event.target.value)}
  style={{
    marginTop: "12px",
    marginLeft: "12px",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    boxSizing: "border-box",
  }}
/>

    <div
      style={{
        marginTop: "24px",
        overflowX: "auto",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          backgroundColor: "#ffffff",
        }}
      >
        <thead>
          <tr>
           <th style={{ textAlign: "left", padding: "12px" }}>
  <button
  type="button"
  onClick={() => {
    if (sortField === "name") {
      setSortDirection((current) =>
        current === "asc" ? "desc" : "asc"
      );
    } else {
      setSortField("name");
      setSortDirection("asc");
    }
  }}
  style={{
    border: "none",
    background: "none",
    padding: 0,
    fontWeight: "600",
    cursor: "pointer",
  }}
>
  Name{" "}
  {sortField === "name"
    ? sortDirection === "asc"
      ? "↑"
      : "↓"
    : ""}
</button>
</th>
            <th style={{ textAlign: "left", padding: "12px" }}>
              Email
            </th>
            <th style={{ textAlign: "left", padding: "12px" }}>
  <button
  type="button"
  onClick={() => {
    if (sortField === "lastSession") {
      setSortDirection((current) =>
        current === "asc" ? "desc" : "asc"
      );
    } else {
      setSortField("lastSession");
      setSortDirection("desc");
    }
  }}
  style={{
    border: "none",
    background: "none",
    padding: 0,
    fontWeight: "600",
    cursor: "pointer",
  }}
>
  Last Session{" "}
  {sortField === "lastSession"
    ? sortDirection === "asc"
      ? "↑"
      : "↓"
    : ""}
</button>
</th>

  <th style={{ textAlign: "left", padding: "12px" }}>
   Status
  </th>

  <th style={{ textAlign: "left", padding: "12px" }}>
    Tags
  </th>
          </tr>
        </thead>

        <tbody>
          {clients
            .filter((client) => {
               const search = searchTerm.toLowerCase();

    const matchesSearch =
      client.name?.toLowerCase().includes(search) ||
      client.email?.toLowerCase().includes(search);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && client.isActive) ||
      (statusFilter === "inactive" && !client.isActive);

    const searchTag = tagFilter.trim().toLowerCase();

    const matchesTag =
      !searchTag ||
      client.tags?.some((tag) =>
         tag.toLowerCase().includes(searchTag)
        );

return matchesSearch && matchesStatus && matchesTag;
      })
    .sort((a, b) => {
  if (sortField === "name") {
    const nameA = a.name?.toLowerCase() || "";
    const nameB = b.name?.toLowerCase() || "";

    return sortDirection === "asc"
      ? nameA.localeCompare(nameB)
      : nameB.localeCompare(nameA);
  }

  const dateA = a.lastSession
    ? new Date(a.lastSession.startTime).getTime()
    : 0;

  const dateB = b.lastSession
    ? new Date(b.lastSession.startTime).getTime()
    : 0;

  return sortDirection === "asc"
    ? dateA - dateB
    : dateB - dateA;
})
    .map((client) => (
            <tr key={client._id}>
             <td style={{ padding: "12px" }}>
                <Link
                  to={`/therapist/clients/${client._id}`}
                  style={{
                       color: "#2563eb",
                       textDecoration: "none",
                       fontWeight: "600",
                     }}
                   >
                    {client.name}
                   </Link>
                 </td>

              <td style={{ padding: "12px" }}>
                {client.email}
              </td>

              <td style={{ padding: "12px" }}>
                {client.lastSession
                  ? new Date(
                      client.lastSession.startTime
                    ).toLocaleDateString()
                  : "No sessions yet"}
              </td>

              <td style={{ padding: "12px" }}>
                {client.isActive ? "Active" : "Inactive"}
              </td>

              <td style={{ padding: "12px" }}>
                {client.tags?.length
                  ? client.tags.join(", ")
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
}

export default Clients;