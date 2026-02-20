const mongoose = require('mongoose');
const crypto = require('crypto');

const registrationSchema = new mongoose.Schema({
  // Event Reference
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },

  // User Reference
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Team Reference (for team events - Tier A)
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },

  // Registration Status
  status: {
    type: String,
    enum: ['Registered', 'Attended', 'Cancelled', 'Rejected', 'Pending'],
    default: 'Registered'
  },

  // Ticket Information
  ticketId: {
    type: String,
    required: true
  },
  qrCode: {
    type: String, // Base64 encoded QR code or URL to QR image
    default: null
  },

  // Custom Form Responses (for Normal events)
  formResponses: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Merchandise Purchase Details
  merchandiseDetails: {
    size: String,
    color: String,
    variant: String,
    quantity: {
      type: Number,
      default: 1
    }
  },

  // Payment Information
  payment: {
    amount: {
      type: Number,
      required: true,
      default: 0
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
      default: 'Completed'
    },
    transactionId: String,
    paymentProof: String, // URL to uploaded payment screenshot (Tier A feature)
    approvalStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Approved'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date
  },

  // Attendance Tracking
  attendance: {
    marked: {
      type: Boolean,
      default: false
    },
    markedAt: Date,
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    scanCount: {
      type: Number,
      default: 0
    },
    scanHistory: [{
      scannedAt: Date,
      scannedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  },

  // Registration Metadata
  registrationDate: {
    type: Date,
    default: Date.now
  },
  cancellationDate: Date,
  cancellationReason: String,

  // Email notifications
  emailSent: {
    type: Boolean,
    default: false
  },

  // Notes (for organizers)
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes
registrationSchema.index({ event: 1, user: 1 }, { unique: true }); // Prevent duplicate registrations
registrationSchema.index({ ticketId: 1 });
registrationSchema.index({ status: 1 });
registrationSchema.index({ user: 1 });
registrationSchema.index({ event: 1 });
registrationSchema.index({ team: 1 });

// Generate unique ticket ID before saving
// Generate unique ticket ID before validation
registrationSchema.pre('validate', async function () {
  if (!this.ticketId) {
    // Generate format: FEL-YYYYMMDD-RANDOM6
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    this.ticketId = `FEL-${date}-${random}`;
  }
});

// Method to generate QR code data
registrationSchema.methods.generateQRData = function () {
  return JSON.stringify({
    ticketId: this.ticketId,
    eventId: this.event,
    userId: this.user,
    registrationId: this._id,
    timestamp: this.registrationDate
  });
};

// Method to mark attendance
registrationSchema.methods.markAttendance = async function (scannedBy) {
  if (this.attendance.marked) {
    return { success: false, message: 'Attendance already marked' };
  }

  this.attendance.marked = true;
  this.attendance.markedAt = new Date();
  this.attendance.markedBy = scannedBy;
  this.attendance.scanCount += 1;
  this.attendance.scanHistory.push({
    scannedAt: new Date(),
    scannedBy: scannedBy
  });
  this.status = 'Attended';

  await this.save();
  return { success: true, message: 'Attendance marked successfully' };
};

// Method to cancel registration
registrationSchema.methods.cancelRegistration = async function (reason) {
  this.status = 'Cancelled';
  this.cancellationDate = new Date();
  this.cancellationReason = reason;
  await this.save();
};

// Static method to get registrations by event
registrationSchema.statics.getEventRegistrations = function (eventId, status = null) {
  const query = { event: eventId };
  if (status) {
    query.status = status;
  }
  return this.find(query).populate('user', 'name email contact').populate('team');
};

// Static method to get user registrations
registrationSchema.statics.getUserRegistrations = function (userId, status = null) {
  const query = { user: userId };
  if (status) {
    query.status = status;
  }
  return this.find(query).populate('event').populate('team');
};

module.exports = mongoose.model('Registration', registrationSchema);
