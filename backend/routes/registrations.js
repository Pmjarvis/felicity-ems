const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { isParticipant, isOrganizer } = require('../middleware/checkRole');
const { sendRegistrationEmail } = require('../utils/emailService');

// @route   POST /api/registrations/:eventId
// @desc    Register for an event (individual/normal)
// @access  Participant only
router.post('/:eventId', auth, isParticipant, async (req, res) => {
  try {
    const body = req.body || {};
    const event = await Event.findById(req.params.eventId).populate('organizer', 'organizerName email contactEmail');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if event is published
    if (event.status !== 'Published' && event.status !== 'Ongoing') {
      return res.status(400).json({ success: false, message: 'Event is not open for registration' });
    }

    // Check eligibility
    const participant = await User.findById(req.user._id);
    if (event.eligibility === 'IIIT Only' && participant.participantType !== 'IIIT') {
      return res.status(403).json({ success: false, message: 'This event is for IIIT students only' });
    }
    if (event.eligibility === 'Non-IIIT Only' && participant.participantType !== 'Non-IIIT') {
      return res.status(403).json({ success: false, message: 'This event is for Non-IIIT participants only' });
    }

    // Check deadline
    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ success: false, message: 'Registration deadline has passed' });
    }

    // Check registration limit
    if (event.registrationLimit && event.registrationCount >= event.registrationLimit) {
      return res.status(400).json({ success: false, message: 'Registration limit reached' });
    }

    // Check if team event
    if (event.isTeamEvent) {
      return res.status(400).json({ success: false, message: 'This is a team event. Please use team registration.' });
    }

    // Check for duplicate registration
    const existing = await Registration.findOne({ event: event._id, user: req.user._id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You are already registered for this event' });
    }

    // Handle merchandise purchase
    let merchandiseDetails = {};
    if (event.type === 'Merchandise') {
      // Support both naming conventions (selectedSize or size)
      const size = body.selectedSize || body.size;
      const color = body.selectedColor || body.color;
      const variant = body.selectedVariant || body.variant;
      const quantity = body.quantity;
      
      // Check stock
      if (event.merchandise && event.merchandise.stockQuantity !== undefined) {
        const qty = quantity || 1;
        if (event.merchandise.stockQuantity < qty) {
          return res.status(400).json({ success: false, message: 'Insufficient stock available' });
        }
        // Check purchase limit
        if (event.merchandise.purchaseLimit && qty > event.merchandise.purchaseLimit) {
          return res.status(400).json({ 
            success: false, 
            message: `Maximum purchase limit is ${event.merchandise.purchaseLimit} per participant` 
          });
        }
        // Decrement stock
        event.merchandise.stockQuantity -= qty;
        await event.save();
      }
      merchandiseDetails = { size, color, variant, quantity: quantity || 1 };
    }

    // Create registration
    const registration = await Registration.create({
      event: event._id,
      user: req.user._id,
      status: 'Registered',
      payment: {
        amount: event.registrationFee || 0,
        status: event.registrationFee > 0 ? 'Pending' : 'Completed'
      },
      formResponses: body.formResponses || {},
      merchandiseDetails: event.type === 'Merchandise' ? merchandiseDetails : undefined
    });

    // Increment registration count
    event.registrationCount = (event.registrationCount || 0) + 1;
    // Lock custom form after first registration
    if (event.registrationCount === 1 && event.customForm && !event.customForm.isLocked) {
      event.customForm.isLocked = true;
    }
    await event.save();

    // Send confirmation email (async, don't block)
    sendRegistrationEmail(
      req.user.email,
      req.user.name,
      {
        name: event.name,
        organizerName: event.organizer?.organizationName || 'Organizer',
        organizerEmail: event.organizer?.contactEmail || event.organizer?.email || '',
        startDate: event.startDate,
        venue: event.venue || 'TBA',
        registrationFee: event.registrationFee
      },
      registration.ticketId
    ).catch(err => console.error('Email send error:', err.message));

    // Populate and return
    const populatedReg = await Registration.findById(registration._id)
      .populate('event', 'name type startDate endDate venue')
      .populate('user', 'name email');

    res.status(201).json({
      success: true,
      message: 'Registration successful! Your ticket has been generated.',
      data: populatedReg
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'You are already registered for this event' });
    }
    res.status(500).json({ success: false, message: 'Server error during registration', error: error.message });
  }
});

// @route   GET /api/registrations/my-registrations
// @desc    Get current user's registrations
// @access  Participant only
router.get('/my-registrations', auth, isParticipant, async (req, res) => {
  try {
    const { status, eventType } = req.query;
    
    let query = { user: req.user._id };
    if (status) query.status = status;

    let registrations = await Registration.find(query)
      .populate({
        path: 'event',
        select: 'name type startDate endDate organizer status registrationFee venue',
        populate: { path: 'organizer', select: 'organizerName email' }
      })
      .populate('team', 'name')
      .sort({ createdAt: -1 });

    // Filter by event type if specified
    if (eventType) {
      registrations = registrations.filter(r => r.event && r.event.type === eventType);
    }

    res.json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/registrations/event/:eventId
// @desc    Get all registrations for an event (organizer/admin)
// @access  Organizer only
router.get('/event/:eventId', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Must be the organizer of this event or admin
    if (req.user.role === 'organizer' && event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (req.user.role === 'participant') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { search, status, attendance } = req.query;
    let query = { event: req.params.eventId };
    if (status) query.status = status;
    if (attendance === 'attended') query['attendance.marked'] = true;
    if (attendance === 'not-attended') query['attendance.marked'] = { $ne: true };

    let registrations = await Registration.find(query)
      .populate('user', 'name email contact collegeName participantType')
      .populate('team', 'name')
      .sort({ createdAt: -1 });

    // Search by name or email
    if (search) {
      const s = search.toLowerCase();
      registrations = registrations.filter(r => 
        r.user && (
          r.user.name.toLowerCase().includes(s) ||
          r.user.email.toLowerCase().includes(s)
        )
      );
    }

    res.json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    console.error('Get event registrations error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/registrations/event/:eventId/export
// @desc    Export registrations as CSV
// @access  Organizer only
router.get('/event/:eventId/export', auth, isOrganizer, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const registrations = await Registration.find({ event: req.params.eventId })
      .populate('user', 'name email contact collegeName participantType')
      .populate('team', 'name')
      .sort({ createdAt: -1 });

    // Build CSV
    const headers = ['S.No', 'Name', 'Email', 'Contact', 'College', 'Type', 'Registration Date', 'Payment Status', 'Payment Amount', 'Team', 'Ticket ID', 'Attendance', 'Attendance Time'];
    const rows = registrations.map((r, i) => [
      i + 1,
      r.user?.name || 'N/A',
      r.user?.email || 'N/A',
      r.user?.contact || 'N/A',
      r.user?.collegeName || 'N/A',
      r.user?.participantType || 'N/A',
      new Date(r.createdAt).toLocaleDateString(),
      r.payment?.status || 'N/A',
      r.payment?.amount || 0,
      r.team?.name || 'Individual',
      r.ticketId || 'N/A',
      r.attendance?.marked ? 'Yes' : 'No',
      r.attendance?.markedAt ? new Date(r.attendance.markedAt).toLocaleString() : 'N/A'
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${event.name.replace(/[^a-z0-9]/gi, '_')}_registrations.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/registrations/:id/cancel
// @desc    Cancel a registration
// @access  Participant only
router.put('/:id/cancel', auth, isParticipant, async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id).populate('event');
    if (!registration) return res.status(404).json({ success: false, message: 'Registration not found' });
    if (registration.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (registration.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Already cancelled' });
    }

    registration.status = 'Cancelled';
    registration.cancellationDate = new Date();
    registration.cancellationReason = req.body.reason || 'Cancelled by participant';
    await registration.save();

    // Decrement event registration count
    await Event.findByIdAndUpdate(registration.event._id, { $inc: { registrationCount: -1 } });

    res.json({ success: true, message: 'Registration cancelled', data: registration });
  } catch (error) {
    console.error('Cancel registration error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/registrations/:ticketId/ticket
// @desc    Get ticket details by ticket ID
// @access  Authenticated
router.get('/:ticketId/ticket', auth, async (req, res) => {
  try {
    const registration = await Registration.findOne({ ticketId: req.params.ticketId })
      .populate({
        path: 'event',
        select: 'name type startDate endDate venue organizer registrationFee',
        populate: { path: 'organizer', select: 'organizerName' }
      })
      .populate('user', 'name email contact collegeName')
      .populate('team', 'name');

    if (!registration) return res.status(404).json({ success: false, message: 'Ticket not found' });

    res.json({ success: true, data: registration });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
