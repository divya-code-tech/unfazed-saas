import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function NavIcon({ type }) {
  const commonProps = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  if (type === "dashboard") {
    return (
      <svg {...commonProps}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    );
  }

  if (type === "clients") {
    return (
      <svg {...commonProps}>
        <path d="M16 21v-1.8a4.2 4.2 0 0 0-4.2-4.2H6.2A4.2 4.2 0 0 0 2 19.2V21" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-1.8a4.2 4.2 0 0 0-3.3-4.1" />
        <path d="M16.5 3.2a4 4 0 0 1 0 7.6" />
      </svg>
    );
  }

  if (type === "packages") {
    return (
      <svg {...commonProps}>
        <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z" />
        <path d="M4 7.5 12 12l8-4.5" />
        <path d="M12 12v9" />
      </svg>
    );
  }
   if (type === "schedule") {
    return (
      <svg {...commonProps}>
        <rect x="3" y="4.5" width="18" height="16" rx="2" />
        <path d="M16 2.5v4M8 2.5v4M3 9h18" />
        <path d="M8 13h3M8 17h3M14 13h2M14 17h2" />
      </svg>
    );
  }

  if (type === "notes") {
    return (
      <svg {...commonProps}>
        <path d="M6 3h9l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
        <path d="M14 3v5h5M8 12h8M8 16h6" />
      </svg>
    );
  }

  if (type === "chat") {
  return (
    <svg {...commonProps}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5z" />
      <path d="M8 8h8M8 11.5h5" />
    </svg>
  );
}

if (type === "subscription") {
  return (
    <svg {...commonProps}>
      <path d="M12 3.5 18.5 6v5.5c0 4.2-2.7 7.4-6.5 9-3.8-1.6-6.5-4.8-6.5-9V6z" />
      <path d="M9.2 12.2 11 14l3.8-4" />
    </svg>
  );
}

    if (type === "profile") {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 21a7 7 0 0 1 14 0" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="M4 19V5" />
      <path d="M4 19h17" />
      <path d="m7 15 4-4 3 2 6-7" />
      <path d="M16 6h4v4" />
    </svg>
  );
}

function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

 const navItems = [
  { label: "Practice Pulse", path: "/therapist/dashboard", icon: "dashboard" },
  { label: "Clients", path: "/therapist/clients", icon: "clients" },
  { label: "Packages", path: "/therapist/packages", icon: "packages" },
  { label: "Schedule", path: "/therapist/schedule", icon: "schedule" },
  { label: "Notes", path: "/therapist/notes", icon: "notes" },
  { label: "Chat", path: "/therapist/chat", icon: "chat" },
  { label: "Analytics", path: "/therapist/analytics", icon: "analytics" },
  { label: "Subscription", path: "/therapist/subscription", icon: "subscription" },
];

  const activePage =
    navItems.find((item) =>
      location.pathname.startsWith(item.path)
    )?.label || "Practice Pulse";

  return (
    <div className="uf-app-shell">
      <aside className="uf-sidebar">
        <div className="uf-sidebar-top">
          <div className="uf-sidebar-brand">
            <div className="uf-brand-mark">U</div>

            <div className="uf-brand-copy">
              <strong>Unfazed</strong>
              <span>Therapist workspace</span>
            </div>
          </div>

          <div className="uf-workspace-card">
            <span className="uf-workspace-icon">✦</span>

            <div>
              <span className="uf-workspace-label">
                Current workspace
              </span>
              <strong>Private Practice</strong>
            </div>
          </div>

          <div className="uf-sidebar-section">
            <span className="uf-sidebar-label">Workspace</span>

            <nav className="uf-sidebar-nav" aria-label="Workspace navigation">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `uf-nav-item ${isActive ? "active" : ""}`
                  }
                >
                  <span className="uf-nav-icon">
                    <NavIcon type={item.icon} />
                  </span>

                  <span className="uf-nav-label">{item.label}</span>
                </NavLink>
              ))}
            </nav>

     <div className="uf-sidebar-profile">
        <NavLink
          to="/therapist/profile"
          className={({ isActive }) =>
          `uf-nav-item ${isActive ? "active" : ""}`
      }
  >
    <span className="uf-nav-icon">
      <NavIcon type="profile" />
    </span>

     <span className="uf-nav-label">Profile</span>
   </NavLink>
</div>
 </div>
 </div>
 </aside>

      <div className="uf-main-area">
        <header className="uf-topbar">
          <div className="uf-topbar-page">
            <span className="uf-topbar-product">
              UNFAZED WORKSPACE
            </span>

            <span className="uf-topbar-divider">/</span>

            <strong>{activePage}</strong>
          </div>

         <div className="uf-topbar-right">
  <div className="uf-topbar-status">
    <span className="uf-live-dot" />
    Practice active
  </div>

  <div className="uf-topbar-account">
    <div className="uf-topbar-avatar">
      {user?.name?.charAt(0)?.toUpperCase() || "T"}
    </div>

    <div className="uf-topbar-account-copy">
      <strong>{user?.name || "Therapist"}</strong>
      <span>Therapist</span>
    </div>

    <button
      type="button"
      className="uf-topbar-signout"
      onClick={handleLogout}
    >
      Sign out
    </button>
  </div>
</div>
</header>

        <main className="uf-main-content">
          <div className="uf-content-frame">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default AppShell;