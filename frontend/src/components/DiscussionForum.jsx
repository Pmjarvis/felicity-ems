import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const DiscussionForum = ({ eventId, user }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
      newSocket.emit('joinEventRoom', eventId);
    });

    newSocket.on('newMessage', (message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('messageDeleted', ({ messageId }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    });

    newSocket.on('messagePinToggled', ({ messageId, isPinned }) => {
      setMessages(prev => prev.map(m => 
        m._id === messageId ? { ...m, isPinned } : m
      ));
    });

    setSocket(newSocket);

    // Fetch existing messages
    fetchMessages();

    return () => {
      newSocket.emit('leaveEventRoom', eventId);
      newSocket.disconnect();
    };
  }, [eventId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(
        `/messages/event/${eventId}`
      );
      setMessages(response.data.data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    socket.emit('sendMessage', {
      eventId,
      message: newMessage.trim(),
      userId: user._id,
      userRole: user.role
    });

    setNewMessage('');
  };

  const handleDeleteMessage = (messageId) => {
    if (!socket || user.role !== 'organizer') return;
    
    if (window.confirm('Are you sure you want to delete this message?')) {
      socket.emit('deleteMessage', {
        messageId,
        eventId,
        userId: user._id
      });
    }
  };

  const handleTogglePin = (messageId) => {
    if (!socket || user.role !== 'organizer') return;
    
    socket.emit('togglePinMessage', {
      messageId,
      eventId
    });
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Loading discussion...</p>
      </div>
    );
  }

  // Separate pinned and regular messages
  const pinnedMessages = messages.filter(m => m.isPinned);
  const regularMessages = messages.filter(m => !m.isPinned);

  return (
    <div className="bg-gray-50">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Discussion Forum</h2>
        
        {/* Messages Container */}
        <div className="bg-white rounded-lg shadow mb-4">
          <div className="h-96 overflow-y-auto p-4 space-y-3">
            {/* Pinned Messages */}
            {pinnedMessages.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Pinned Messages</p>
                {pinnedMessages.map((message) => (
                  <MessageItem
                    key={message._id}
                    message={message}
                    currentUser={user}
                    onDelete={handleDeleteMessage}
                    onTogglePin={handleTogglePin}
                  />
                ))}
                <div className="border-b border-gray-300 my-3"></div>
              </div>
            )}

            {/* Regular Messages */}
            {regularMessages.length === 0 && pinnedMessages.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No messages yet. Start the conversation!
              </p>
            ) : (
              regularMessages.map((message) => (
                <MessageItem
                  key={message._id}
                  message={message}
                  currentUser={user}
                  onDelete={handleDeleteMessage}
                  onTogglePin={handleTogglePin}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

const MessageItem = ({ message, currentUser, onDelete, onTogglePin }) => {
  const isOrganizer = currentUser.role === 'organizer';
  const isOwnMessage = message.sender?._id === currentUser._id;

  return (
    <div className={`p-3 rounded-lg ${
      message.isPinned ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
    } ${isOwnMessage ? 'ml-8' : 'mr-8'}`}>
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 text-sm">
            {message.sender?.name || 'Unknown'}
          </span>
          {message.senderRole === 'organizer' && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
              Organizer
            </span>
          )}
          {message.isPinned && (
            <span className="text-yellow-600 text-xs">📌 Pinned</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {new Date(message.createdAt).toLocaleTimeString()}
          </span>
          {isOrganizer && (
            <div className="flex gap-1">
              <button
                onClick={() => onTogglePin(message._id)}
                className="text-yellow-600 hover:text-yellow-700 text-xs"
                title={message.isPinned ? 'Unpin' : 'Pin'}
              >
                📌
              </button>
              <button
                onClick={() => onDelete(message._id)}
                className="text-red-600 hover:text-red-700 text-xs"
                title="Delete"
              >
                🗑️
              </button>
            </div>
          )}
        </div>
      </div>
      <p className="text-gray-700 text-sm whitespace-pre-wrap">{message.message}</p>
    </div>
  );
};

export default DiscussionForum;
