const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Registration = require('../models/Registration');
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
      type,
      isTeamEvent,
      minTeamSize,
      maxTeamSize,
      eligibility,
      registrationDeadline,
      startDate,
      endDate,
      registrationLimit,
      registrationFee,
      tags,
      customForm,
      merchandise
    } = req.body;

    // Validation
    if (!name || !description || !type) {
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
      type,
      organizer: req.user._id,
      isTeamEvent: isTeamEvent || false,
      eligibility: eligibility || 'All',
      registrationDeadline,
      startDate,
      endDate,
      registrationLimit: registrationLimit || null,
      registrationFee: registrationFee || 0,
      tags: tags || [],
      status: 'Draft'
    };

    // Add team-specific fields
    if (isTeamEvent) {
      eventData.minTeamSize = minTeamSize;
      eventData.maxTeamSize = maxTeamSize;
    }

    // Add custom form if provided
    if (customForm && Array.isArray(customForm) && customForm.length > 0) {
      eventData.customForm = {
        fields: customForm.map((field, index) => ({
          fieldType: field.fieldType || 'text',
          fieldLabel: field.label || field.fieldLabel || `Field ${index + 1}`,
          fieldName: field.fieldName || field.label?.toLowerCase().replace(/\s+/g, '_') || `field_${index}`,
          options: field.options || [],
          required: field.required || false,
          order: index
        })),
        isLocked: false
      };
    }

    // Add merchandise details if it's a merchandise event
    if (type === 'Merchandise' && merchandise) {
      eventData.merchandise = merchandise;
    }

    const event = await Event.create(eventData);

    // Populate organizer details
    await event.populate('organizer', 'organizerName email');

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
      tags,
      dateFrom,
      dateTo,
      followedOnly,
      trending
    } = req.query;

    // Build query
    let query = { status: 'Published' }; // Only show published events to public

    // Search by name or organizer
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const organizerIds = await User.find({
        organizerName: { $regex: escapedSearch, $options: 'i' }
      }).select('_id');

      query.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { description: { $regex: escapedSearch, $options: 'i' } },
        { organizer: { $in: organizerIds.map(o => o._id) } }
      ];
    }

    // Filter by event type
    if (eventType && eventType !== 'all') {
      query.type = eventType;
    }

    // Filter by eligibility
    if (eligibility && eligibility !== 'all') {
      query.eligibility = eligibility;
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

    // Date range filter
    if (dateFrom || dateTo) {
      query.startDate = {};
      if (dateFrom) query.startDate.$gte = new Date(dateFrom);
      if (dateTo) query.startDate.$lte = new Date(dateTo);
    }

    // Followed clubs only — requires auth token
    if (followedOnly === 'true' && req.headers.authorization) {
      try {
        const jwt = require('jsonwebtoken');
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const currentUser = await User.findById(decoded.id).select('preferences');
        if (currentUser?.preferences?.followedClubs?.length > 0) {
          query.organizer = { $in: currentUser.preferences.followedClubs };
        }
      } catch (e) { /* ignore auth errors for public route */ }
    }

    // Trending: top 5 by views in last 24h
    if (trending === 'true') {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const trendingEvents = await Event.find({ ...query, updatedAt: { $gte: oneDayAgo } })
        .populate('organizer', 'organizerName category email')
        .sort({ views: -1 })
        .limit(5);
      return res.json({ success: true, count: trendingEvents.length, data: trendingEvents });
    }

    let events = await Event.find(query)
      .populate('organizer', 'organizerName category email')
      .sort({ createdAt: -1 });

    // Preference-based sorting if user is authenticated
    if (req.headers.authorization) {
      try {
        const jwt = require('jsonwebtoken');
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const currentUser = await User.findById(decoded.id).select('preferences');
        if (currentUser?.preferences) {
          const interests = currentUser.preferences.interests || [];
          const followedClubs = (currentUser.preferences.followedClubs || []).map(id => id.toString());
          // Score each event: followed club +2, matching tag +1
          events = events.map(e => {
            let score = 0;
            if (followedClubs.includes(e.organizer?._id?.toString())) score += 2;
            if (e.tags?.some(tag => interests.map(i => i.toLowerCase()).includes(tag.toLowerCase()))) score += 1;
            return { ...e.toObject(), _relevanceScore: score };
          });
          events.sort((a, b) => b._relevanceScore - a._relevanceScore || new Date(b.createdAt) - new Date(a.createdAt));
        }
      } catch (e) { /* ignore auth errors */ }
    }

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
      // Normalize status to capitalized form (e.g., 'draft' -> 'Draft')
      const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
      query.status = normalizedStatus;
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
      .populate('organizer', 'organizerName category description contactEmail');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Increment view count (fire-and-forget)
    Event.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }).catch(() => {});

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
    const previousStatus = event.status;

    // Form lock: prevent custom form edits if any registrations exist
    if (req.body.customForm && event.customForm?.isLocked) {
      return res.status(400).json({
        success: false,
        message: 'Custom form is locked — registrations have already been received'
      });
    }

    // Handle status-based editing restrictions
    if (event.status === 'Draft') {
      // Draft: Allow all edits except protected fields
      const allowedDraftFields = ['name', 'description', 'type', 'isTeamEvent', 'minTeamSize', 'maxTeamSize',
        'eligibility', 'registrationDeadline', 'startDate', 'endDate', 'registrationLimit',
        'registrationFee', 'tags', 'customForm', 'merchandise', 'status', 'venue', 'bannerImage'];
      allowedDraftFields.forEach(field => {
        if (req.body[field] !== undefined) {
          event[field] = req.body[field];
        }
      });
    } else if (event.status === 'Published') {
      // Published: Allow limited edits
      const allowedFields = ['description', 'registrationDeadline', 'registrationLimit', 'status'];
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          event[field] = req.body[field];
        }
      });
    } else if (event.status === 'Ongoing' || event.status === 'Completed') {
      // Ongoing/Completed: Only allow status change
      if (status) {
        event.status = status;
      }
    }

    await event.save();

    // Discord webhook auto-post on publish
    if (previousStatus === 'Draft' && event.status === 'Published') {
      try {
        const organizerUser = await User.findById(event.organizer);
        if (organizerUser?.discordWebhook) {
          const https = require('https');
          const url = new URL(organizerUser.discordWebhook);
          const payload = JSON.stringify({
            embeds: [{
              title: `🎉 New Event: ${event.name}`,
              description: event.description?.substring(0, 200) || '',
              color: 0x5865F2,
              fields: [
                { name: 'Type', value: event.type, inline: true },
                { name: 'Fee', value: `₹${event.registrationFee || 0}`, inline: true },
                { name: 'Deadline', value: event.registrationDeadline ? new Date(event.registrationDeadline).toLocaleDateString() : 'N/A', inline: true }
              ],
              footer: { text: `Organized by ${organizerUser.organizerName}` }
            }]
          });
          const options = { hostname: url.hostname, path: url.pathname, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } };
          const req2 = https.request(options);
          req2.write(payload);
          req2.end();
        }
      } catch (webhookErr) { console.error('Discord webhook error:', webhookErr.message); }
    }

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
    if (event.status !== 'Draft') {
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
