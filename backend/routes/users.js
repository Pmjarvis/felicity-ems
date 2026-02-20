const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Event = require('../models/Event');
const { auth } = require('../middleware/auth');
const { isParticipant } = require('../middleware/checkRole');

// @route   GET /api/users/organizers
// @desc    Get all organizers (public listing)
// @access  Public
router.get('/organizers', async (req, res) => {
  try {
    const organizers = await User.find({
      role: 'organizer',
      isActive: true
    })
      .select('organizerName category description contactEmail createdAt _id')
      .sort({ organizerName: 1 });

    res.json({
      success: true,
      count: organizers.length,
      data: organizers
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

// @route   GET /api/users/organizers/:id
// @desc    Get single organizer details with their events
// @access  Public
router.get('/organizers/:id', async (req, res) => {
  try {
    const organizer = await User.findOne({
      _id: req.params.id,
      role: 'organizer',
      isActive: true
    }).select('organizerName category description contactEmail createdAt');

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found'
      });
    }

    // Get organizer's published events
    const events = await Event.find({
      organizer: organizer._id,
      status: 'Published'
    }).select('name description type startDate registrationFee tags');

    res.json({
      success: true,
      data: {
        organizer,
        events,
        eventCount: events.length
      }
    });
  } catch (error) {
    console.error('Get organizer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching organizer',
      error: error.message
    });
  }
});

// @route   GET /api/users/profile
// @desc    Get current user's profile
// @access  Private (Participant)
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('preferences.followedClubs', 'organizerName category');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update current user's profile
// @access  Private (Participant)
router.put('/profile', auth, isParticipant, async (req, res) => {
  try {
    const { firstName, lastName, contact, collegeName, interests } = req.body;

    const updateFields = {};
    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;
    if (firstName || lastName) {
      updateFields.name = `${firstName || req.user.firstName || ''} ${lastName || req.user.lastName || ''}`.trim();
    }
    if (contact !== undefined) updateFields.contact = contact;
    if (collegeName !== undefined) updateFields.collegeName = collegeName;
    if (interests) updateFields['preferences.interests'] = interests;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password').populate('preferences.followedClubs', 'organizerName category');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
});

// @route   POST /api/users/follow/:organizerId
// @desc    Follow an organizer
// @access  Private (Participant)
router.post('/follow/:organizerId', auth, isParticipant, async (req, res) => {
  try {
    const organizerId = req.params.organizerId;

    // Verify organizer exists
    const organizer = await User.findOne({ _id: organizerId, role: 'organizer' });
    if (!organizer) {
      return res.status(404).json({ success: false, message: 'Organizer not found' });
    }

    // Add to followed clubs if not already following
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { 'preferences.followedClubs': organizerId } },
      { new: true }
    ).select('-password').populate('preferences.followedClubs', 'organizerName category');

    res.json({
      success: true,
      message: `Now following ${organizer.organizerName}`,
      data: user.preferences.followedClubs
    });
  } catch (error) {
    console.error('Follow organizer error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/users/follow/:organizerId
// @desc    Unfollow an organizer
// @access  Private (Participant)
router.delete('/follow/:organizerId', auth, isParticipant, async (req, res) => {
  try {
    const organizerId = req.params.organizerId;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { 'preferences.followedClubs': organizerId } },
      { new: true }
    ).select('-password').populate('preferences.followedClubs', 'organizerName category');

    res.json({
      success: true,
      message: 'Unfollowed successfully',
      data: user.preferences.followedClubs
    });
  } catch (error) {
    console.error('Unfollow organizer error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
