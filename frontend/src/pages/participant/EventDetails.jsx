import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import DiscussionForum from '../../components/DiscussionForum';
import AddToCalendar from '../../components/AddToCalendar';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [userTeam, setUserTeam] = useState(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamAction, setTeamAction] = useState(''); // 'create' or 'join'
  const [teamName, setTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [formResponses, setFormResponses] = useState({});
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedVariant, setSelectedVariant] = useState('');
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);

  useEffect(() => {
    fetchEventDetails();
  }, [id, user]); // Re-run when user loads to check registration

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/events/${id}`);
      setEvent(response.data.data);

      // Check if user is registered (only if user is logged in)
      if (user) {
        try {
          const regResponse = await axios.get(`/registrations/my-registrations`);
          const userReg = regResponse.data.data?.find(r => r.event._id === id);
          setIsRegistered(!!userReg);
          setRegistration(userReg);

          // Check if user has a team for this event
          if (response.data.data.isTeamEvent) {
            const teamResponse = await axios.get(`/teams/my-teams`);
            const team = teamResponse.data.data?.find(t => t.event._id === id);
            setUserTeam(team);
          }
        } catch (err) {
          console.error('Error checking registration:', err);
        }
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      setError('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      const response = await axios.post('/teams/create', { eventId: id, teamName });

      setUserTeam(response.data.data);
      setShowTeamModal(false);
      setTeamName('');
      alert(`Team created! Share this invite code with your team: ${response.data.data.inviteCode}`);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create team');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      const response = await axios.post('/teams/join', { inviteCode });

      setUserTeam(response.data.data);
      setShowTeamModal(false);
      setInviteCode('');
      alert('Successfully joined the team!');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to join team');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalizeTeam = async () => {
    if (!window.confirm('Are you sure you want to finalize the team? This action cannot be undone.')) {
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(`/teams/finalize/${userTeam._id}`);

      alert('Team finalized! All members have been registered for the event.');
      fetchEventDetails();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to finalize team');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    // For team events, redirect to team creation/joining
    if (event.isTeamEvent) {
      alert('This is a team event. Please create or join a team first.');
      return;
    }

    // Confirm registration
    const feeMessage = event.registrationFee > 0
      ? `This event has a registration fee of ₹${event.registrationFee}.`
      : 'This is a free event.';

    if (!window.confirm(`${feeMessage} Are you sure you want to register for ${event.name}?`)) {
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        formResponses: formResponses
      };

      // Add merchandise details if it's a merchandise event
      if (event.type === 'Merchandise') {
        payload.selectedSize = selectedSize;
        payload.selectedColor = selectedColor;
        payload.selectedVariant = selectedVariant;
        payload.quantity = purchaseQuantity;
      }

      const response = await axios.post(`/registrations/${id}`, payload);

      if (response.data.success) {
        alert('Registration successful! Redirecting to your ticket...');
        setIsRegistered(true);
        navigate(`/ticket/${response.data.data.ticketId}`);
      }
    } catch (error) {
      console.error("Registration error", error);
      alert(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading event details...</div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  const isDeadlinePassed = new Date() > new Date(event.registrationDeadline);
  const isLimitReached = event.registrationLimit && event.registrationCount >= event.registrationLimit;
  const canRegister = !isDeadlinePassed && !isLimitReached && !isRegistered;
  const isLeader = userTeam?.leader?._id === user?._id;
  const canFinalize = isLeader && !userTeam?.isFinalized && userTeam?.currentSize >= event.minTeamSize;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <button
          onClick={() => navigate('/browse-events')}
          className="mb-4 text-blue-600 hover:text-blue-800"
        >
          ← Back to Events
        </button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Event Header */}
          <div className="p-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.name}</h1>
                <p className="text-gray-600">
                  by {event.organizer?.organizerName || 'Unknown Organizer'}
                </p>
              </div>
              <div className="flex gap-2">
                {event.isTeamEvent && (
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                    Team Event ({event.minTeamSize}-{event.maxTeamSize} members)
                  </span>
                )}
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {event.type}
                </span>
              </div>
            </div>

            <p className="text-gray-700 text-lg mb-6">{event.description}</p>

            {/* Event Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Event Information</h3>
                <div className="space-y-2">
                  <div className="flex">
                    <span className="font-medium text-gray-700 w-40">Registration Fee:</span>
                    <span className="text-gray-900">₹{event.registrationFee || 0}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium text-gray-700 w-40">Eligibility:</span>
                    <span className="text-gray-900">{event.eligibility}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium text-gray-700 w-40">Registration Limit:</span>
                    <span className="text-gray-900">
                      {event.registrationLimit || 'Unlimited'}
                      {event.registrationLimit && ` (${event.registrationCount}/${event.registrationLimit} filled)`}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Important Dates</h3>
                <div className="space-y-2">
                  <div className="flex">
                    <span className="font-medium text-gray-700 w-40">Registration Deadline:</span>
                    <span className="text-gray-900">{new Date(event.registrationDeadline).toLocaleString()}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium text-gray-700 w-40">Event Start:</span>
                    <span className="text-gray-900">{new Date(event.startDate).toLocaleString()}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium text-gray-700 w-40">Event End:</span>
                    <span className="text-gray-900">{new Date(event.endDate).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="mb-8">
                <h3 className="font-semibold text-gray-900 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Team Section */}
            {event.isTeamEvent && user && user.role === 'participant' && (
              <div className="mb-8 p-6 bg-purple-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-4">Team Registration</h3>

                {userTeam ? (
                  <div>
                    <div className="bg-white p-4 rounded-lg mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-lg">{userTeam.name}</h4>
                        {userTeam.isFinalized ? (
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                            Finalized
                          </span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                            Forming ({userTeam.currentSize}/{event.maxTeamSize})
                          </span>
                        )}
                      </div>

                      {!userTeam.isFinalized && (
                        <div className="mb-3 p-3 bg-blue-50 rounded">
                          <p className="text-sm text-gray-700 mb-1">Invite Code:</p>
                          <p className="text-lg font-mono font-bold text-blue-600">{userTeam.inviteCode}</p>
                          <p className="text-xs text-gray-600 mt-1">Share this code with your teammates</p>
                        </div>
                      )}

                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Team Members:</p>
                        <div className="space-y-2">
                          {userTeam.members?.map((member, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span>{member.user?.name || 'Unknown'}</span>
                              <div className="flex items-center gap-2">
                                {member.user?._id === userTeam.leader._id && (
                                  <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs">
                                    Leader
                                  </span>
                                )}
                                <span className={`px-2 py-0.5 rounded text-xs ${member.status === 'Accepted'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                                  }`}>
                                  {member.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {canFinalize && (
                        <button
                          onClick={handleFinalizeTeam}
                          disabled={submitting}
                          className="w-full mt-4 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                        >
                          {submitting ? 'Finalizing...' : 'Finalize Team & Register'}
                        </button>
                      )}

                      {isLeader && !userTeam.isFinalized && userTeam.currentSize < event.minTeamSize && (
                        <p className="mt-3 text-sm text-yellow-700 text-center">
                          Need at least {event.minTeamSize - userTeam.currentSize} more member(s) to finalize
                        </p>
                      )}
                    </div>
                  </div>
                ) : canRegister ? (
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setTeamAction('create');
                        setShowTeamModal(true);
                      }}
                      className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition"
                    >
                      Create Team
                    </button>
                    <button
                      onClick={() => {
                        setTeamAction('join');
                        setShowTeamModal(true);
                      }}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
                    >
                      Join Team
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-600 text-center">
                    {isDeadlinePassed ? 'Registration deadline has passed' :
                      isLimitReached ? 'Registration limit reached' :
                        'You are already registered'}
                  </p>
                )}
              </div>
            )}

            {/* Custom Registration Form */}
            {!event.isTeamEvent && event.customForm?.fields?.length > 0 && user && user.role === 'participant' && canRegister && (
              <div className="mb-6 p-6 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-4">Registration Form</h3>
                <div className="space-y-4">
                  {event.customForm.fields.map((field, index) => {
                    const fieldName = field.fieldName || field.fieldLabel?.toLowerCase().replace(/\s+/g, '_') || `field_${index}`;
                    return (
                      <div key={index}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field.fieldLabel} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        {field.fieldType === 'text' && (
                          <input type="text" value={formResponses[fieldName] || ''} onChange={(e) => setFormResponses(prev => ({ ...prev, [fieldName]: e.target.value }))} required={field.required} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        )}
                        {field.fieldType === 'email' && (
                          <input type="email" value={formResponses[fieldName] || ''} onChange={(e) => setFormResponses(prev => ({ ...prev, [fieldName]: e.target.value }))} required={field.required} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        )}
                        {field.fieldType === 'number' && (
                          <input type="number" value={formResponses[fieldName] || ''} onChange={(e) => setFormResponses(prev => ({ ...prev, [fieldName]: e.target.value }))} required={field.required} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        )}
                        {field.fieldType === 'textarea' && (
                          <textarea value={formResponses[fieldName] || ''} onChange={(e) => setFormResponses(prev => ({ ...prev, [fieldName]: e.target.value }))} required={field.required} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        )}
                        {field.fieldType === 'select' && (
                          <select value={formResponses[fieldName] || ''} onChange={(e) => setFormResponses(prev => ({ ...prev, [fieldName]: e.target.value }))} required={field.required} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Select...</option>
                            {(field.options || []).map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                          </select>
                        )}
                        {field.fieldType === 'checkbox' && (
                          <label className="flex items-center">
                            <input type="checkbox" checked={formResponses[fieldName] || false} onChange={(e) => setFormResponses(prev => ({ ...prev, [fieldName]: e.target.checked }))} className="mr-2 h-4 w-4 text-blue-600" />
                            <span className="text-sm text-gray-700">Yes</span>
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Merchandise Selection */}
            {event.type === 'Merchandise' && user && user.role === 'participant' && canRegister && !event.isTeamEvent && (
              <div className="mb-6 p-6 bg-orange-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-4">🛍️ Select Merchandise Options</h3>
                <div className="space-y-4">
                  {/* Size Selection */}
                  {event.merchandise?.itemDetails?.sizes?.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Size *</label>
                      <div className="flex flex-wrap gap-2">
                        {event.merchandise.itemDetails.sizes.map(size => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setSelectedSize(size)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                              selectedSize === size
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Color Selection */}
                  {event.merchandise?.itemDetails?.colors?.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Color *</label>
                      <div className="flex flex-wrap gap-2">
                        {event.merchandise.itemDetails.colors.map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setSelectedColor(color)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                              selectedColor === color
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                            }`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Variant Selection */}
                  {event.merchandise?.itemDetails?.variants?.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Variant *</label>
                      <select
                        value={selectedVariant}
                        onChange={(e) => setSelectedVariant(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a variant...</option>
                        {event.merchandise.itemDetails.variants.map((v, i) => (
                          <option key={i} value={v.name}>
                            {v.name} — ₹{v.price} ({v.stock} in stock)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                    <input
                      type="number"
                      value={purchaseQuantity}
                      onChange={(e) => setPurchaseQuantity(Math.max(1, Math.min(parseInt(e.target.value) || 1, event.merchandise?.purchaseLimit || 5)))}
                      min="1"
                      max={event.merchandise?.purchaseLimit || 5}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-500 ml-2">Max: {event.merchandise?.purchaseLimit || 5} per person</span>
                  </div>

                  {/* Stock Info */}
                  <div className="text-sm text-gray-600">
                    {event.merchandise?.stockQuantity > 0
                      ? `${event.merchandise.stockQuantity} items in stock`
                      : 'Out of stock'}
                  </div>
                </div>
              </div>
            )}

            {/* Regular Registration Button */}
            {!event.isTeamEvent && user && user.role === 'participant' && canRegister && (
              <button
                onClick={handleRegister}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition text-lg font-semibold"
              >
                Register Now
              </button>
            )}

            {!event.isTeamEvent && isRegistered && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-green-800 font-semibold mb-3">✓ You are registered for this event</p>
                {registration && (
                  <button
                    onClick={() => navigate(`/ticket/${registration.ticketId}`)}
                    className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    View Your Ticket
                  </button>
                )}
              </div>
            )}

            {!user && (
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition text-lg font-semibold"
              >
                Login to Register
              </button>
            )}
          </div>

          {/* Discussion Forum */}
          {user && isRegistered && (
            <div className="border-t border-gray-200">
              {/* Add to Calendar Section */}
              <AddToCalendar event={event} />

              <DiscussionForum eventId={id} user={user} />
            </div>
          )}
        </div>

        {/* Team Modal */}
        {showTeamModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-6">
                {teamAction === 'create' ? 'Create Team' : 'Join Team'}
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}

              <form onSubmit={teamAction === 'create' ? handleCreateTeam : handleJoinTeam}>
                {teamAction === 'create' ? (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Team Name *
                    </label>
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                ) : (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Team Invite Code *
                    </label>
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      placeholder="TEAM-XXXXXXXX"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTeamModal(false);
                      setError('');
                      setTeamName('');
                      setInviteCode('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`flex-1 px-4 py-2 text-white rounded-lg transition ${teamAction === 'create'
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                      } disabled:opacity-50`}
                  >
                    {submitting ? 'Processing...' : teamAction === 'create' ? 'Create' : 'Join'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetails;
