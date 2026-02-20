import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const BrowseEvents = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [trendingEvents, setTrendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    eventType: 'all',
    eligibility: 'all',
    dateFrom: '',
    dateTo: '',
    followedOnly: false
  });

  useEffect(() => {
    fetchEvents();
    fetchTrending();
  }, [filters]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = {
        eventType: filters.eventType,
        eligibility: filters.eligibility,
        search: search || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        followedOnly: filters.followedOnly || undefined
      };
      const response = await axios.get('/events', { params });
      setEvents(response.data.data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrending = async () => {
    try {
      const response = await axios.get('/events', { params: { trending: 'true' } });
      setTrendingEvents(response.data.data || []);
    } catch (error) {
      console.error('Error fetching trending:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Browse Events</h1>
          <p className="mt-2 text-gray-600">Discover and register for exciting events</p>
        </div>

        {/* Trending Events */}
        {trendingEvents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🔥 Trending Now</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {trendingEvents.map((event) => (
                <div
                  key={event._id}
                  onClick={() => navigate(`/events/${event._id}`)}
                  className="min-w-[260px] bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition"
                >
                  <h4 className="font-semibold text-gray-900 mb-1 truncate">{event.name}</h4>
                  <p className="text-xs text-gray-600">{event.organizer?.organizerName}</p>
                  <p className="text-xs text-orange-600 mt-1">{event.views || 0} views</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events or organizers..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Type
                </label>
                <select
                  value={filters.eventType}
                  onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="Normal">Normal Events</option>
                  <option value="Merchandise">Merchandise</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Eligibility
                </label>
                <select
                  value={filters.eligibility}
                  onChange={(e) => setFilters({ ...filters, eligibility: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="All">Everyone</option>
                  <option value="IIIT Only">IIIT Only</option>
                  <option value="Non-IIIT Only">Non-IIIT Only</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Date range + followed clubs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {user && (
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.followedOnly}
                      onChange={(e) => setFilters({ ...filters, followedOnly: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Followed Clubs Only</span>
                  </label>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No events found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event._id}
                onClick={() => navigate(`/events/${event._id}`)}
                className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-900 flex-1">
                      {event.name}
                    </h3>
                    {event.isTeamEvent && (
                      <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                        Team Event
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {event.description}
                  </p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-700">
                      <span className="font-medium w-24">Organizer:</span>
                      <span>{event.organizer?.organizerName || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <span className="font-medium w-24">Type:</span>
                      <span>{event.type}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <span className="font-medium w-24">Fee:</span>
                      <span>₹{event.registrationFee || 0}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <span className="font-medium w-24">Deadline:</span>
                      <span>{new Date(event.registrationDeadline).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {event.tags && event.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {event.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default BrowseEvents;
