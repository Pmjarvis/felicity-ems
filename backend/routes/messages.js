const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { auth } = require('../middleware/auth');

// @route   GET /api/messages/event/:eventId
// @desc    Get all messages for an event
// @access  Registered participants and event organizer
router.get('/event/:eventId', auth, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user has access (organizer or registered participant)
    const isOrganizer = event.organizer.toString() === req.user._id.toString();
    let isRegistered = false;

    if (!isOrganizer) {
      const registration = await Registration.findOne({
        event: eventId,
        user: req.user._id
      });
      isRegistered = !!registration;
    }

    if (!isOrganizer && !isRegistered) {
      return res.status(403).json({
        success: false,
        message: 'You must be registered for this event to access the discussion forum'
      });
    }

    // Fetch messages
    const messages = await Message.find({
      event: eventId,
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
    res.status(500).json({
      success: false,
      message: 'Server error while fetching messages',
      error: error.message
    });
  }
});

module.exports = router;
