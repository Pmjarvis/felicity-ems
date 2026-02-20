const express = require('express');
const router = express.Router();
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const Event = require('../models/Event');
const { auth } = require('../middleware/auth');
const { isAdmin } = require('../middleware/checkRole');
const { sendOrganizerWelcomeEmail, sendPasswordResetStatusEmail } = require('../utils/emailService');
const crypto = require('crypto');

// Generate random password
const generatePassword = () => {
  return crypto.randomBytes(6).toString('hex'); // 12 character password
};

// @route   POST /api/admin/organizers
// @desc    Create new organizer account
// @access  Admin only
router.post('/organizers', auth, isAdmin, async (req, res) => {
  try {
    const { name, category, description, contactEmail, contactNumber } = req.body;

    // Validation
    if (!name || !category || !contactEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, category, and contact email'
      });
    }

    // Check if organizer with this contact email already exists
    const existingUser = await User.findOne({ email: contactEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    // Generate login credentials
    const loginEmail = contactEmail;
    const generatedPassword = generatePassword();

    // Create organizer account
    const organizer = await User.create({
      name: name, // Required for all users
      email: loginEmail,
      password: generatedPassword,
      role: 'organizer',
      contact: contactNumber || '',
      organizerName: name, // Organizer-specific field
      category,
      description: description || '',
      contactEmail
    });

    // Send welcome email with credentials
    await sendOrganizerWelcomeEmail(loginEmail, name, generatedPassword);

    // Return organizer data with plain password (only time it's shown)
    res.status(201).json({
      success: true,
      message: 'Organizer account created successfully',
      data: {
        id: organizer._id,
        name,
        email: loginEmail,
        password: generatedPassword, // Send plain password for admin to share
        category,
        contactEmail,
        createdAt: organizer.createdAt
      }
    });
  } catch (error) {
    console.error('Create organizer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating organizer',
      error: error.message
    });
  }
});

// @route   GET /api/admin/organizers
// @desc    Get all organizers
// @access  Admin only
router.get('/organizers', auth, isAdmin, async (req, res) => {
  try {
    const organizers = await User.find({ role: 'organizer' })
      .select('-password')
      .sort({ createdAt: -1 });

    // Get event count for each organizer
    const organizersWithStats = await Promise.all(
      organizers.map(async (organizer) => {
        const eventCount = await Event.countDocuments({ organizer: organizer._id });
        return {
          ...organizer.toObject(),
          eventCount
        };
      })
    );

    res.json({
      success: true,
      count: organizersWithStats.length,
      data: organizersWithStats
    });
  } catch (error) {
    console.error('Get organizers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching organizers',
      error: error.message
    });
  }
});

// @route   DELETE /api/admin/organizers/:id
// @desc    Delete/disable organizer account
// @access  Admin only
router.delete('/organizers/:id', auth, isAdmin, async (req, res) => {
  try {
    const organizer = await User.findById(req.params.id);

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found'
      });
    }

    if (organizer.role !== 'organizer') {
      return res.status(400).json({
        success: false,
        message: 'This account is not an organizer'
      });
    }

    // Soft delete - disable account
    organizer.isActive = false;
    await organizer.save();

    res.json({
      success: true,
      message: 'Organizer account disabled successfully'
    });
  } catch (error) {
    console.error('Delete organizer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting organizer',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/organizers/:id/toggle-status
// @desc    Enable or disable organizer account
// @access  Admin only
router.put('/organizers/:id/toggle-status', auth, isAdmin, async (req, res) => {
  try {
    const organizer = await User.findById(req.params.id);

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found'
      });
    }

    if (organizer.role !== 'organizer') {
      return res.status(400).json({
        success: false,
        message: 'This account is not an organizer'
      });
    }

    organizer.isActive = !organizer.isActive;
    await organizer.save();

    res.json({
      success: true,
      message: organizer.isActive
        ? 'Organizer account enabled successfully'
        : 'Organizer account disabled successfully',
      data: { isActive: organizer.isActive }
    });
  } catch (error) {
    console.error('Toggle organizer status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/admin/password-resets
// @desc    Get all password reset requests
// @access  Admin only
router.get('/password-resets', auth, isAdmin, async (req, res) => {
  try {
    const { status } = req.query;

    let query = {};
    if (status && status !== 'all') {
      // Normalize status to capitalized form (e.g., 'pending' -> 'Pending')
      const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
      query.status = normalizedStatus;
    }

    const resetRequests = await PasswordReset.find(query)
      .populate('organizer', 'firstName lastName email organizerName')
      .populate('reviewedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: resetRequests.length,
      data: resetRequests
    });
  } catch (error) {
    console.error('Get password resets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching password reset requests',
      error: error.message
    });
  }
});

// @route   POST /api/admin/password-resets/:id/approve
// @desc    Approve password reset and generate new password
// @access  Admin only
router.post('/password-resets/:id/approve', auth, isAdmin, async (req, res) => {
  try {
    const resetRequest = await PasswordReset.findById(req.params.id)
      .populate('organizer');

    if (!resetRequest) {
      return res.status(404).json({
        success: false,
        message: 'Password reset request not found'
      });
    }

    if (resetRequest.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been processed'
      });
    }

    // Generate new password
    const newPassword = generatePassword();

    // Update organizer's password
    const organizer = await User.findById(resetRequest.organizer._id);
    organizer.password = newPassword; // Will be hashed by pre-save hook
    await organizer.save();

    // Update reset request
    resetRequest.status = 'Approved';
    resetRequest.reviewedBy = req.user._id;
    resetRequest.reviewedAt = new Date();
    resetRequest.newPassword = newPassword; // Store for admin reference
    await resetRequest.save();

    // Send notification email to organizer
    await sendPasswordResetStatusEmail(organizer.email, organizer.organizerName || `${organizer.firstName} ${organizer.lastName}`, 'Approved', { newPassword });

    res.json({
      success: true,
      message: 'Password reset approved successfully',
      data: {
        organizerEmail: organizer.email,
        newPassword, // Send to admin to share with organizer
        organizerName: organizer.organizerName || `${organizer.firstName} ${organizer.lastName}`
      }
    });
  } catch (error) {
    console.error('Approve password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while approving password reset',
      error: error.message
    });
  }
});

// @route   POST /api/admin/password-resets/:id/reject
// @desc    Reject password reset request
// @access  Admin only
router.post('/password-resets/:id/reject', auth, isAdmin, async (req, res) => {
  try {
    const { reason } = req.body;

    const resetRequest = await PasswordReset.findById(req.params.id);

    if (!resetRequest) {
      return res.status(404).json({
        success: false,
        message: 'Password reset request not found'
      });
    }

    if (resetRequest.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been processed'
      });
    }

    // Update reset request
    resetRequest.status = 'Rejected';
    resetRequest.reviewedBy = req.user._id;
    resetRequest.reviewedAt = new Date();
    resetRequest.adminComments = reason || 'No reason provided';
    await resetRequest.save();

    // Send notification email to organizer
    const organizer = await User.findById(resetRequest.organizer);
    if (organizer) {
      await sendPasswordResetStatusEmail(organizer.email, organizer.organizerName || `${organizer.firstName} ${organizer.lastName}`, 'Rejected', { reason });
    }

    res.json({
      success: true,
      message: 'Password reset request rejected'
    });
  } catch (error) {
    console.error('Reject password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting password reset',
      error: error.message
    });
  }
});

// @route   GET /api/admin/stats
// @desc    Get system statistics for admin dashboard
// @access  Admin only
router.get('/stats', auth, isAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalOrganizers,
      totalEvents,
      pendingResets
    ] = await Promise.all([
      User.countDocuments({ role: 'participant' }),
      User.countDocuments({ role: 'organizer' }),
      Event.countDocuments(),
      PasswordReset.countDocuments({ status: 'Pending' })
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalOrganizers,
        totalEvents,
        pendingResets
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics',
      error: error.message
    });
  }
});

module.exports = router;
