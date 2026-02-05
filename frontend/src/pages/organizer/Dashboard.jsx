import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const OrganizerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalRegistrations: 0,
    totalRevenue: 0,
    totalAttendance: 0,
    events: []
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/organizer/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

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
            <div 
              onClick={() => navigate('/organizer/events')}
              className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-6 rounded-lg cursor-pointer hover:shadow-lg transition"
            >
              <h3 className="text-lg font-semibold mb-2">My Events</h3>
              <p className="text-3xl font-bold">{stats.totalEvents}</p>
              <p className="text-sm opacity-90">Created events</p>
            </div>
            
            <div 
              onClick={() => navigate('/organizer/create-event')}
              className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg cursor-pointer hover:shadow-lg transition"
            >
              <h3 className="text-lg font-semibold mb-2">Create Event</h3>
              <p className="text-3xl font-bold">+</p>
              <p className="text-sm opacity-90">New event</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Registrations</h3>
              <p className="text-3xl font-bold">{stats.totalRegistrations}</p>
              <p className="text-sm opacity-90">Total registrations</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Revenue</h3>
              <p className="text-3xl font-bold">₹{stats.totalRevenue}</p>
              <p className="text-sm opacity-90">Total earnings</p>
            </div>
          </div>

          {/* Events Section */}
          {stats.events && stats.events.length > 0 && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Recent Events</h3>
                <button
                  onClick={() => navigate('/organizer/events')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View All →
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.events.slice(0, 3).map((event) => (
                  <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <h4 className="font-semibold text-gray-900 mb-2">{event.name}</h4>
                    <div className="flex justify-between items-center text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        event.status === 'published' ? 'bg-green-100 text-green-800' :
                        event.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {event.status}
                      </span>
                      <span className="text-gray-600">{event.registrationCount} registered</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => navigate('/organizer/create-event')}
                className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition"
              >
                <h4 className="font-semibold text-blue-900">Create Event</h4>
                <p className="text-sm text-blue-700">Start a new event</p>
              </button>
              <button 
                onClick={() => navigate('/organizer/events')}
                className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition"
              >
                <h4 className="font-semibold text-green-900">My Events</h4>
                <p className="text-sm text-green-700">Manage all events</p>
              </button>
              <button 
                onClick={() => navigate('/organizer/profile')}
                className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition"
              >
                <h4 className="font-semibold text-purple-900">Profile</h4>
                <p className="text-sm text-purple-700">Edit organization details</p>
              </button>
            </div>
          </div>

          {/* Organizer Info */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Organization Profile</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Organization</dt>
                  <dd className="text-gray-900">{user?.organizationName || user?.name}</dd>
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
