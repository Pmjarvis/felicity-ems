const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const PasswordReset = require('../models/PasswordReset');
const { auth } = require('../middleware/auth');
const { isOrganizer } = require('../middleware/checkRole');

// @route   GET /api/organizer/profile
// @desc    Get organizer profile
// @access  Organizer only
router.get('/profile', auth, isOrganizer, async (req, res) => {
  try {
    const organizer = await User.findById(req.user._id).select('-password');

    res.json({
      success: true,
      data: organizer
    });
  } catch (error) {
    console.error('Get organizer profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching profile',
      error: error.message 
    });
  }
});

// @route   PUT /api/organizer/profile
// @desc    Update organizer profile
// @access  Organizer only
router.put('/profile', auth, isOrganizer, async (req, res) => {
  try {
    const { 
      organizationName, 
      category, 
      description, 
      contactEmail, 
      contactNumber,
      discordWebhook 
    } = req.body;

    const organizer = await User.findById(req.user._id);

    if (!organizer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Organizer not found' 
      });
    }

    // Update fields
    if (organizationName) organizer.organizationName = organizationName;
    if (category) organizer.category = category;
    if (description) organizer.description = description;
    if (contactEmail) organizer.contactEmail = contactEmail;
    if (contactNumber) organizer.contactNumber = contactNumber;
    if (discordWebhook !== undefined) organizer.discordWebhook = discordWebhook;

    await organizer.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: organizer
    });
  } catch (error) {
    console.error('Update organizer profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating profile',
      error: error.message 
    });
  }
});

// @route   POST /api/organizer/request-password-reset
// @desc    Request password reset from admin
// @access  Organizer only
router.post('/request-password-reset', auth, isOrganizer, async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a reason (minimum 10 characters)' 
      });
    }

    // Check if there's already a pending request
    const existingRequest = await PasswordReset.findOne({
      organizer: req.user._id,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have a pending password reset request' 
      });
    }

    // Create password reset request
    const resetRequest = await PasswordReset.create({
      organizer: req.user._id,
      reason: reason.trim(),
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Password reset request submitted successfully. Admin will review it soon.',
      data: resetRequest
    });
  } catch (error) {
    console.error('Request password reset error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while submitting password reset request',
      error: error.message 
    });
  }
});

// @route   GET /api/organizer/stats
// @desc    Get organizer dashboard statistics
// @access  Organizer only
router.get('/stats', auth, isOrganizer, async (req, res) => {
  try {
    // Get all events by this organizer
    const events = await Event.find({ organizer: req.user._id });
    const eventIds = events.map(e => e._id);

    // Get registrations for these events
    const registrations = await Registration.find({ event: { $in: eventIds } });

    // Calculate stats
    const totalEvents = events.length;
    const totalRegistrations = registrations.length;
    const totalRevenue = registrations
      .filter(r => r.paymentStatus === 'successful')
      .reduce((sum, r) => sum + (r.amountPaid || 0), 0);
    const totalAttendance = registrations.filter(r => r.attended).length;

    res.json({
      success: true,
      data: {
        totalEvents,
        totalRegistrations,
        totalRevenue,
        totalAttendance,
        events: events.map(e => ({
          id: e._id,
          name: e.name,
          status: e.status,
          registrationCount: registrations.filter(r => r.event.toString() === e._id.toString()).length
        }))
      }
    });
  } catch (error) {
    console.error('Get organizer stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching statistics',
      error: error.message 
    });
  }
});

module.exports = router;
