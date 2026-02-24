const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { auth } = require('../middleware/auth');

// Helper: check if user has access to event forum
async function checkForumAccess(eventId, user) {
  const event = await Event.findById(eventId);
  if (!event) return { allowed: false, status: 404, msg: 'Event not found', event: null };
  
  const isOrganizer = event.organizer.toString() === user._id.toString();
  let isRegistered = false;
  if (!isOrganizer) {
    const reg = await Registration.findOne({ event: eventId, user: user._id });
    isRegistered = !!reg;
  }
  
  if (!isOrganizer && !isRegistered)
    return { allowed: false, status: 403, msg: 'You must be registered for this event to access the discussion forum', event };
  
  return { allowed: true, isOrganizer, event };
}

// @route   GET /api/messages/event/:eventId
// @desc    Get all messages for an event
// @access  Registered participants and event organizer
router.get('/event/:eventId', auth, async (req, res) => {
  try {
    const access = await checkForumAccess(req.params.eventId, req.user);
    if (!access.allowed) return res.status(access.status).json({ success: false, message: access.msg });

    const messages = await Message.find({
      event: req.params.eventId,
      isDeleted: false
    })
      .populate('sender', 'name')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching messages', error: error.message });
  }
});

// @route   POST /api/messages/event/:eventId
// @desc    Post a message to event discussion forum
// @access  Registered participants and event organizer
router.post('/event/:eventId', auth, async (req, res) => {
  try {
    const access = await checkForumAccess(req.params.eventId, req.user);
    if (!access.allowed) return res.status(access.status).json({ success: false, message: access.msg });

    const { message, parentMessage } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const msgData = {
      event: req.params.eventId,
      sender: req.user._id,
      senderRole: access.isOrganizer ? 'organizer' : 'participant',
      message: message.trim()
    };
    if (parentMessage) msgData.parentMessage = parentMessage;

    const newMessage = await Message.create(msgData);
    await newMessage.populate('sender', 'name');

    // Broadcast via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`event_${req.params.eventId}`).emit('newMessage', {
        _id: newMessage._id,
        message: newMessage.message,
        sender: newMessage.sender,
        senderRole: newMessage.senderRole,
        createdAt: newMessage.createdAt,
        isPinned: newMessage.isPinned,
        parentMessage: newMessage.parentMessage,
        reactions: newMessage.reactions
      });
    }

    res.status(201).json({
      success: true,
      message: 'Message posted successfully',
      data: newMessage
    });
  } catch (error) {
    console.error('Post message error:', error);
    res.status(500).json({ success: false, message: 'Server error while posting message', error: error.message });
  }
});

// @route   DELETE /api/messages/:messageId
// @desc    Delete a message (organizer moderation)
// @access  Organizer of the event only
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    const event = await Event.findById(message.event);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const isOrganizer = event.organizer.toString() === req.user._id.toString();
    const isOwnMessage = message.sender.toString() === req.user._id.toString();

    if (!isOrganizer && !isOwnMessage) {
      return res.status(403).json({ success: false, message: 'Only the organizer or the message author can delete messages' });
    }

    message.isDeleted = true;
    message.deletedBy = req.user._id;
    message.deletedAt = new Date();
    await message.save();

    // Broadcast via Socket.IO
    const io = req.app.get('io');
    if (io) io.to(`event_${message.event}`).emit('messageDeleted', { messageId: message._id });

    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting message', error: error.message });
  }
});

// @route   PUT /api/messages/:messageId/pin
// @desc    Toggle pin/unpin a message (organizer moderation)
// @access  Organizer of the event only
router.put('/:messageId/pin', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    const event = await Event.findById(message.event);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the event organizer can pin/unpin messages' });
    }

    message.isPinned = !message.isPinned;
    await message.save();

    const io = req.app.get('io');
    if (io) io.to(`event_${message.event}`).emit('messagePinToggled', { messageId: message._id, isPinned: message.isPinned });

    res.json({
      success: true,
      message: message.isPinned ? 'Message pinned' : 'Message unpinned',
      data: { isPinned: message.isPinned }
    });
  } catch (error) {
    console.error('Toggle pin error:', error);
    res.status(500).json({ success: false, message: 'Server error while toggling pin', error: error.message });
  }
});

// @route   POST /api/messages/:messageId/react
// @desc    Add a reaction to a message
// @access  Registered participants and event organizer
router.post('/:messageId/react', auth, async (req, res) => {
  try {
    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ success: false, message: 'Emoji is required' });

    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    const access = await checkForumAccess(message.event, req.user);
    if (!access.allowed) return res.status(access.status).json({ success: false, message: access.msg });

    // Check if user already reacted with this emoji
    const existingIdx = message.reactions.findIndex(
      r => r.emoji === emoji && r.user.toString() === req.user._id.toString()
    );

    if (existingIdx >= 0) {
      // Remove reaction (toggle off)
      message.reactions.splice(existingIdx, 1);
    } else {
      // Add reaction
      message.reactions.push({ emoji, user: req.user._id });
    }

    await message.save();

    const io = req.app.get('io');
    if (io) io.to(`event_${message.event}`).emit('messageReacted', { messageId: message._id, reactions: message.reactions });

    res.json({
      success: true,
      message: existingIdx >= 0 ? 'Reaction removed' : 'Reaction added',
      data: { reactions: message.reactions }
    });
  } catch (error) {
    console.error('React to message error:', error);
    res.status(500).json({ success: false, message: 'Server error while reacting to message', error: error.message });
  }
});

module.exports = router;
