const mongoose = require('mongoose');
const crypto = require('crypto');

const teamSchema = new mongoose.Schema({
  // Team Basic Info
  name: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true
  },
  
  // Event Reference
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  
  // Team Leader
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Team Members
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['Invited', 'Accepted', 'Declined', 'Removed'],
      default: 'Invited'
    },
    invitedAt: {
      type: Date,
      default: Date.now
    },
    respondedAt: Date
  }],
  
  // Invite Code
  inviteCode: {
    type: String,
    required: true
  },
  
  // Team Status
  isFinalized: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['Forming', 'Complete', 'Registered', 'Cancelled'],
    default: 'Forming'
  },
  
  // Team Size Validation
  requiredSize: {
    type: Number,
    required: true
  },
  currentSize: {
    type: Number,
    default: 1 // Leader is always part of the team
  },
  
  // Registration
  registrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration'
  },
  registeredAt: Date,
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
teamSchema.index({ event: 1 });
teamSchema.index({ leader: 1 });
teamSchema.index({ inviteCode: 1 });
teamSchema.index({ 'members.user': 1 });

// Generate unique invite code before saving
teamSchema.pre('save', function(next) {
  if (!this.inviteCode) {
    // Generate format: TEAM-RANDOM8
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    this.inviteCode = `TEAM-${random}`;
  }
  next();
});

// Method to add member
teamSchema.methods.addMember = async function(userId) {
  // Check if team is full
  if (this.currentSize >= this.requiredSize) {
    return { success: false, message: 'Team is already full' };
  }
  
  // Check if user is already in team
  const existingMember = this.members.find(m => m.user.toString() === userId.toString());
  if (existingMember) {
    return { success: false, message: 'User is already in the team' };
  }
  
  // Check if user is the leader
  if (this.leader.toString() === userId.toString()) {
    return { success: false, message: 'User is the team leader' };
  }
  
  // Add member
  this.members.push({
    user: userId,
    status: 'Invited',
    invitedAt: new Date()
  });
  
  await this.save();
  return { success: true, message: 'Member invited successfully' };
};

// Method to accept invitation
teamSchema.methods.acceptInvitation = async function(userId) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  
  if (!member) {
    return { success: false, message: 'Invitation not found' };
  }
  
  if (member.status === 'Accepted') {
    return { success: false, message: 'Invitation already accepted' };
  }
  
  member.status = 'Accepted';
  member.respondedAt = new Date();
  this.currentSize += 1;
  
  // Check if team is now complete
  if (this.currentSize === this.requiredSize) {
    this.isFinalized = true;
    this.status = 'Complete';
  }
  
  await this.save();
  return { success: true, message: 'Invitation accepted', teamComplete: this.isFinalized };
};

// Method to decline invitation
teamSchema.methods.declineInvitation = async function(userId) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  
  if (!member) {
    return { success: false, message: 'Invitation not found' };
  }
  
  member.status = 'Declined';
  member.respondedAt = new Date();
  
  await this.save();
  return { success: true, message: 'Invitation declined' };
};

// Method to remove member
teamSchema.methods.removeMember = async function(userId, removedBy) {
  // Only leader can remove members
  if (removedBy.toString() !== this.leader.toString()) {
    return { success: false, message: 'Only team leader can remove members' };
  }
  
  const memberIndex = this.members.findIndex(m => m.user.toString() === userId.toString());
  
  if (memberIndex === -1) {
    return { success: false, message: 'Member not found' };
  }
  
  const member = this.members[memberIndex];
  
  // If member had accepted, decrease team size
  if (member.status === 'Accepted') {
    this.currentSize -= 1;
    this.isFinalized = false;
    this.status = 'Forming';
  }
  
  // Remove member from array
  this.members.splice(memberIndex, 1);
  
  await this.save();
  return { success: true, message: 'Member removed successfully' };
};

// Method to check if team is complete
teamSchema.methods.isComplete = function() {
  return this.isFinalized && this.currentSize === this.requiredSize;
};

// Method to get all accepted members including leader
teamSchema.methods.getAllMembers = async function() {
  const acceptedMembers = this.members
    .filter(m => m.status === 'Accepted')
    .map(m => m.user);
  
  return [this.leader, ...acceptedMembers];
};

// Static method to find team by invite code
teamSchema.statics.findByInviteCode = function(inviteCode) {
  return this.findOne({ inviteCode }).populate('event').populate('leader', 'name email');
};

// Static method to get user's teams
teamSchema.statics.getUserTeams = function(userId) {
  return this.find({
    $or: [
      { leader: userId },
      { 'members.user': userId }
    ]
  }).populate('event').populate('leader', 'name email');
};

module.exports = mongoose.model('Team', teamSchema);
