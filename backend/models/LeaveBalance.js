import mongoose from 'mongoose';

const leaveBalanceSchema = new mongoose.Schema({
  employeeCode: {
    type: String,
    required: true,
    unique: true
  },
  casual: {
    total: { type: Number, default: 12 },
    used: { type: Number, default: 0 },
    pending: { type: Number, default: 0 }
  },
  sick: {
    total: { type: Number, default: 4 },
    used: { type: Number, default: 0 },
    pending: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Create model for LeaveBalance in the main database (for backward compatibility)
const LeaveBalance = mongoose.model('LeaveBalance', leaveBalanceSchema);

// Export the schema for company-specific models
export { leaveBalanceSchema };

// Export the main model as default
export default LeaveBalance;
