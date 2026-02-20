const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { isParticipant } = require('../middleware/checkRole');
const { sendTeamFinalizedEmail } = require('../utils/emailService');

// @route   POST /api/teams/create
// @desc    Create a new team for a team event
// @access  Participant only
router.post('/create', auth, isParticipant, async (req, res) => {
  try {
    const { eventId, teamName } = req.body;

    // Validation
    if (!eventId || !teamName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide event ID and team name'
      });
    }

    // Check if event exists and is a team event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (!event.isTeamEvent) {
      return res.status(400).json({
        success: false,
        message: 'This event is not a team event'
      });
    }

    // Check if event status is published
    if (event.status !== 'Published') {
      return res.status(400).json({
        success: false,
        message: 'Event is not open for registration'
      });
    }

    // Check if registration deadline has passed
    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed'
      });
    }

    // Check if user is already in a team for this event
    const existingTeam = await Team.findOne({
      event: eventId,
      $or: [
        { leader: req.user._id },
        { 'members.user': req.user._id }
      ]
    });

    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: 'You are already part of a team for this event'
      });
    }

    // Create team
    const team = await Team.create({
      name: teamName,
      event: eventId,
      leader: req.user._id,
      members: [{
        user: req.user._id,
        status: 'Accepted'
      }],
      requiredSize: event.maxTeamSize,
      currentSize: 1
    });

    // Populate team details
    await team.populate('leader', 'name email');
    await team.populate('members.user', 'name email');
    await team.populate('event', 'name isTeamEvent minTeamSize maxTeamSize');

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: team
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating team',
      error: error.message
    });
  }
});

// @route   POST /api/teams/join
// @desc    Join an existing team using invite code
// @access  Participant only
router.post('/join', auth, isParticipant, async (req, res) => {
  try {
    const { inviteCode } = req.body;

    // Validation
    if (!inviteCode) {
      return res.status(400).json({
        success: false,
        message: 'Please provide team invite code'
      });
    }

    // Find team by invite code
    const team = await Team.findOne({ inviteCode: inviteCode.toUpperCase() })
      .populate('event')
      .populate('leader', 'name email')
      .populate('members.user', 'name email');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found with this invite code'
      });
    }

    // Check if team is finalized
    if (team.isFinalized) {
      return res.status(400).json({
        success: false,
        message: 'This team has already been finalized and cannot accept new members'
      });
    }

    // Check if event registration deadline has passed
    if (new Date() > new Date(team.event.registrationDeadline)) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed'
      });
    }

    // Check if team is full
    if (team.currentSize >= team.requiredSize) {
      return res.status(400).json({
        success: false,
        message: 'Team is already full'
      });
    }

    // Check if user is already in this team
    const isAlreadyMember = team.members.some(
      m => m.user._id.toString() === req.user._id.toString()
    );

    if (isAlreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this team'
      });
    }

    // Check if user is in another team for this event
    const otherTeam = await Team.findOne({
      event: team.event._id,
      _id: { $ne: team._id },
      $or: [
        { leader: req.user._id },
        { 'members.user': req.user._id }
      ]
    });

    if (otherTeam) {
      return res.status(400).json({
        success: false,
        message: 'You are already part of another team for this event'
      });
    }

    // Add user to team
    team.members.push({
      user: req.user._id,
      status: 'Accepted'
    });
    team.currentSize += 1;

    await team.save();
    await team.populate('members.user', 'name email');

    res.json({
      success: true,
      message: 'Successfully joined the team',
      data: team
    });
  } catch (error) {
    console.error('Join team error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while joining team',
      error: error.message
    });
  }
});

// @route   POST /api/teams/finalize/:teamId
// @desc    Finalize team and create registrations for all members
// @access  Team Leader only
router.post('/finalize/:teamId', auth, isParticipant, async (req, res) => {
  try {
    const { teamId } = req.params;

    // Find team
    const team = await Team.findById(teamId)
      .populate('event')
      .populate('leader', 'name email')
      .populate('members.user', 'name email');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is the team leader
    if (team.leader._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the team leader can finalize the team'
      });
    }

    // Check if team is already finalized
    if (team.isFinalized) {
      return res.status(400).json({
        success: false,
        message: 'Team has already been finalized'
      });
    }

    // Check if team meets minimum size requirement
    const minSize = team.event.minTeamSize;
    if (team.currentSize < minSize) {
      return res.status(400).json({
        success: false,
        message: `Team must have at least ${minSize} members to finalize (current: ${team.currentSize})`
      });
    }

    // Create registration tickets for all members
    const registrations = [];
    const registrationDetails = []; // Store for email sending
    
    for (const member of team.members) {
      if (member.status === 'Accepted') {
        const ticketId = `FEL-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const registration = await Registration.create({
          event: team.event._id,
          user: member.user._id,
          team: team._id,
          status: 'Registered',
          ticketId: ticketId,
          payment: {
            amount: team.event.registrationFee || 0,
            status: team.event.registrationFee > 0 ? 'Pending' : 'Completed'
          }
        });
        registrations.push(registration._id);
        
        registrationDetails.push({
          userId: member.user._id,
          userName: member.user.name,
          userEmail: member.user.email,
          ticketNumber: ticketId
        });
      }
    }

    // Update team status
    team.isFinalized = true;
    team.status = 'Registered';
    team.registeredAt = new Date();
    await team.save();

    // Update event registration count
    await Event.findByIdAndUpdate(team.event._id, {
      $inc: { registrationCount: team.currentSize }
    });

    // Send email notifications to all team members
    const teamDetails = {
      teamName: team.name,
      leaderName: team.leader.name,
      eventName: team.event.name,
      memberCount: team.currentSize,
      members: team.members
        .filter(m => m.status === 'Accepted')
        .map(m => ({
          name: m.user.name,
          isLeader: m.user._id.toString() === team.leader._id.toString()
        }))
    };

    // Send emails asynchronously (don't wait for completion)
    for (const regDetail of registrationDetails) {
      sendTeamFinalizedEmail(
        regDetail.userEmail,
        regDetail.userName,
        teamDetails,
        regDetail.ticketNumber
      ).catch(err => {
        console.error(`Failed to send email to ${regDetail.userEmail}:`, err.message);
      });
    }

    res.json({
      success: true,
      message: 'Team finalized successfully. All members have been registered and will receive confirmation emails.',
      data: {
        team,
        registrationCount: registrations.length
      }
    });
  } catch (error) {
    console.error('Finalize team error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while finalizing team',
      error: error.message
    });
  }
});

// @route   GET /api/teams/my-teams
// @desc    Get all teams the user is part of
// @access  Participant only
router.get('/my-teams', auth, isParticipant, async (req, res) => {
  try {
    const teams = await Team.find({
      $or: [
        { leader: req.user._id },
        { 'members.user': req.user._id }
      ]
    })
      .populate('event', 'name startDate endDate isTeamEvent')
      .populate('leader', 'name email')
      .populate('members.user', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching teams',
      error: error.message
    });
  }
});

// @route   GET /api/teams/:teamId
// @desc    Get team details
// @access  Participant only (must be member)
router.get('/:teamId', auth, isParticipant, async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId)
      .populate('event', 'name startDate endDate isTeamEvent minTeamSize maxTeamSize')
      .populate('leader', 'name email')
      .populate('members.user', 'name email');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is part of this team
    const isMember = team.leader._id.toString() === req.user._id.toString() ||
      team.members.some(m => m.user._id.toString() === req.user._id.toString());

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this team'
      });
    }

    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching team',
      error: error.message
    });
  }
});

// @route   DELETE /api/teams/:teamId
// @desc    Delete team (leader only, before finalization)
// @access  Team Leader only
router.delete('/:teamId', auth, isParticipant, async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is the team leader
    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the team leader can delete the team'
      });
    }

    // Check if team is already finalized
    if (team.isFinalized) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a finalized team'
      });
    }

    await team.deleteOne();

    res.json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting team',
      error: error.message
    });
  }
});

module.exports = router;
