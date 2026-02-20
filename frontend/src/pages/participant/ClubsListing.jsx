import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const ClubsListing = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [organizers, setOrganizers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [followedClubs, setFollowedClubs] = useState([]);
    const [actionLoading, setActionLoading] = useState(null);
    const [selectedOrganizer, setSelectedOrganizer] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    useEffect(() => {
        fetchOrganizers();
        if (user) {
            fetchFollowedClubs();
        }
    }, [user]);

    const fetchOrganizers = async () => {
        try {
            const response = await axios.get('/users/organizers');
            setOrganizers(response.data.data || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching organizers:', error);
            setLoading(false);
        }
    };

    const fetchFollowedClubs = async () => {
        try {
            const response = await axios.get('/users/profile');
            const clubs = response.data.data?.preferences?.followedClubs || [];
            setFollowedClubs(clubs.map(c => c._id || c));
        } catch (error) {
            console.error('Error fetching followed clubs:', error);
        }
    };

    const handleFollow = async (organizerId) => {
        if (!user) {
            navigate('/login');
            return;
        }

        setActionLoading(organizerId);
        try {
            await axios.post(`/users/follow/${organizerId}`);
            setFollowedClubs([...followedClubs, organizerId]);
        } catch (error) {
            console.error('Error following:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleUnfollow = async (organizerId) => {
        setActionLoading(organizerId);
        try {
            await axios.delete(`/users/follow/${organizerId}`);
            setFollowedClubs(followedClubs.filter(id => id !== organizerId));
        } catch (error) {
            console.error('Error unfollowing:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const fetchOrganizerDetails = async (organizerId) => {
        try {
            const response = await axios.get(`/users/organizers/${organizerId}`);
            setSelectedOrganizer(response.data.data);
        } catch (error) {
            console.error('Error fetching organizer details:', error);
        }
    };

    const isFollowing = (organizerId) => followedClubs.includes(organizerId);

    const categories = ['all', ...new Set(organizers.map(o => o.category).filter(Boolean))];

    const filteredOrganizers = organizers.filter(org => {
        const matchesSearch = org.organizerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            org.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || org.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="flex items-center justify-center h-96">
                    <div className="text-xl text-gray-600">Loading clubs...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Clubs & Organizers</h1>
                    <p className="text-gray-600 mt-1">Discover and follow clubs to stay updated on their events</p>
                </div>

                {/* Search & Filter */}
                <div className="bg-white rounded-xl shadow-md p-4 mb-8 flex flex-col md:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="Search clubs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>
                                {cat === 'all' ? 'All Categories' : cat}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Organizers Grid */}
                {filteredOrganizers.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        No clubs found matching your criteria.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredOrganizers.map((org) => (
                            <div key={org._id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900">{org.organizerName || 'Unnamed Club'}</h3>
                                        <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm mt-1">
                                            {org.category || 'General'}
                                        </span>
                                    </div>
                                    {isFollowing(org._id) && (
                                        <span className="text-green-600 text-sm font-medium">✓ Following</span>
                                    )}
                                </div>

                                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                                    {org.description || 'No description available.'}
                                </p>

                                {org.contactEmail && (
                                    <p className="text-sm text-gray-500 mb-4">
                                        📧 {org.contactEmail}
                                    </p>
                                )}

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => fetchOrganizerDetails(org._id)}
                                        className="flex-1 px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                                    >
                                        View Events
                                    </button>

                                    {user && (
                                        isFollowing(org._id) ? (
                                            <button
                                                onClick={() => handleUnfollow(org._id)}
                                                disabled={actionLoading === org._id}
                                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
                                            >
                                                {actionLoading === org._id ? '...' : 'Unfollow'}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleFollow(org._id)}
                                                disabled={actionLoading === org._id}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                            >
                                                {actionLoading === org._id ? '...' : 'Follow'}
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Organizer Detail Modal */}
                {selectedOrganizer && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            {selectedOrganizer.organizer?.organizerName}
                                        </h2>
                                        <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm mt-2">
                                            {selectedOrganizer.organizer?.category}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setSelectedOrganizer(null)}
                                        className="text-gray-500 hover:text-gray-700 text-2xl"
                                    >
                                        ×
                                    </button>
                                </div>

                                <p className="text-gray-600 mb-4">{selectedOrganizer.organizer?.description}</p>

                                {selectedOrganizer.organizer?.contactEmail && (
                                    <p className="text-sm text-gray-500 mb-6">
                                        📧 <a href={`mailto:${selectedOrganizer.organizer.contactEmail}`} className="text-indigo-600 hover:underline">
                                            {selectedOrganizer.organizer.contactEmail}
                                        </a>
                                    </p>
                                )}

                                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                    Events ({selectedOrganizer.eventCount || 0})
                                </h3>

                                {selectedOrganizer.events?.length > 0 ? (
                                    <div className="space-y-6">
                                        {/* Upcoming Events */}
                                        {(() => {
                                            const now = new Date();
                                            const upcoming = selectedOrganizer.events.filter(e => new Date(e.endDate || e.startDate) >= now);
                                            const past = selectedOrganizer.events.filter(e => new Date(e.endDate || e.startDate) < now);
                                            return (
                                                <>
                                                    {upcoming.length > 0 && (
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-green-700 mb-2">Upcoming</h4>
                                                            <div className="space-y-2">
                                                                {upcoming.map(event => (
                                                                    <div key={event._id} onClick={() => navigate(`/events/${event._id}`)} className="p-4 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors">
                                                                        <h4 className="font-medium text-gray-900">{event.name}</h4>
                                                                        <p className="text-sm text-gray-600 line-clamp-1">{event.description}</p>
                                                                        <div className="flex gap-4 mt-2 text-sm text-gray-500">
                                                                            <span>{event.type}</span>
                                                                            {event.registrationFee > 0 && <span>₹{event.registrationFee}</span>}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {past.length > 0 && (
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-gray-500 mb-2">Past Events</h4>
                                                            <div className="space-y-2">
                                                                {past.map(event => (
                                                                    <div key={event._id} onClick={() => navigate(`/events/${event._id}`)} className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors opacity-75">
                                                                        <h4 className="font-medium text-gray-700">{event.name}</h4>
                                                                        <div className="flex gap-4 mt-1 text-sm text-gray-400">
                                                                            <span>{event.type}</span>
                                                                            <span>{new Date(event.startDate).toLocaleDateString()}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-4">No published events yet.</p>
                                )}

                                <button
                                    onClick={() => setSelectedOrganizer(null)}
                                    className="mt-6 w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClubsListing;
