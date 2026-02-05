const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Event = require('../models/Event');

// @route   GET /api/users/organizers
// @desc    Get all organizers (public listing)
// @access  Public
router.get('/organizers', async (req, res) => {
  try {
    const organizers = await User.find({ 
      role: 'organizer',
      accountStatus: 'active'
    })
      .select('organizationName category description contactEmail createdAt')
      .sort({ organizationName: 1 });

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
      accountStatus: 'active'
    }).select('organizationName category description contactEmail createdAt');

    if (!organizer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Organizer not found' 
      });
    }

    // Get organizer's published events
    const events = await Event.find({ 
      organizer: organizer._id,
      status: 'published'
    }).select('name description eventType eventStartDate registrationFee tags');

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

module.exports = router;
