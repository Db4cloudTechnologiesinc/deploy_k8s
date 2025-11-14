import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  companyCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^\d{6}$/.test(v);
        },
        message: props => 'Zip code must be exactly 6 digits'
      }
    }
  },
  
  contactEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
  },
  contactPhone: {
    type: String,
    trim: true,
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v);
      },
      message: props => 'Phone number must be exactly 10 digits'
    }
  },
  
  logo: {
    type: String, // URL to company logo
    required: true
  },
  industry: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    leavePolicy: {
      casualLeavePerYear: { type: Number, default: 12 },
      sickLeavePerYear: { type: Number, default: 4 }
    },
    workingHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '18:00' }
    },
    workingDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  adminUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  registrationNumber: {
    type: String,
    required: true,
    default: function() {
      // Generate a unique value, e.g., using company code and timestamp
      return `REG-${this.companyCode}-${Date.now()}`;
    },
    unique: true
  },
  pendingVerification: {
    type: Boolean,
    default: true
  },
  contactEmailOtp: {
    type: String
  },
  contactEmailOtpExpires: {
    type: Date
  },
  contactEmailVerified: {
    type: Boolean,
    default: false
  },
  paymentCompleted: {
    type: Boolean,
    default: false
  },
  paymentDate: {
    type: Date,
    default: null
  },
  paymentAmount: {
    type: Number,
    default: null
  },
  razorpayPaymentId: {
    type: String,
    default: null
  },
  // Payment Plan Details
  planStartDate: {
    type: Date,
    default: null
  },
  planEndDate: {
    type: Date,
    default: null
  },
  planDurationDays: {
    type: Number,
    default: 365 // Default 1 year, configurable
  },
  paymentExpiryDate: {
    type: Date,
    default: function() {
      // Payment is valid for planDurationDays after company creation
      return new Date(Date.now() + (this.planDurationDays || 365) * 24 * 60 * 60 * 1000);
    }
  },
  isPaymentExpired: {
    type: Boolean,
    default: false
  },
  paymentLinkShared: {
    type: Boolean,
    default: false
  },
  paymentLinkSharedDate: {
    type: Date,
    default: null
  },
  remindersSent: [{
    type: {
      type: String,
      enum: ['5_day_reminder', '1_day_reminder', 'expiry_notification']
    },
    sentDate: {
      type: Date,
      default: Date.now
    }
  }],
  lastReminderCheck: {
    type: Date,
    default: Date.now
  }
  
}, {
  timestamps: true
});

// Instance methods for payment management
companySchema.methods.activatePlan = function() {
  const now = new Date();
  this.planStartDate = now;
  this.planEndDate = new Date(now.getTime() + (this.planDurationDays * 24 * 60 * 60 * 1000));
  this.paymentCompleted = true;
  this.paymentDate = now;
  this.isPaymentExpired = false;
  return this.save();
};

companySchema.methods.checkPaymentExpiry = function() {
  const now = new Date();
  if (this.planEndDate && now > this.planEndDate) {
    this.isPaymentExpired = true;
    this.isActive = false;
    return this.save();
  }
  return false;
};

companySchema.methods.needsReminderCheck = function() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return !this.lastReminderCheck || this.lastReminderCheck < oneDayAgo;
};

companySchema.methods.getDaysUntilExpiry = function() {
  if (!this.planEndDate) return null;
  const now = new Date();
  const diffTime = this.planEndDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

companySchema.methods.addReminderSent = function(type) {
  this.remindersSent.push({
    type: type,
    sentDate: new Date()
  });
  this.lastReminderCheck = new Date();
  return this.save();
};

companySchema.methods.hasReminderBeenSent = function(type) {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  
  return this.remindersSent.some(reminder => 
    reminder.type === type && 
    reminder.sentDate >= startOfDay && 
    reminder.sentDate < endOfDay
  );
};

// Static methods for automated processing
companySchema.statics.getCompaniesNeedingReminders = function() {
  const now = new Date();
  const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
  
  return this.find({
    paymentCompleted: true,
    isPaymentExpired: false,
    planEndDate: { $exists: true },
    $or: [
      // Companies expiring in 5 days
      {
        planEndDate: { $lte: fiveDaysFromNow, $gt: oneDayFromNow },
        'remindersSent.type': { $ne: '5_day_reminder' }
      },
      // Companies expiring in 1 day
      {
        planEndDate: { $lte: oneDayFromNow, $gt: now },
        'remindersSent.type': { $ne: '1_day_reminder' }
      },
      // Companies that have expired today
      {
        planEndDate: { $lte: now },
        'remindersSent.type': { $ne: 'expiry_notification' }
      }
    ]
  });
};

companySchema.statics.getExpiredCompanies = function() {
  const now = new Date();
  return this.find({
    planEndDate: { $lt: now },
    isPaymentExpired: false
  });
};

const Company = mongoose.model('Company', companySchema);

export { companySchema };
export default Company;