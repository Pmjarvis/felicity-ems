const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Event name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true
  },
  
  // Event Type
  type: {
    type: String,
    enum: ['Normal', 'Merchandise'],
    required: true,
    default: 'Normal'
  },
  
  // Organizer Reference
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Dates
  startDate: {
    type: Date,
    required: [true, 'Event start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'Event end date is required']
  },
  registrationDeadline: {
    type: Date,
    required: [true, 'Registration deadline is required']
  },
  
  // Status
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Ongoing', 'Completed', 'Closed', 'Cancelled'],
    default: 'Draft'
  },
  
  // Eligibility
  eligibility: {
    type: String,
    enum: ['All', 'IIIT Only', 'Non-IIIT Only'],
    default: 'All'
  },
  
  // Registration
  registrationLimit: {
    type: Number,
    default: null // null means unlimited
  },
  registrationCount: {
    type: Number,
    default: 0
  },
  registrationFee: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Tags for search and filtering
  tags: [{
    type: String,
    trim: true
  }],
  
  // Normal Event Specific Fields
  customForm: {
    fields: [{
      fieldType: {
        type: String,
        enum: ['text', 'textarea', 'email', 'number', 'dropdown', 'checkbox', 'radio', 'file', 'date'],
        required: true
      },
      fieldLabel: {
        type: String,
        required: true,
        trim: true
      },
      fieldName: {
        type: String,
        required: true,
        trim: true
      },
      options: [String], // For dropdown, checkbox, radio
      required: {
        type: Boolean,
        default: false
      },
      order: {
        type: Number,
        default: 0
      }
    }],
    isLocked: {
      type: Boolean,
      default: false // Locks after first registration
    }
  },
  
  // Merchandise Event Specific Fields
  merchandise: {
    itemDetails: {
      sizes: [{
        type: String,
        enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
      }],
      colors: [String],
      variants: [{
        name: String,
        price: Number,
        stock: Number
      }]
    },
    stockQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    purchaseLimit: {
      type: Number,
      default: 1,
      min: 1
    }
  },
  
  // Team Event Fields (Tier A Feature)
  isTeamEvent: {
    type: Boolean,
    default: false
  },
  minTeamSize: {
    type: Number,
    default: 1,
    min: 1
  },
  maxTeamSize: {
    type: Number,
    default: 1,
    min: 1
  },
  
  // Analytics & Tracking
  views: {
    type: Number,
    default: 0
  },
  trending: {
    viewsLast24h: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  
  // Additional Settings
  bannerImage: {
    type: String,
    default: null
  },
  venue: {
    type: String,
    trim: true
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
eventSchema.index({ organizer: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ type: 1 });
eventSchema.index({ startDate: 1 });
eventSchema.index({ registrationDeadline: 1 });
eventSchema.index({ tags: 1 });
eventSchema.index({ name: 'text', description: 'text' }); // Text search

// Validation: End date must be after start date
eventSchema.pre('save', function(next) {
  if (this.endDate < this.startDate) {
    next(new Error('End date must be after start date'));
  }
  if (this.registrationDeadline > this.startDate) {
    next(new Error('Registration deadline must be before event start date'));
  }
  next();
});

// Method to check if registration is open
eventSchema.methods.isRegistrationOpen = function() {
  const now = new Date();
  return (
    this.status === 'Published' &&
    this.registrationDeadline > now &&
    (this.registrationLimit === null || this.registrationCount < this.registrationLimit)
  );
};

// Method to check if event is full
eventSchema.methods.isFull = function() {
  if (this.registrationLimit === null) return false;
  return this.registrationCount >= this.registrationLimit;
};

// Method to increment registration count
eventSchema.methods.incrementRegistration = async function() {
  this.registrationCount += 1;
  return await this.save();
};

// Method to decrement registration count
eventSchema.methods.decrementRegistration = async function() {
  if (this.registrationCount > 0) {
    this.registrationCount -= 1;
    return await this.save();
  }
};

// Virtual for revenue calculation
eventSchema.virtual('totalRevenue').get(function() {
  return this.registrationCount * this.registrationFee;
});

// Ensure virtuals are included
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);
