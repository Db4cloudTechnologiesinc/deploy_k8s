import mongoose from 'mongoose';

const shiftRequestSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  employeeCode: {
    type: String,
    required: true
  },
  requestedShift: {
    type: String,
    required: true,
    enum: ['Morning Shift', 'Evening Shift', 'Night Shift', 'General Shift']
  },
  currentShift: {
    type: String,
    default: 'Regular Shift'
  },
  requestedDate: {
    type: Date,
    required: true
  },
  requestedTill: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  description: String,
  isPermanentRequest: {
    type: Boolean,
    default: false
  },
  isForReview: {
    type: Boolean,
    default: true
  },
  // Keep isAllocated for backward compatibility but we'll use isForReview instead
  isAllocated: {
    type: Boolean,
    default: false
  },
  // Add fields for tracking who reviewed the request
  reviewedBy: {
    type: String,
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Create model for ShiftRequest in the main database (for backward compatibility)
const ShiftRequest = mongoose.model('ShiftRequest', shiftRequestSchema);

// Export the schema for company-specific models
export { shiftRequestSchema };

// Export the main model as default
export default ShiftRequest;
