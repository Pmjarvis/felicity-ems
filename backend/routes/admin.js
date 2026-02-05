const express = require('express');
const router = express.Router();
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const Event = require('../models/Event');
const { auth } = require('../middleware/auth');
const { isAdmin } = require('../middleware/checkRole');
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
      firstName: name.split(' ')[0] || name,
      lastName: name.split(' ').slice(1).join(' ') || 'Organization',
      email: loginEmail,
      password: generatedPassword,
      role: 'organizer',
      accountStatus: 'active',
      organizationName: name,
      category,
      description: description || '',
      contactEmail,
      contactNumber: contactNumber || ''
    });

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

    // Option 1: Soft delete (disable account)
    organizer.accountStatus = 'disabled';
    await organizer.save();

    // Option 2: Hard delete (uncomment if needed)
    // await organizer.deleteOne();

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

// @route   GET /api/admin/password-resets
// @desc    Get all password reset requests
// @access  Admin only
router.get('/password-resets', auth, isAdmin, async (req, res) => {
  try {
    const { status } = req.query;

    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const resetRequests = await PasswordReset.find(query)
      .populate('organizer', 'firstName lastName email organizationName')
      .populate('approvedBy', 'firstName lastName email')
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

    if (resetRequest.status !== 'pending') {
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
    resetRequest.status = 'approved';
    resetRequest.approvedBy = req.user._id;
    resetRequest.approvedAt = new Date();
    resetRequest.newPassword = newPassword; // Store for admin reference
    await resetRequest.save();

    res.json({
      success: true,
      message: 'Password reset approved successfully',
      data: {
        organizerEmail: organizer.email,
        newPassword, // Send to admin to share with organizer
        organizerName: organizer.organizationName || `${organizer.firstName} ${organizer.lastName}`
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

    if (resetRequest.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'This request has already been processed' 
      });
    }

    // Update reset request
    resetRequest.status = 'rejected';
    resetRequest.approvedBy = req.user._id;
    resetRequest.approvedAt = new Date();
    resetRequest.adminNotes = reason || 'No reason provided';
    await resetRequest.save();

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
      PasswordReset.countDocuments({ status: 'pending' })
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
