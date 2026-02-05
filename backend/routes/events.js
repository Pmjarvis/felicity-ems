const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { isOrganizer, isAdmin } = require('../middleware/checkRole');

// @route   POST /api/events
// @desc    Create new event
// @access  Organizer only
router.post('/', auth, isOrganizer, async (req, res) => {
  try {
    const {
      name,
      description,
      eventType,
      isTeamEvent,
      minTeamSize,
      maxTeamSize,
      eligibility,
      registrationDeadline,
      eventStartDate,
      eventEndDate,
      registrationLimit,
      registrationFee,
      tags,
      customForm,
      merchandise
    } = req.body;

    // Validation
    if (!name || !description || !eventType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide event name, description, and type' 
      });
    }

    // Validate team event settings
    if (isTeamEvent && (!minTeamSize || !maxTeamSize)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Team events must have minimum and maximum team sizes' 
      });
    }

    // Create event
    const eventData = {
      name,
      description,
      eventType,
      organizer: req.user._id,
      isTeamEvent: isTeamEvent || false,
      eligibility: eligibility || ['All'],
      registrationDeadline,
      eventStartDate,
      eventEndDate,
      registrationLimit: registrationLimit || null,
      registrationFee: registrationFee || 0,
      tags: tags || [],
      status: 'draft' // Always start as draft
    };

    // Add team-specific fields
    if (isTeamEvent) {
      eventData.minTeamSize = minTeamSize;
      eventData.maxTeamSize = maxTeamSize;
    }

    // Add custom form if provided
    if (customForm && Array.isArray(customForm)) {
      eventData.customForm = customForm;
    }

    // Add merchandise details if it's a merchandise event
    if (eventType === 'Merchandise' && merchandise) {
      eventData.merchandise = merchandise;
    }

    const event = await Event.create(eventData);

    // Populate organizer details
    await event.populate('organizer', 'organizationName email');

    res.status(201).json({
      success: true,
      message: 'Event created successfully as draft',
      data: event
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while creating event',
      error: error.message 
    });
  }
});

// @route   GET /api/events
// @desc    Get all events (with filters for participants)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      eventType, 
      eligibility, 
      status,
      organizer,
      tags
    } = req.query;

    // Build query
    let query = { status: 'published' }; // Only show published events to public

    // Search by name or organizer
    if (search) {
      const organizerIds = await User.find({
        organizationName: { $regex: search, $options: 'i' }
      }).select('_id');
      
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { organizer: { $in: organizerIds.map(o => o._id) } }
      ];
    }

    // Filter by event type
    if (eventType && eventType !== 'all') {
      query.eventType = eventType;
    }

    // Filter by eligibility
    if (eligibility && eligibility !== 'all') {
      query.eligibility = { $in: [eligibility] };
    }

    // Filter by organizer
    if (organizer) {
      query.organizer = organizer;
    }

    // Filter by tags
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    const events = await Event.find(query)
      .populate('organizer', 'organizationName category email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching events',
      error: error.message 
    });
  }
});

// @route   GET /api/events/organizer/my-events
// @desc    Get organizer's events
// @access  Organizer only
router.get('/organizer/my-events', auth, isOrganizer, async (req, res) => {
  try {
    const { status } = req.query;

    let query = { organizer: req.user._id };

    if (status && status !== 'all') {
      query.status = status;
    }

    const events = await Event.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('Get my events error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching events',
      error: error.message 
    });
  }
});

// @route   GET /api/events/:id
// @desc    Get single event details
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'organizationName category description contactEmail');

    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found' 
      });
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching event',
      error: error.message 
    });
  }
});

// @route   PUT /api/events/:id
// @desc    Update event (with status-based restrictions)
// @access  Organizer only (owner of the event)
router.put('/:id', auth, isOrganizer, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found' 
      });
    }

    // Check if user is the organizer of this event
    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not authorized to edit this event' 
      });
    }

    const { status } = req.body;

    // Handle status-based editing restrictions
    if (event.status === 'draft') {
      // Draft: Allow all edits
      Object.keys(req.body).forEach(key => {
        if (key !== '_id' && key !== 'organizer' && key !== 'createdAt') {
          event[key] = req.body[key];
        }
      });
    } else if (event.status === 'published') {
      // Published: Allow limited edits
      const allowedFields = ['description', 'registrationDeadline', 'registrationLimit', 'status'];
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          event[field] = req.body[field];
        }
      });
    } else if (event.status === 'ongoing' || event.status === 'completed') {
      // Ongoing/Completed: Only allow status change
      if (status) {
        event.status = status;
      }
    }

    await event.save();

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating event',
      error: error.message 
    });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete event (only if draft or no registrations)
// @access  Organizer only (owner of the event)
router.delete('/:id', auth, isOrganizer, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found' 
      });
    }

    // Check if user is the organizer of this event
    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not authorized to delete this event' 
      });
    }

    // Only allow deletion of draft events
    if (event.status !== 'draft') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete published events. You can close them instead.' 
      });
    }

    await event.deleteOne();

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while deleting event',
      error: error.message 
    });
  }
});

module.exports = router;
