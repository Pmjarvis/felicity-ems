import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BrowserMultiFormatReader } from '@zxing/library';

const QRScanner = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const [stats, setStats] = useState(null);
  const [manualTicket, setManualTicket] = useState('');
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  useEffect(() => {
    fetchEventDetails();
    fetchAttendanceStats();
    
    return () => {
      stopScanning();
    };
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const response = await axios.get(
        `/events/${eventId}`
      );
      setEvent(response.data.data);
    } catch (error) {
      console.error('Error fetching event:', error);
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      const response = await axios.get(
        `/tickets/event/${eventId}/attendance`
      );
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const startScanning = async () => {
    try {
      setScanning(true);
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      const videoInputDevices = await codeReader.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        alert('No camera found');
        setScanning(false);
        return;
      }

      // Use the first camera (usually back camera on mobile)
      const selectedDeviceId = videoInputDevices[0].deviceId;

      codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        async (result, error) => {
          if (result) {
            const ticketNumber = result.getText();
            await validateTicket(ticketNumber);
          }
        }
      );
    } catch (error) {
      console.error('Error starting scanner:', error);
      alert('Failed to start camera: ' + error.message);
      setScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
    setScanning(false);
  };

  const validateTicket = async (ticketNumber) => {
    try {
      const response = await axios.post(
        '/tickets/validate',
        { ticketNumber, eventId }
      );

      setLastScan({
        success: true,
        message: response.data.message,
        data: response.data.data,
        timestamp: new Date()
      });

      // Refresh stats
      fetchAttendanceStats();

      // Play success sound (optional)
      playSound('success');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Validation failed';
      const validationStatus = error.response?.data?.validationStatus;
      
      setLastScan({
        success: false,
        message: errorMsg,
        status: validationStatus,
        timestamp: new Date()
      });

      // Play error sound (optional)
      playSound('error');
    }
  };

  const playSound = (type) => {
    // Simple audio feedback
    const audio = new Audio();
    if (type === 'success') {
      audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBCeFzfPTgjMGH2q+8OScTgwOUaPn77BcGAU7ldv0xnUsCC1+zfDainYKNXLH8N2ROQYXZLLS7a9WFgpIod700G4hAyeGz/PTgjEGIm3A7+iSUAwUXrTo7aRWFQtBn+Hxv2YgAyOFz/PU'; // Beep sound
    } else {
      audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBCeFzfPTgjMGH2q+8OScTgwOUaPn77BcGAU7ldv0xnUsCC1+zfDainYKNXLH8N2ROQYXZLLS7a9WFgpIod700G4hAyeGz/PTgjEGIm3A7+iSUAwUXrTo7aRWFQtBn+Hxv2YgAyOFz/PU'; // Error beep
    }
    audio.play().catch(() => {}); // Ignore errors
  };

  const handleManualValidation = async (e) => {
    e.preventDefault();
    if (!manualTicket.trim()) return;
    
    await validateTicket(manualTicket.trim());
    setManualTicket('');
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <button
          onClick={() => navigate('/organizer/dashboard')}
          className="mb-4 text-blue-600 hover:text-blue-800"
        >
          ← Back to Dashboard
        </button>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">QR Scanner</h1>
          <p className="text-gray-600 mb-6">{event.name}</p>

          {/* Attendance Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Registered</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.statistics.totalRegistrations}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Attended</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.statistics.attended}
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Not Attended</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.statistics.notAttended}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Attendance Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.statistics.attendanceRate}
                </p>
              </div>
            </div>
          )}

          {/* Scanner Controls */}
          <div className="space-y-4">
            {!scanning ? (
              <button
                onClick={startScanning}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition text-lg font-semibold"
              >
                Start Camera Scanner
              </button>
            ) : (
              <button
                onClick={stopScanning}
                className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition text-lg font-semibold"
              >
                Stop Scanner
              </button>
            )}

            {/* Video Preview */}
            {scanning && (
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-96 object-cover"
                />
                <div className="absolute inset-0 border-4 border-blue-500 pointer-events-none flex items-center justify-center">
                  <div className="w-64 h-64 border-2 border-white"></div>
                </div>
              </div>
            )}

            {/* Manual Entry */}
            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-600 mb-2">Or enter ticket number manually:</p>
              <form onSubmit={handleManualValidation} className="flex gap-2">
                <input
                  type="text"
                  value={manualTicket}
                  onChange={(e) => setManualTicket(e.target.value.toUpperCase())}
                  placeholder="TKT-XXXXXXXXXX"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Validate
                </button>
              </form>
            </div>

            {/* Last Scan Result */}
            {lastScan && (
              <div className={`p-4 rounded-lg ${
                lastScan.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className={`font-semibold ${
                    lastScan.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {lastScan.success ? '✓ Valid Ticket' : '✗ Invalid'}
                  </h3>
                  <span className="text-xs text-gray-600">
                    {lastScan.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                
                <p className={`text-sm mb-2 ${
                  lastScan.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {lastScan.message}
                </p>

                {lastScan.success && lastScan.data && (
                  <div className="text-sm space-y-1">
                    <p><strong>Participant:</strong> {lastScan.data.participant?.name}</p>
                    <p><strong>Email:</strong> {lastScan.data.participant?.email}</p>
                    <p><strong>Ticket:</strong> {lastScan.data.ticketNumber}</p>
                    {lastScan.data.team && (
                      <p><strong>Team:</strong> {lastScan.data.team.name}</p>
                    )}
                  </div>
                )}

                {!lastScan.success && lastScan.status === 'already_scanned' && (
                  <p className="text-sm text-orange-700 mt-2">
                    ⚠️ This ticket was already scanned earlier
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Attendance List */}
        {stats && stats.registrations && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Attendance List</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Participant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Ticket
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Team
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.registrations.map((reg, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {reg.participant?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {reg.participant?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {reg.ticketNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {reg.team?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {reg.attendanceMarked ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Attended
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            Not Attended
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {reg.attendanceMarkedAt 
                          ? new Date(reg.attendanceMarkedAt).toLocaleString()
                          : '-'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
