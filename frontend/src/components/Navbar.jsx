import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path ? 'bg-indigo-700' : '';

  // Participant navigation
  const participantLinks = [
    { to: '/participant/dashboard', label: 'Dashboard' },
    { to: '/browse-events', label: 'Browse Events' },
    { to: '/clubs', label: 'Clubs/Organizers' },
    { to: '/participant/profile', label: 'Profile' },
  ];

  // Organizer navigation
  const organizerLinks = [
    { to: '/organizer/dashboard', label: 'Dashboard' },
    { to: '/organizer/create-event', label: 'Create Event' },
    { to: '/organizer/events', label: 'My Events' },
    { to: '/organizer/profile', label: 'Profile' },
  ];

  // Admin navigation
  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/organizers', label: 'Manage Clubs/Organizers' },
    { to: '/admin/password-resets', label: 'Password Resets' },
  ];

  const getLinks = () => {
    if (!user) return [];
    switch (user.role) {
      case 'participant': return participantLinks;
      case 'organizer': return organizerLinks;
      case 'admin': return adminLinks;
      default: return [];
    }
  };

  if (!user) {
    // Public navbar
    return (
      <nav className="bg-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/browse-events" className="text-xl font-bold">🎉 Felicity EMS</Link>
            <div className="flex items-center space-x-3">
              <Link to="/browse-events" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">Browse Events</Link>
              <button onClick={() => navigate('/login')} className="px-4 py-2 bg-white text-indigo-600 rounded-md text-sm font-medium hover:bg-gray-100">Login</button>
              <button onClick={() => navigate('/register')} className="px-4 py-2 bg-indigo-800 rounded-md text-sm font-medium hover:bg-indigo-900">Register</button>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-indigo-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to={`/${user.role === 'participant' ? 'participant' : user.role}/dashboard`} className="text-xl font-bold">🎉 Felicity EMS</Link>
          
          <div className="hidden md:flex items-center space-x-1">
            {getLinks().map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors ${isActive(link.to)}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-sm hidden sm:block">Hi, {user.name?.split(' ')[0]}</span>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-md text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden pb-3 flex flex-wrap gap-1">
          {getLinks().map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-1 rounded-md text-xs font-medium hover:bg-indigo-700 ${isActive(link.to)}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
