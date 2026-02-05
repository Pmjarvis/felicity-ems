const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema({
  // Organizer Reference
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Request Details
  reason: {
    type: String,
    required: [true, 'Reason for password reset is required'],
    trim: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  
  // Request Date
  requestDate: {
    type: Date,
    default: Date.now
  },
  
  // Admin Action
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Admin who reviewed
  },
  reviewedAt: Date,
  
  // Admin Comments
  adminComments: {
    type: String,
    trim: true
  },
  
  // New Password (only if approved)
  newPassword: {
    type: String,
    select: false // Never expose in queries
  },
  
  // Password Change Status
  passwordChanged: {
    type: Boolean,
    default: false
  },
  passwordChangedAt: Date,
  
  // Rejection Reason
  rejectionReason: {
    type: String,
    trim: true
  },
  
  // Contact Information (in case organizer can't login)
  contactEmail: {
    type: String,
    trim: true
  },
  contactPhone: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes
passwordResetSchema.index({ organizer: 1 });
passwordResetSchema.index({ status: 1 });
passwordResetSchema.index({ requestDate: -1 });

// Method to approve request
passwordResetSchema.methods.approve = async function(adminId, newPassword, comments = '') {
  if (this.status !== 'Pending') {
    return { success: false, message: 'Request is not pending' };
  }
  
  this.status = 'Approved';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.adminComments = comments;
  this.newPassword = newPassword; // Will be hashed when updating user
  
  await this.save();
  return { success: true, message: 'Password reset request approved', newPassword };
};

// Method to reject request
passwordResetSchema.methods.reject = async function(adminId, reason, comments = '') {
  if (this.status !== 'Pending') {
    return { success: false, message: 'Request is not pending' };
  }
  
  this.status = 'Rejected';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.rejectionReason = reason;
  this.adminComments = comments;
  
  await this.save();
  return { success: true, message: 'Password reset request rejected' };
};

// Method to mark password as changed
passwordResetSchema.methods.markPasswordChanged = async function() {
  this.passwordChanged = true;
  this.passwordChangedAt = new Date();
  await this.save();
};

// Static method to get pending requests
passwordResetSchema.statics.getPendingRequests = function() {
  return this.find({ status: 'Pending' })
    .populate('organizer', 'name email organizerName category')
    .sort({ requestDate: -1 });
};

// Static method to get organizer's request history
passwordResetSchema.statics.getOrganizerHistory = function(organizerId) {
  return this.find({ organizer: organizerId })
    .populate('reviewedBy', 'name email')
    .sort({ requestDate: -1 });
};

// Static method to check if organizer has pending request
passwordResetSchema.statics.hasPendingRequest = async function(organizerId) {
  const count = await this.countDocuments({
    organizer: organizerId,
    status: 'Pending'
  });
  return count > 0;
};

module.exports = mongoose.model('PasswordReset', passwordResetSchema);
