import { useEffect, useMemo, useState } from "react";
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
  const [showCreateModal, setShowCreateModal] = useState(false);
const [creatingClient, setCreatingClient] = useState(false);
const [createClientError, setCreateClientError] = useState("");

const [newClient, setNewClient] = useState({
  name: "",
  email: "",
  password: "",
  phone: "",
});

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

  const filteredClients = useMemo(() => {
    return clients
      .filter((client) => {
        const search = searchTerm.trim().toLowerCase();

        const matchesSearch =
          !search ||
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
      });
  }, [
    clients,
    searchTerm,
    statusFilter,
    tagFilter,
    sortField,
    sortDirection,
  ]);

  const activeClients = clients.filter(
    (client) => client.isActive
  ).length;

  const inactiveClients = clients.length - activeClients;

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((current) =>
        current === "asc" ? "desc" : "asc"
      );
    } else {
      setSortField(field);
      setSortDirection(field === "name" ? "asc" : "desc");
    }
  };
  const handleCreateClient = async (event) => {
  event.preventDefault();

  try {
    setCreatingClient(true);
    setCreateClientError("");

    const response = await axiosInstance.post("/clients", {
      name: newClient.name.trim(),
      email: newClient.email.trim(),
      password: newClient.password,
      phone: newClient.phone.trim(),
    });

    const createdClient = response.data.client;

    setClients((currentClients) => [
      createdClient,
      ...currentClients,
    ]);

    setNewClient({
      name: "",
      email: "",
      password: "",
      phone: "",
    });

    setShowCreateModal(false);
  } catch (err) {
    console.error("Failed to create client:", err);

    setCreateClientError(
      err.response?.data?.message ||
        "Failed to create client."
    );
  } finally {
    setCreatingClient(false);
  }
};

  const sortIndicator = (field) => {
    if (sortField !== field) return "";

    return sortDirection === "asc" ? "↑" : "↓";
  };

  if (loading) {
    return (
      <div className="uf-clients-page">
        <section className="uf-page-header">
          <div>
            <span className="uf-eyebrow">Your practice</span>
            <h1>Clients</h1>
            <p>Loading your client workspace...</p>
          </div>
        </section>

        <div className="uf-client-loading">
          <div className="uf-loading-pulse" />
          <div className="uf-loading-lines">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="uf-clients-page">
        <section className="uf-page-header">
          <div>
            <span className="uf-eyebrow">Your practice</span>
            <h1>Clients</h1>
          </div>
        </section>

        <div className="uf-client-error">
          <div className="uf-client-error-icon">!</div>
          <div>
            <strong>We couldn't load your clients</strong>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="uf-clients-page">
      {/* Header */}
      <section className="uf-page-header uf-clients-header">
        <div>
          <span className="uf-eyebrow">Your practice</span>

          <h1>Clients</h1>

          <p>
            Keep track of your client relationships, activity,
            and recent sessions in one place.
          </p>
        </div>

       <div className="uf-clients-header-actions">
  <button
    type="button"
    className="uf-client-create-button"
    onClick={() => {
      setCreateClientError("");
      setShowCreateModal(true);
    }}
  >
    <span>＋</span>
    Add client
  </button>

  <div className="uf-clients-header-count">
    <strong>{clients.length}</strong>
    <span>
      {clients.length === 1
        ? "total client"
        : "total clients"}
    </span>
  </div>
</div>
      </section>

      {/* Overview */}
      <section className="uf-client-overview">
        <article className="uf-client-stat uf-client-stat-primary">
          <div className="uf-client-stat-icon">◎</div>
          <div>
            <span>All clients</span>
            <strong>{clients.length}</strong>
          </div>
        </article>

        <article className="uf-client-stat">
          <div className="uf-client-stat-icon">✓</div>
          <div>
            <span>Active</span>
            <strong>{activeClients}</strong>
          </div>
        </article>

        <article className="uf-client-stat">
          <div className="uf-client-stat-icon">○</div>
          <div>
            <span>Inactive</span>
            <strong>{inactiveClients}</strong>
          </div>
        </article>
      </section>

      {/* Client workspace */}
      <section className="uf-client-workspace">
        <div className="uf-client-workspace-header">
          <div>
            <h2>Client directory</h2>
            <p>
              {filteredClients.length}{" "}
              {filteredClients.length === 1
                ? "client matches"
                : "clients match"}{" "}
              your current filters.
            </p>
          </div>

          <div className="uf-client-sort-actions">
            <span>Sort by</span>

            <button
              type="button"
              className={
                sortField === "lastSession"
                  ? "uf-sort-button active"
                  : "uf-sort-button"
              }
              onClick={() => handleSort("lastSession")}
            >
              Recent session {sortIndicator("lastSession")}
            </button>

            <button
              type="button"
              className={
                sortField === "name"
                  ? "uf-sort-button active"
                  : "uf-sort-button"
              }
              onClick={() => handleSort("name")}
            >
              Name {sortIndicator("name")}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="uf-client-filters">
          <div className="uf-client-search">
            <span className="uf-search-icon">⌕</span>

            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
            />
          </div>

          <select
            className="uf-client-filter-select"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="all">All statuses</option>
            <option value="active">Active clients</option>
            <option value="inactive">Inactive clients</option>
          </select>

          <input
            className="uf-client-tag-input"
            type="text"
            placeholder="Filter by tag..."
            value={tagFilter}
            onChange={(event) =>
              setTagFilter(event.target.value)
            }
          />
        </div>

        {/* Results */}
        {filteredClients.length === 0 ? (
          <div className="uf-client-empty">
            <div className="uf-client-empty-icon">⌕</div>

            <h3>No clients found</h3>

            <p>
              Try adjusting your search or filters to find
              another client.
            </p>
          </div>
        ) : (
          <div className="uf-client-table-wrap">
            <table className="uf-client-table">
              <thead>
                <tr>
                  <th>
                    <button
                      type="button"
                      onClick={() => handleSort("name")}
                    >
                      Client
                      <span>{sortIndicator("name")}</span>
                    </button>
                  </th>

                  <th>Email</th>

                  <th>
                    <button
                      type="button"
                      onClick={() => handleSort("lastSession")}
                    >
                      Last session
                      <span>
                        {sortIndicator("lastSession")}
                      </span>
                    </button>
                  </th>

                  <th>Status</th>

                  <th>Tags</th>
                </tr>
              </thead>

              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client._id}>
                    <td>
                      <Link
                        to={`/therapist/clients/${client._id}`}
                        className="uf-client-name"
                      >
                        <span className="uf-client-avatar">
                          {client.name
                            ?.charAt(0)
                            .toUpperCase() || "C"}
                        </span>

                        <span>
                          <strong>{client.name}</strong>
                          <small>View profile</small>
                        </span>
                      </Link>
                    </td>

                    <td>
                      <span className="uf-client-email">
                        {client.email}
                      </span>
                    </td>

                    <td>
                      <span className="uf-client-date">
                        {client.lastSession
                          ? new Date(
                              client.lastSession.startTime
                            ).toLocaleDateString()
                          : "No sessions yet"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={
                          client.isActive
                            ? "uf-client-status active"
                            : "uf-client-status inactive"
                        }
                      >
                        <span />
                        {client.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <div className="uf-client-tags">
                        {client.tags?.length ? (
                          client.tags
                            .slice(0, 3)
                            .map((tag) => (
                              <span key={tag}>{tag}</span>
                            ))
                        ) : (
                          <span className="uf-no-tags">
                            No tags
                          </span>
                        )}

                        {client.tags?.length > 3 && (
                          <span className="uf-more-tags">
                            +{client.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
           </section>

      {showCreateModal && (
        <div
          className="uf-client-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowCreateModal(false);
              setCreateClientError("");
            }
          }}
        >
          <div className="uf-client-modal">
            <div className="uf-client-modal-header">
              <div>
                <span className="uf-eyebrow">Client CRM</span>
                <h2>Add a new client</h2>
                <p>
                  Create a client account for your practice.
                </p>
              </div>

              <button
                type="button"
                className="uf-client-modal-close"
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateClientError("");
                }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form
              className="uf-client-create-form"
              onSubmit={handleCreateClient}
            >
              <div className="uf-client-form-grid">
                <label>
                  <span>Name</span>
                  <input
                    type="text"
                    value={newClient.name}
                    onChange={(event) =>
                      setNewClient((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Client name"
                    required
                  />
                </label>

                <label>
                  <span>Email</span>
                  <input
                    type="email"
                    value={newClient.email}
                    onChange={(event) =>
                      setNewClient((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="client@example.com"
                    required
                  />
                </label>

                <label>
                  <span>Password</span>
                  <input
                    type="password"
                    value={newClient.password}
                    onChange={(event) =>
                      setNewClient((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    placeholder="Temporary login password"
                    required
                  />
                </label>

                <label>
                  <span>Phone <small>(optional)</small></span>
                  <input
                    type="tel"
                    value={newClient.phone}
                    onChange={(event) =>
                      setNewClient((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    placeholder="Phone number"
                  />
                </label>
              </div>

              {createClientError && (
                <div
                  className="uf-client-create-error"
                  role="alert"
                >
                  {createClientError}
                </div>
              )}

              <div className="uf-client-modal-actions">
                <button
                  type="button"
                  className="uf-client-modal-cancel"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateClientError("");
                  }}
                  disabled={creatingClient}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="uf-client-create-submit"
                  disabled={creatingClient}
                >
                  {creatingClient
                    ? "Creating..."
                    : "Create client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clients;