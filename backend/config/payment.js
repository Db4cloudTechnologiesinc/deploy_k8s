import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config();

// Payment configuration
export const PAYMENT_CONFIG = {
  // Configurable payment amount in INR (paise)
  REGISTRATION_FEE: 999900, // ₹9,999 in paise (9999 * 100)
  CURRENCY: 'INR',
  
  // Plan configuration
  PLAN_DURATION_DAYS: parseInt(process.env.PLAN_DURATION_DAYS) || 365, // Default 1 year
  PAYMENT_VALID_DAYS: parseInt(process.env.PAYMENT_VALID_DAYS) || 365, // Payment validity period
  
  // Reminder configuration
  REMINDER_DAYS: [5, 1], // Send reminders 5 days and 1 day before expiry
  
  // Super admin configuration
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL ,
  
  // Razorpay theme configuration
  THEME: {
    color: '#4a90e2',
    backdrop_color: '#ffffff'
  },
  
  // Payment timeout (in seconds)
  TIMEOUT: 900, // 15 minutes
  
  // Supported payment methods
  PAYMENT_METHODS: {
    card: true,
    netbanking: true,
    wallet: true,
    upi: true,
    emi: false,
    paylater: true
  }
};

// Helper function to convert INR to paise
export const convertToPaise = (amountInINR) => {
  return Math.round(amountInINR * 100);
};

// Helper function to convert paise to INR
export const convertToINR = (amountInPaise) => {
  return (amountInPaise / 100).toFixed(2);
};

// Helper function to update registration fee (for internal configuration)
export const updateRegistrationFee = (newAmountInINR) => {
  PAYMENT_CONFIG.REGISTRATION_FEE = convertToPaise(newAmountInINR);
  console.log(`Registration fee updated to ₹${newAmountInINR}`);
};

// Initialize Razorpay instance
let razorpayInstance;

try {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  
  console.log('Razorpay initialized successfully');
} catch (error) {
  console.error('Failed to initialize Razorpay:', error);
}

export { razorpayInstance };

// Validation function for Razorpay credentials
export const validateRazorpayCredentials = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error(
      'Razorpay credentials not found. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment variables.'
    );
  }
  return true;
};

// Payment order options generator
export const generatePaymentOptions = (companyData, orderId) => {
  return {
    amount: PAYMENT_CONFIG.REGISTRATION_FEE,
    currency: PAYMENT_CONFIG.CURRENCY,
    receipt: `receipt_${orderId}`,
    payment_capture: 1, // Auto capture payment
    notes: {
      companyName: companyData.name,
      companyCode: companyData.companyCode,
      adminEmail: companyData.adminEmail,
      registrationDate: new Date().toISOString(),
      purpose: 'HRMS Registration Fee'
    }
  };
};

export default {
  PAYMENT_CONFIG,
  razorpayInstance,
  convertToPaise,
  convertToINR,
  updateRegistrationFee,
  validateRazorpayCredentials,
  generatePaymentOptions
};
