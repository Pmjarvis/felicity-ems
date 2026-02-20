import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';

const MyTicket = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      const response = await axios.get(`/registrations/${ticketId}/ticket`);
      setTicket(response.data.data);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      setError('Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  const downloadTicket = () => {
    const canvas = document.getElementById('qr-code');
    const pngUrl = canvas
      .toDataURL('image/png')
      .replace('image/png', 'image/octet-stream');

    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `ticket-${ticket.ticketId}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading ticket...</div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-4">{error || 'Ticket not found'}</p>
          <button
            onClick={() => navigate('/participant/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/participant/dashboard')}
            className="text-blue-600 hover:text-blue-700 mb-4"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Event Ticket</h1>
        </div>

        {/* Ticket Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Ticket Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">{ticket.event?.name}</h2>
            <p className="text-blue-100">
              {ticket.event?.organizer?.organizerName}
            </p>
          </div>

          {/* Ticket Body */}
          <div className="p-6">
            {/* QR Code */}
            <div className="flex justify-center mb-6 p-6 bg-gray-50 rounded-lg">
              <QRCodeCanvas
                id="qr-code"
                value={ticket.ticketId}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>

            {/* Ticket Details */}
            <div className="space-y-4 mb-6">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600 font-medium">Ticket ID:</span>
                <span className="font-mono font-bold">{ticket.ticketId}</span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600 font-medium">Participant:</span>
                <span className="font-semibold">
                  {ticket.user?.name || `${ticket.user?.firstName || ''} ${ticket.user?.lastName || ''}`}
                </span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600 font-medium">Email:</span>
                <span>{ticket.user?.email}</span>
              </div>

              {ticket.team?.name && (
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600 font-medium">Team:</span>
                  <span className="font-semibold">{ticket.team.name}</span>
                </div>
              )}

              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600 font-medium">Registration Fee:</span>
                <span className="font-semibold">₹{ticket.event?.registrationFee || 0}</span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600 font-medium">Event Date:</span>
                <span>
                  {new Date(ticket.event?.startDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600 font-medium">Registration Date:</span>
                <span>
                  {new Date(ticket.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>

              {ticket.attendance?.marked && (
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600 font-medium">Attendance:</span>
                  <span className="text-green-600 font-semibold">
                    ✓ Marked on {new Date(ticket.attendance.markedAt).toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>

            {/* Custom Form Responses */}
            {ticket.formResponses && Object.keys(Object.fromEntries(ticket.formResponses instanceof Map ? ticket.formResponses : Object.entries(ticket.formResponses || {}))).length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  Registration Details
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {Object.entries(ticket.formResponses || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={downloadTicket}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                📥 Download QR Code
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
              >
                🖨️ Print Ticket
              </button>
            </div>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>📌 Important:</strong> Present this QR code at the event venue for attendance marking.
                Save or screenshot this ticket for offline access.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTicket;
