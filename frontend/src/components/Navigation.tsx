import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../utils/api';

export function Navigation() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-[#0f1729] border-b border-[#1e2a45] px-8 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <h1 className="text-white mr-4">Shipment Tracker</h1>
          <Link 
            to="/dashboard" 
            className="text-[#8b92a7] hover:text-white transition-colors"
          >
            Dashboard
          </Link>
          <Link 
            to="/create-shipment" 
            className="text-[#8b92a7] hover:text-white transition-colors"
          >
            Create Shipment
          </Link>
          <Link 
            to="/device-data" 
            className="text-[#8b92a7] hover:text-white transition-colors"
          >
            Device Data
          </Link>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-[#1e2a45] text-white rounded hover:bg-[#2a3654] transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
