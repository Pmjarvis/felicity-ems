import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ManageOrganizers = () => {
  const navigate = useNavigate();
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newOrganizer, setNewOrganizer] = useState({
    name: '',
    category: '',
    description: '',
    contactEmail: '',
    contactNumber: ''
  });
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [error, setError] = useState('');

  const categories = [
    'Technical',
    'Cultural',
    'Sports',
    'Literary',
    'Management',
    'Other'
  ];

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const fetchOrganizers = async () => {
    try {
      const response = await axios.get('/admin/organizers');
      setOrganizers(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching organizers:', error);
      setError('Failed to fetch organizers');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('/admin/organizers', newOrganizer);

      // Show credentials to admin
      setCreatedCredentials({
        name: response.data.data.name,
        email: response.data.data.email,
        password: response.data.data.password
      });

      // Reset form
      setNewOrganizer({
        name: '',
        category: '',
        description: '',
        contactEmail: '',
        contactNumber: ''
      });

      // Refresh organizers list
      fetchOrganizers();
    } catch (error) {
      console.error('Error creating organizer:', error);
      setError(error.response?.data?.message || 'Failed to create organizer');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) {
      return;
    }

    try {
      await axios.delete(`/admin/organizers/${id}`);
      fetchOrganizers();
    } catch (error) {
      console.error('Error deleting organizer:', error);
      alert('Failed to delete organizer');
    }
  };

  const handleToggleStatus = async (id, name, currentStatus) => {
    const action = currentStatus === 'active' ? 'disable' : 'enable';
    if (!window.confirm(`Are you sure you want to ${action} ${name}?`)) {
      return;
    }

    try {
      await axios.put(`/admin/organizers/${id}/toggle-status`);
      fetchOrganizers();
    } catch (error) {
      console.error('Error toggling organizer status:', error);
      alert(`Failed to ${action} organizer`);
    }
  };

  const closeCredentialsModal = () => {
    setCreatedCredentials(null);
    setShowModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="mb-4 text-blue-600 hover:text-blue-800"
          >
            ← Back to Dashboard
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Organizers</h1>
              <p className="mt-2 text-gray-600">Create and manage club/organizer accounts</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              + Add New Organizer
            </button>
          </div>
        </div>

        {/* Organizers Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Events
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {organizers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No organizers found. Create your first organizer!
                  </td>
                </tr>
              ) : (
                organizers.map((org) => (
                  <tr key={org._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {org.organizerName || `${org.firstName} ${org.lastName}`}
                      </div>
                      <div className="text-sm text-gray-500">{org.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {org.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {org.contactEmail || org.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {org.eventCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${org.accountStatus === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                        }`}>
                        {org.accountStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleStatus(org._id, org.organizerName, org.accountStatus)}
                          className={`${
                            org.accountStatus === 'active'
                              ? 'text-yellow-600 hover:text-yellow-900'
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {org.accountStatus === 'active' ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleDelete(org._id, org.organizerName)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add Organizer Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6">Add New Organizer</h2>

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Organization Name *
                    </label>
                    <input
                      type="text"
                      value={newOrganizer.name}
                      onChange={(e) => setNewOrganizer({ ...newOrganizer, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={newOrganizer.category}
                      onChange={(e) => setNewOrganizer({ ...newOrganizer, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Email * (Will be used for login)
                    </label>
                    <input
                      type="email"
                      value={newOrganizer.contactEmail}
                      onChange={(e) => setNewOrganizer({ ...newOrganizer, contactEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      value={newOrganizer.contactNumber}
                      onChange={(e) => setNewOrganizer({ ...newOrganizer, contactNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newOrganizer.description}
                      onChange={(e) => setNewOrganizer({ ...newOrganizer, description: e.target.value })}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Organizer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Credentials Display Modal */}
        {createdCredentials && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-4 text-green-600">✅ Organizer Created!</h2>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800 font-semibold mb-2">
                  ⚠️ Important: Save these credentials now!
                </p>
                <p className="text-sm text-yellow-700">
                  This is the only time you'll see the password. Share it with the organizer securely.
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Organization:</label>
                  <p className="text-lg font-semibold">{createdCredentials.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Login Email:</label>
                  <p className="text-lg font-mono bg-gray-50 p-2 rounded">{createdCredentials.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Password:</label>
                  <p className="text-lg font-mono bg-gray-50 p-2 rounded">{createdCredentials.password}</p>
                </div>
              </div>

              <button
                onClick={closeCredentialsModal}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageOrganizers;
