const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { auth } = require('../middleware/auth');
const { isOrganizer } = require('../middleware/checkRole');

// @route   POST /api/tickets/validate
// @desc    Validate ticket and mark attendance
// @access  Organizer only
router.post('/validate', auth, isOrganizer, async (req, res) => {
  try {
    const { ticketNumber, eventId } = req.body;

    if (!ticketNumber || !eventId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide ticket number and event ID'
      });
    }

    // Find event and verify organizer owns it
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to validate tickets for this event' });
    }

    // Find registration by ticketId (correct field name from Registration schema)
    const registration = await Registration.findOne({ ticketId: ticketNumber })
      .populate('user', 'name email')
      .populate('event', 'name')
      .populate('team', 'name');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
        validationStatus: 'invalid'
      });
    }

    // Verify ticket belongs to this event
    if (registration.event._id.toString() !== eventId) {
      return res.status(400).json({
        success: false,
        message: 'This ticket does not belong to this event',
        validationStatus: 'wrong_event'
      });
    }

    // Check if already attended
    if (registration.attendance && registration.attendance.marked) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this ticket',
        validationStatus: 'already_scanned',
        data: {
          participant: registration.user,
          team: registration.team,
          markedAt: registration.attendance.markedAt
        }
      });
    }

    // Check registration status
    if (registration.status !== 'Registered' && registration.status !== 'Attended') {
      return res.status(400).json({
        success: false,
        message: `Registration status is ${registration.status}`,
        validationStatus: 'invalid_status'
      });
    }

    // Mark attendance
    registration.attendance.marked = true;
    registration.attendance.markedAt = new Date();
    registration.attendance.markedBy = req.user._id;
    registration.attendance.scanCount = (registration.attendance.scanCount || 0) + 1;
    registration.attendance.scanHistory.push({
      scannedAt: new Date(),
      scannedBy: req.user._id,
      result: 'success'
    });
    registration.status = 'Attended';
    await registration.save();

    res.json({
      success: true,
      message: 'Attendance marked successfully',
      validationStatus: 'valid',
      data: {
        ticketNumber: registration.ticketId,
        participant: registration.user,
        team: registration.team,
        markedAt: registration.attendance.markedAt
      }
    });
  } catch (error) {
    console.error('Validate ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while validating ticket',
      error: error.message
    });
  }
});

// @route   GET /api/tickets/event/:eventId/attendance
// @desc    Get attendance report for an event
// @access  Organizer only
router.get('/event/:eventId/attendance', auth, isOrganizer, async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view attendance for this event' });
    }

    // Get all registrations for this event
    const registrations = await Registration.find({ event: eventId })
      .populate('user', 'name email')
      .populate('team', 'name')
      .sort({ 'attendance.markedAt': -1 });

    const totalRegistrations = registrations.length;
    const attended = registrations.filter(r => r.attendance && r.attendance.marked).length;
    const notAttended = totalRegistrations - attended;

    res.json({
      success: true,
      data: {
        statistics: {
          totalRegistrations,
          attended,
          notAttended,
          attendanceRate: totalRegistrations > 0 ? ((attended / totalRegistrations) * 100).toFixed(2) + '%' : '0%'
        },
        registrations: registrations.map(r => ({
          ticketNumber: r.ticketId,
          participant: r.user,
          team: r.team,
          registeredAt: r.createdAt,
          attendanceMarked: r.attendance?.marked || false,
          attendanceMarkedAt: r.attendance?.markedAt || null,
          registrationStatus: r.status
        }))
      }
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching attendance',
      error: error.message
    });
  }
});

module.exports = router;
