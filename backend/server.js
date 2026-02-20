const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Allowed origins for CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173'
].filter(Boolean);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin.startsWith(allowed) || allowed.includes(origin))) {
      return callback(null, true);
    }
    callback(null, true); // Allow all in production for now
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Socket.io Connection
const Message = require('./models/Message');

io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  // Join event discussion room
  socket.on('joinEventRoom', (eventId) => {
    socket.join(`event_${eventId}`);
    console.log(`User ${socket.id} joined event room: event_${eventId}`);
  });

  // Leave event discussion room
  socket.on('leaveEventRoom', (eventId) => {
    socket.leave(`event_${eventId}`);
    console.log(`User ${socket.id} left event room: event_${eventId}`);
  });

  // Send message to event discussion
  socket.on('sendMessage', async (data) => {
    try {
      const { eventId, message, userId, userRole } = data;
      
      // Save message to database
      const newMessage = await Message.create({
        event: eventId,
        sender: userId,
        senderRole: userRole,
        message: message
      });

      // Populate sender details
      await newMessage.populate('sender', 'name');

      // Broadcast to all users in the event room
      io.to(`event_${eventId}`).emit('newMessage', {
        _id: newMessage._id,
        message: newMessage.message,
        sender: newMessage.sender,
        senderRole: newMessage.senderRole,
        createdAt: newMessage.createdAt,
        isPinned: newMessage.isPinned
      });
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('messageError', { message: 'Failed to send message' });
    }
  });

  // Delete message (organizers only)
  socket.on('deleteMessage', async (data) => {
    try {
      const { messageId, eventId, userId } = data;
      
      const message = await Message.findById(messageId);
      if (message) {
        message.isDeleted = true;
        message.deletedBy = userId;
        message.deletedAt = new Date();
        await message.save();

        // Broadcast deletion to all users in the event room
        io.to(`event_${eventId}`).emit('messageDeleted', { messageId });
      }
    } catch (error) {
      console.error('Delete message error:', error);
    }
  });

  // Pin/Unpin message (organizers only)
  socket.on('togglePinMessage', async (data) => {
    try {
      const { messageId, eventId } = data;
      
      const message = await Message.findById(messageId);
      if (message) {
        message.isPinned = !message.isPinned;
        await message.save();

        // Broadcast pin status change
        io.to(`event_${eventId}`).emit('messagePinToggled', { 
          messageId, 
          isPinned: message.isPinned 
        });
      }
    } catch (error) {
      console.error('Toggle pin message error:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

// Import Routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const organizerRoutes = require('./routes/organizer');
const eventRoutes = require('./routes/events');
const userRoutes = require('./routes/users');
const teamRoutes = require('./routes/teams');
const ticketRoutes = require('./routes/tickets');
const messageRoutes = require('./routes/messages');
const registrationRoutes = require('./routes/registrations');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/organizer', organizerRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/registrations', registrationRoutes);

// Basic Routes
app.get('/', (req, res) => {
  res.json({ 
    message: '🎉 Felicity Event Management System API',
    status: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime()
  });
});

// Start Server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Socket.io server ready`);
  });
});

module.exports = { app, io };
