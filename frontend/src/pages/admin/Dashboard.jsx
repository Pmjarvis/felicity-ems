import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
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
              <h1 className="text-xl font-bold text-gray-800">Felicity EMS - Admin Panel</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.name}!</span>
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
            Admin Dashboard
          </h2>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
            <p className="text-yellow-700">
              ✅ Authentication successful! You're logged in as an Administrator.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Total Users</h3>
              <p className="text-3xl font-bold">0</p>
              <p className="text-sm opacity-90">Registered users</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Organizers</h3>
              <p className="text-3xl font-bold">0</p>
              <p className="text-sm opacity-90">Active organizers</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Events</h3>
              <p className="text-3xl font-bold">0</p>
              <p className="text-sm opacity-90">Total events</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Password Resets</h3>
              <p className="text-3xl font-bold">0</p>
              <p className="text-sm opacity-90">Pending requests</p>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition">
                <h4 className="font-semibold text-blue-900">Manage Organizers</h4>
                <p className="text-sm text-blue-700">Add or remove clubs/organizers</p>
              </button>
              <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition">
                <h4 className="font-semibold text-green-900">View All Events</h4>
                <p className="text-sm text-green-700">Monitor all events</p>
              </button>
              <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition">
                <h4 className="font-semibold text-purple-900">Password Requests</h4>
                <p className="text-sm text-purple-700">Handle reset requests</p>
              </button>
            </div>
          </div>

          {/* Admin Info */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Admin Profile</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="text-gray-900">{user?.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="text-gray-900">{user?.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="text-gray-900 capitalize">{user?.role}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Login</dt>
                  <dd className="text-gray-900">{user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'First login'}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
