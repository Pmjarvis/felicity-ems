import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PasswordResets = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [newPassword, setNewPassword] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      const response = await axios.get(`/admin/password-resets?status=${filter}`);
      setRequests(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching password reset requests:', error);
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this password reset request?')) {
      return;
    }

    try {
      const response = await axios.post(`/admin/password-resets/${id}/approve`);
      
      // Show new password to admin
      setNewPassword({
        organizerName: response.data.data.organizerName,
        email: response.data.data.organizerEmail,
        password: response.data.data.newPassword
      });

      // Refresh list
      fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      alert(error.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Enter reason for rejection (optional):');
    if (reason === null) return; // Cancelled

    try {
      await axios.post(`/admin/password-resets/${id}/reject`, { reason });
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Password Reset Requests</h1>
            <p className="mt-2 text-gray-600">Review and manage organizer password reset requests</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  filter === status
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status === 'pending' && requests.filter(r => r.status === 'pending').length > 0 && (
                  <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">
                    {requests.filter(r => r.status === 'pending').length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {requests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No {filter !== 'all' ? filter : ''} password reset requests found.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {requests.map((request) => (
                <div key={request._id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.organizer?.organizationName || 
                           `${request.organizer?.firstName} ${request.organizer?.lastName}`}
                        </h3>
                        {getStatusBadge(request.status)}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Email:</span> {request.organizer?.email}
                      </p>
                      
                      <p className="text-sm text-gray-600 mb-3">
                        <span className="font-medium">Requested:</span>{' '}
                        {new Date(request.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>

                      <div className="bg-gray-50 p-3 rounded-lg mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
                        <p className="text-sm text-gray-600">{request.reason}</p>
                      </div>

                      {request.status !== 'pending' && (
                        <div className="text-sm text-gray-600">
                          <p>
                            <span className="font-medium">
                              {request.status === 'approved' ? 'Approved' : 'Rejected'} by:
                            </span>{' '}
                            {request.approvedBy?.firstName} {request.approvedBy?.lastName} on{' '}
                            {new Date(request.approvedAt).toLocaleDateString()}
                          </p>
                          {request.adminNotes && (
                            <p className="mt-1">
                              <span className="font-medium">Admin Notes:</span> {request.adminNotes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {request.status === 'pending' && (
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleApprove(request._id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleReject(request._id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        >
                          ✗ Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Password Modal */}
        {newPassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-4 text-green-600">✅ Password Reset Approved!</h2>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800 font-semibold mb-2">
                  ⚠️ Important: Save this password now!
                </p>
                <p className="text-sm text-yellow-700">
                  Share these credentials with the organizer securely.
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Organization:</label>
                  <p className="text-lg font-semibold">{newPassword.organizerName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Email:</label>
                  <p className="text-lg font-mono bg-gray-50 p-2 rounded">{newPassword.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">New Password:</label>
                  <p className="text-lg font-mono bg-gray-50 p-2 rounded">{newPassword.password}</p>
                </div>
              </div>

              <button
                onClick={() => setNewPassword(null)}
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

export default PasswordResets;
