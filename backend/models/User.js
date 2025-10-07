import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import createCompanyModel from './modelFactory.js';

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true,
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  middleName: {
    type: String,
    trim: true,
    default: ''
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true
  },
  password: { 
    type: String, 
    required: true 
  },
  role: {
    type: String,
    enum: ['admin', 'hr', 'manager', 'employee'],
    default: 'employee'
  },
  companyCode: {
    type: String,
    required: true,
    index: true
  },
  permissions: [{
    type: String,
    enum: [
      'view_employees', 'edit_employees', 'create_employees', 'delete_employees',
      'view_payroll', 'manage_payroll',
      'view_leave', 'approve_leave', 'manage_leave_policy',
      'view_attendance', 'manage_attendance',
      'view_reports', 'create_reports',
      'manage_company_settings'
    ]
  }],
  // NEW FIELDS FOR INVITATION TRACKING
  isFirstLogin: {
    type: Boolean,
    default: false
  },
  invitationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invitation'
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  // EXISTING FIELDS
  otp: String,
  otpExpires: Date,
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  isActive: {
    type: Boolean,
    default: true
  },
  resetPasswordToken: { 
    type: String 
  },
  resetPasswordExpires: { 
    type: Date 
  },
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

// Update lastModified on save
userSchema.pre('save', function(next) {
  if (!this.isModified('lastModified')) {
    this.lastModified = new Date();
  }
  next();
});

// Existing pre-save middleware for userId generation
userSchema.pre('save', async function(next) {
  // Only generate userId if it's a new user AND userId is not already set
  if (this.isNew && !this.userId) {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      try {
        // Extract domain from email
        const emailParts = this.email.split('@');
        const domain = emailParts[1].split('.')[0];
        
        // Generate base for userId using first letter of first name, first letter of last name, and domain
        const baseId = `${this.firstName.charAt(0)}${this.lastName.charAt(0)}-${domain}`.toUpperCase();
        
        // Check both main database and company database for existing userIds
        const mainDbUsers = await MainUser.find({
          userId: new RegExp(`^${baseId}-\\d{4}$`)
        }, { userId: 1 }).sort({ userId: 1 });
        
        let companyDbUsers = [];
        try {
          const UserModel = await getUserModel(this.companyCode);
          companyDbUsers = await UserModel.find({
            userId: new RegExp(`^${baseId}-\\d{4}$`)
          }, { userId: 1 }).sort({ userId: 1 });
        } catch (companyError) {
          console.log('Company database not accessible, using main database only:', companyError.message);
        }
        
        // Combine results from both databases
        const allExistingUsers = [...mainDbUsers, ...companyDbUsers];
        
        // Extract the numbers from existing userIds and find the next available one
        const existingNumbers = allExistingUsers.map(user => {
          const match = user.userId.match(/-(\d{4})$/);
          return match ? parseInt(match[1], 10) : 0;
        }).filter(num => num > 0);
        
        // Remove duplicates and sort
        const uniqueNumbers = [...new Set(existingNumbers)].sort((a, b) => a - b);
        
        // Find the next available number
        let nextNumber = 1;
        for (const num of uniqueNumbers) {
          if (num === nextNumber) {
            nextNumber++;
          } else {
            break;
          }
        }
        
        // Create userId with the next available sequential number
        const candidateUserId = `${baseId}-${nextNumber.toString().padStart(4, '0')}`;
        
        // Double-check that this userId doesn't exist (race condition protection)
        const existsInMain = await MainUser.findOne({ userId: candidateUserId });
        if (existsInMain) {
          attempts++;
          console.log(`UserId ${candidateUserId} exists in main DB, trying again. Attempt ${attempts}`);
          continue;
        }
        
        // Set the userId and break out of the loop
        this.userId = candidateUserId;
        console.log(`Generated unique userId: ${this.userId} for ${this.email} (attempt ${attempts + 1})`);
        break;
        
      } catch (error) {
        attempts++;
        console.error(`Error generating userId (attempt ${attempts}):`, error);
        
        if (attempts >= maxAttempts) {
          // Fallback to timestamp-based userId
          this.userId = `USER-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          console.log(`Using fallback userId: ${this.userId}`);
          break;
        }
        
        // Wait a small random time before retrying to reduce race conditions
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
      }
    }
  }
  next();
});

// Hash password before saving - FIXED VERSION
userSchema.pre('save', async function(next) {
  // Skip if password is not modified
  if (!this.isModified('password')) {
    return next();
  }
  
  // Skip middleware if flag is set
  if (this.$skipMiddleware) {
    return next();
  }
  
  try {
    // Check if password is already hashed to prevent double hashing
    if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
      console.log('Password appears to be already hashed, skipping hashing for:', this.email);
      return next();
    }
    
    console.log('Hashing password for user:', {
      email: this.email,
      companyCode: this.companyCode,
      passwordLength: this.password.length,
      passwordPreview: this.password.substring(0, 3) + '...'
    });
    
    // Hash the password
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
    console.log(`Password hashed successfully. New length: ${this.password.length}`);
    
    next();
  } catch (error) {
    console.error('Error hashing password:', error);
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    console.log('Comparing password for user:', this.email);
    console.log('Candidate password length:', candidatePassword.length);
    console.log('Stored password length:', this.password.length);
    console.log('Stored password starts with hash:', this.password.startsWith('$2'));
    
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log('Password match result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
};

// Method to assign permissions based on role
userSchema.methods.assignPermissions = function() {
  switch(this.role) {
    case 'admin':
      this.permissions = [
        'view_employees', 'edit_employees', 'create_employees', 'delete_employees',
        'view_payroll', 'manage_payroll',
        'view_leave', 'approve_leave', 'manage_leave_policy',
        'view_attendance', 'manage_attendance',
        'view_reports', 'create_reports',
        'manage_company_settings'
      ];
      break;
    case 'hr':
      this.permissions = [
        'view_employees', 'edit_employees', 'create_employees',
        'view_payroll', 'manage_payroll',
        'view_leave', 'approve_leave', 'manage_leave_policy',
        'view_attendance', 'manage_attendance',
        'view_reports', 'create_reports',
        'manage_company_settings'
      ];
      break;
    case 'manager':
      this.permissions = [
        'view_employees',
        'view_leave', 'approve_leave',
        'view_attendance',
        'view_reports'
      ];
      break;
    case 'employee':
      this.permissions = [
        'view_leave'
      ];
      break;
  }
};

// Static method to create user without password hashing (for invitations)
userSchema.statics.createWithPlainPassword = async function(userData, plainPassword) {
  const user = new this(userData);
  
  // Set flag to skip password hashing middleware
  user.$skipMiddleware = true;
  
  // Hash password manually
  const saltRounds = 10;
  user.password = await bcrypt.hash(plainPassword, saltRounds);
  
  return user;
};

// Static method to safely save user with duplicate key error handling
userSchema.statics.safeSave = async function(userData) {
  let attempts = 0;
  const maxAttempts = 5;
  
  while (attempts < maxAttempts) {
    try {
      const user = new this(userData);
      await user.save();
      return user;
    } catch (error) {
      attempts++;
      
      // Check if it's a duplicate key error for userId
      if (error.code === 11000 && error.keyPattern && error.keyPattern.userId) {
        console.log(`Duplicate userId detected, retrying... (attempt ${attempts})`);
        
        if (attempts >= maxAttempts) {
          // Force a new userId and try one more time
          userData.userId = `USER-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          console.log(`Using emergency fallback userId: ${userData.userId}`);
          const user = new this(userData);
          await user.save();
          return user;
        }
        
        // Remove the userId to force regeneration
        delete userData.userId;
        continue;
      }
      
      // If it's not a duplicate key error, throw it
      throw error;
    }
  }
};

// This model will be in the main database for global user authentication
const MainUser = mongoose.model('User', userSchema);

// Function to get User model for a specific company
const getUserModel = async (companyCode) => {
  if (!companyCode) {
    throw new Error('Company code is required to get user model');
  }
  
  try {
    const model = await createCompanyModel(companyCode, 'User', userSchema);
    return model;
  } catch (error) {
    console.error(`Error getting User model for company ${companyCode}:`, error);
    throw error;
  }
};

// Add these methods to your User model schema
userSchema.statics.generatePassword = function() {
  const length = 10;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};

userSchema.methods.setPassword = function(password) {
  // This method should set the password (it will be hashed by the pre-save hook)
  this.password = password;
};

userSchema.statics.createFromInvitation = async function(invitation, password) {
  // Create the full name from first, middle, and last name
  const fullName = `${invitation.firstName}${invitation.middleName ? ' ' + invitation.middleName : ''} ${invitation.lastName}`;
  
  const user = new this({
    firstName: invitation.firstName,
    middleName: invitation.middleName || '',
    lastName: invitation.lastName,
    // Add the name field - this was missing
    name: fullName,
    email: invitation.email.toLowerCase(),
    // Add the password field directly - this was missing
    password: password, // Will be hashed by pre-save hook
    role: invitation.role,
    companyCode: invitation.companyCode,
    isVerified: true,
    isActive: true
  });
  
  await user.save();
  return user;
};

export { userSchema, getUserModel };
export default MainUser;
