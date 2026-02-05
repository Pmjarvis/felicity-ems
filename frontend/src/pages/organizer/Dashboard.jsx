import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const OrganizerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">Felicity EMS - Organizer</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.organizerName || user?.name}!</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Organizer Dashboard
          </h2>
          
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
            <p className="text-green-700">
              ✅ Authentication successful! You're logged in as an Organizer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">My Events</h3>
              <p className="text-3xl font-bold">0</p>
              <p className="text-sm opacity-90">Created events</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Create Event</h3>
              <p className="text-3xl font-bold">+</p>
              <p className="text-sm opacity-90">New event</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Registrations</h3>
              <p className="text-3xl font-bold">0</p>
              <p className="text-sm opacity-90">Total registrations</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Revenue</h3>
              <p className="text-3xl font-bold">₹0</p>
              <p className="text-sm opacity-90">Total earnings</p>
            </div>
          </div>

          {/* Organizer Info */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Organization Profile</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Organization</dt>
                  <dd className="text-gray-900">{user?.organizerName || user?.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="text-gray-900">{user?.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Category</dt>
                  <dd className="text-gray-900">{user?.category}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="text-gray-900 capitalize">{user?.role}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerDashboard;
