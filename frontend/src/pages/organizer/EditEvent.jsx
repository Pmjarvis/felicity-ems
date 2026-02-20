import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const EditEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [participants, setParticipants] = useState([]);
  const [partSearch, setPartSearch] = useState('');
  const [showParticipants, setShowParticipants] = useState(false);

  // Editable form data
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const res = await axios.get(`/events/${id}`);
      const ev = res.data.data;
      setEvent(ev);
      setFormData({
        name: ev.name || '',
        description: ev.description || '',
        type: ev.type || 'Normal',
        eligibility: ev.eligibility || 'All',
        venue: ev.venue || '',
        registrationDeadline: ev.registrationDeadline ? new Date(ev.registrationDeadline).toISOString().slice(0, 16) : '',
        startDate: ev.startDate ? new Date(ev.startDate).toISOString().slice(0, 16) : '',
        endDate: ev.endDate ? new Date(ev.endDate).toISOString().slice(0, 16) : '',
        registrationLimit: ev.registrationLimit || '',
        registrationFee: ev.registrationFee || 0,
        tags: ev.tags || [],
        isTeamEvent: ev.isTeamEvent || false,
        minTeamSize: ev.minTeamSize || 2,
        maxTeamSize: ev.maxTeamSize || 4,
        status: ev.status
      });
    } catch (err) {
      setError('Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const fetchParticipants = async () => {
    try {
      const res = await axios.get(`/registrations/event/${id}`);
      setParticipants(res.data.data || []);
      setShowParticipants(true);
    } catch (err) {
      console.error('Error fetching participants:', err);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await axios.get(`/registrations/event/${id}/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${event.name}-registrations.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('CSV export error:', err);
      alert('Failed to export CSV');
    }
  };

  const filteredParticipants = participants.filter(p => {
    if (!partSearch) return true;
    const q = partSearch.toLowerCase();
    return p.user?.name?.toLowerCase().includes(q) || p.user?.email?.toLowerCase().includes(q);
  });

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await axios.put(`/events/${id}`, formData);
      setSuccess('Event updated successfully!');
      setTimeout(() => navigate('/organizer/events'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!window.confirm('Are you sure you want to publish this event? Published events have limited editing.')) return;
    setSaving(true);
    try {
      await axios.put(`/events/${id}`, { ...formData, status: 'Published' });
      setSuccess('Event published!');
      setTimeout(() => navigate('/organizer/events'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!window.confirm(`Change status to ${newStatus}?`)) return;
    try {
      await axios.put(`/events/${id}`, { status: newStatus });
      setSuccess(`Status changed to ${newStatus}`);
      setFormData(prev => ({ ...prev, status: newStatus }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-red-600 text-center text-lg">Event not found</p>
        </div>
      </div>
    );
  }

  const isDraft = formData.status === 'Draft';
  const isPublished = formData.status === 'Published';
  const isOngoing = formData.status === 'Ongoing';
  const isCompleted = formData.status === 'Completed';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => navigate('/organizer/events')} className="mb-4 text-blue-600 hover:text-blue-800">
          ← Back to My Events
        </button>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              isDraft ? 'bg-yellow-100 text-yellow-800' :
              isPublished ? 'bg-green-100 text-green-800' :
              isOngoing ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {formData.status}
            </span>
          </div>

          {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">{success}</div>}

          {/* Status-based editing notice */}
          {!isDraft && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                {isPublished && 'Published events: You can only update description, extend deadline, or increase registration limit.'}
                {(isOngoing || isCompleted) && 'This event can only have its status changed.'}
              </p>
            </div>
          )}

          <div className="space-y-6">
            {/* Basic Info - editable in Draft, name read-only after publish */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!isDraft}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                disabled={isOngoing || isCompleted}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                <input type="text" value={formData.type} disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Eligibility</label>
                <select
                  name="eligibility"
                  value={formData.eligibility}
                  onChange={handleChange}
                  disabled={!isDraft}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="All">All</option>
                  <option value="IIIT Only">IIIT Only</option>
                  <option value="Non-IIIT Only">Non-IIIT Only</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
              <input
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                disabled={!isDraft}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Deadline</label>
                <input
                  type="datetime-local"
                  name="registrationDeadline"
                  value={formData.registrationDeadline}
                  onChange={handleChange}
                  disabled={isOngoing || isCompleted}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  disabled={!isDraft}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  disabled={!isDraft}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Limit</label>
                <input
                  type="number"
                  name="registrationLimit"
                  value={formData.registrationLimit}
                  onChange={handleChange}
                  disabled={isOngoing || isCompleted}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Fee (₹)</label>
                <input
                  type="number"
                  name="registrationFee"
                  value={formData.registrationFee}
                  onChange={handleChange}
                  disabled={!isDraft}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Analytics for published / ongoing events */}
            {!isDraft && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Event Analytics</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Registrations</p>
                    <p className="text-2xl font-bold text-blue-600">{event.registrationCount || 0}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Views</p>
                    <p className="text-2xl font-bold text-green-600">{event.views || 0}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Revenue</p>
                    <p className="text-2xl font-bold text-purple-600">₹{(event.registrationCount || 0) * (event.registrationFee || 0)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 pt-4 border-t">
              {isDraft && (
                <>
                  <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button onClick={handlePublish} disabled={saving} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400">
                    Publish Event
                  </button>
                </>
              )}
              {isPublished && (
                <>
                  <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button onClick={() => handleStatusChange('Ongoing')} className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                    Mark as Ongoing
                  </button>
                  <button onClick={() => handleStatusChange('Closed')} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                    Close Registrations
                  </button>
                </>
              )}
              {isOngoing && (
                <>
                  <button onClick={() => handleStatusChange('Completed')} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Mark as Completed
                  </button>
                  <button onClick={() => handleStatusChange('Closed')} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                    Close Event
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Participant List Section */}
        {!isDraft && (
          <div className="bg-white rounded-lg shadow-md p-8 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Registered Participants</h2>
              <div className="flex gap-2">
                <button
                  onClick={fetchParticipants}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                >
                  {showParticipants ? 'Refresh' : 'Load Participants'}
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  Export CSV
                </button>
              </div>
            </div>

            {showParticipants && (
              <>
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={partSearch}
                    onChange={(e) => setPartSearch(e.target.value)}
                    className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {filteredParticipants.length === 0 ? (
                  <p className="text-gray-500 text-center py-6">No registrations yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reg Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredParticipants.map((reg, idx) => (
                          <tr key={reg._id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{reg.user?.name || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{reg.user?.email || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{new Date(reg.createdAt).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                reg.payment?.status === 'Paid' ? 'bg-green-100 text-green-800' :
                                reg.payment?.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {reg.payment?.status || 'Free'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{reg.team?.name || '-'}</td>
                            <td className="px-4 py-3 text-sm">
                              {reg.attendance?.marked ? (
                                <span className="text-green-600 font-medium">✓ Present</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  Showing {filteredParticipants.length} of {participants.length} registrations
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EditEvent;
