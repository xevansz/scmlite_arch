import { Link, useNavigate } from "react-router-dom";
import { logout, isAdmin } from "../utils/api";

export function Navigation() {
  const navigate = useNavigate();
  const userIsAdmin = isAdmin();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-[var(--color-surface)] border-b border-[var(--color-secondary)] px-8 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <h1 className="text-[var(--color-text)] mr-4 font-medium">
            Shipment Tracker
          </h1>
          <Link
            to="/dashboard"
            className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
          >
            Dashboard
          </Link>
          <Link
            to="/create-shipment"
            className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
          >
            Create Shipment
          </Link>
          <Link
            to="/device-data"
            className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
          >
            Device Data
          </Link>
          {userIsAdmin && (
            <Link
              to="/admin"
              className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
            >
              Admin
            </Link>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-[var(--color-secondary)] text-[var(--color-text)] rounded hover:bg-[var(--color-error)] transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
