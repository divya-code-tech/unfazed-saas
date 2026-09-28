import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    {
      label: "Practice Pulse",
      path: "/therapist/dashboard",
      icon: "◌",
    },
    {
      label: "Clients",
      path: "/therapist/clients",
      icon: "○",
    },
    {
       label: "Packages",
       path: "/therapist/packages",
       icon: "▣",
    },
    {
      label: "Schedule",
      path: "/therapist/schedule",
      icon: "◷",
    },
    {
      label: "Notes",
      path: "/therapist/notes",
      icon: "✦",
    },
    {
      label: "Analytics",
      path: "/therapist/analytics",
      icon: "⌁",
    },
  ];

  return (
    <div className="uf-app-shell">
      <aside className="uf-sidebar">
        <div className="uf-sidebar-brand">
          <div className="uf-brand-mark">U</div>

          <div>
            <strong>Unfazed</strong>
            <span>Therapist workspace</span>
          </div>
        </div>

        <div className="uf-sidebar-section">
          <span className="uf-sidebar-label">Workspace</span>

          <nav className="uf-sidebar-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `uf-nav-item ${isActive ? "active" : ""}`
                }
              >
                <span className="uf-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="uf-sidebar-bottom">
          <div className="uf-privacy-note">
            <span className="uf-privacy-icon">◆</span>

            <div>
              <strong>Private by design</strong>
              <p>Your clinical workspace stays protected.</p>
            </div>
          </div>

          <button
            type="button"
            className="uf-profile-button"
            onClick={handleLogout}
          >
            <span className="uf-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "T"}
            </span>

            <span className="uf-profile-details">
              <strong>{user?.name || "Therapist"}</strong>
              <small>Sign out</small>
            </span>

            <span className="uf-profile-arrow">↗</span>
          </button>
        </div>
      </aside>

      <div className="uf-main-area">
        <header className="uf-topbar">
          <div>
            <span className="uf-topbar-product">UNFAZED WORKSPACE</span>
          </div>

          <div className="uf-topbar-right">
            <span className="uf-live-indicator">
              <span />
              Practice active
            </span>
          </div>
        </header>

        <main className="uf-main-content">{children}</main>
      </div>
    </div>
  );
}

export default AppShell;