import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const ParticipantDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/registrations/my-registrations');
      if (res.data.success) setRegistrations(res.data.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();

  const upcoming = registrations.filter(r => 
    r.event && new Date(r.event.startDate) > now && r.status !== 'Cancelled' && r.status !== 'Rejected'
  );
  const normalRegs = registrations.filter(r => r.event && r.event.type === 'Normal');
  const merchRegs = registrations.filter(r => r.event && r.event.type === 'Merchandise');
  const completedRegs = registrations.filter(r => 
    r.event && (new Date(r.event.endDate) < now || r.status === 'Attended')
  );
  const cancelledRegs = registrations.filter(r => r.status === 'Cancelled' || r.status === 'Rejected');

  const tabData = {
    upcoming: { label: 'Upcoming Events', data: upcoming },
    normal: { label: 'Normal', data: normalRegs },
    merchandise: { label: 'Merchandise', data: merchRegs },
    completed: { label: 'Completed', data: completedRegs },
    cancelled: { label: 'Cancelled/Rejected', data: cancelledRegs },
  };

  const statusColor = (status) => {
    const c = { Registered: 'bg-green-100 text-green-800', Attended: 'bg-blue-100 text-blue-800', Cancelled: 'bg-red-100 text-red-800', Rejected: 'bg-red-100 text-red-800', Pending: 'bg-yellow-100 text-yellow-800' };
    return c[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-5 rounded-lg shadow cursor-pointer" onClick={() => setActiveTab('upcoming')}>
            <h3 className="text-sm font-medium opacity-90">Upcoming</h3>
            <p className="text-3xl font-bold">{upcoming.length}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-5 rounded-lg shadow cursor-pointer" onClick={() => setActiveTab('completed')}>
            <h3 className="text-sm font-medium opacity-90">Completed</h3>
            <p className="text-3xl font-bold">{completedRegs.length}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-5 rounded-lg shadow cursor-pointer" onClick={() => navigate('/browse-events')}>
            <h3 className="text-sm font-medium opacity-90">Browse Events</h3>
            <p className="text-lg font-bold mt-1">Explore →</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-5 rounded-lg shadow cursor-pointer" onClick={() => navigate('/participant/profile')}>
            <h3 className="text-sm font-medium opacity-90">Profile</h3>
            <p className="text-lg font-bold mt-1">View →</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              {Object.entries(tabData).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${
                    activeTab === key
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {val.label} ({val.data.length})
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-3 text-gray-500">Loading...</p>
              </div>
            ) : tabData[activeTab].data.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">No events found in this category</p>
                <Link to="/browse-events" className="text-indigo-600 hover:underline mt-2 inline-block">Browse Events →</Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organizer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tabData[activeTab].data.map(reg => (
                      <tr key={reg._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Link to={`/events/${reg.event?._id}`} className="text-indigo-600 hover:underline font-medium">
                            {reg.event?.name || 'N/A'}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            reg.event?.type === 'Merchandise' ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {reg.event?.type || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{reg.event?.organizer?.organizerName || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {reg.event?.startDate ? new Date(reg.event.startDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(reg.status)}`}>
                            {reg.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{reg.team?.name || 'Individual'}</td>
                        <td className="px-4 py-3">
                          <Link to={`/ticket/${reg.ticketId}`} className="text-indigo-600 hover:underline text-sm font-mono">
                            {reg.ticketId}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantDashboard;
