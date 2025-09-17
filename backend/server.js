import dotenv from 'dotenv';
dotenv.config();

import express from "express"
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname} from "path";
import { Server } from 'socket.io';
import http from 'http';
import { connectMainDB } from './config/db.js';
import employeesRouter from './routes/employeesRouter.js'
import authRouter from './routes/authRouter.js'
import profileRouter from './routes/profileRouter.js'
import applicantProfileRoutes from './routes/applicantProfileRoutes.js'
import candidateRoutes from './routes/candidateRoutes.js'
import employeeRoutes from './routes/employeeRoutes.js'
import interviewRoutes from './routes/interviewRoutes.js'
import skillZoneRoutes from './routes/skillZoneRoutes.js'
import surveyRoutes from './routes/surveyRoutes.js'
import assetDashboardRoutes from './routes/assetDashboardRoutes.js';
import assetBatchRoutes from './routes/assetBatchRoutes.js';
import assetRoutes from './routes/assetHistory.js';
import faqCategoryRoutes from './routes/faqCategoryRoutes.js';
import faqRoutes from './routes/faqRoutes.js';
import companyHolidaysRoute from './routes/companyHolidays.js';
import restrictLeaveRoutes from './routes/restrictLeaveRoutes.js';
import holidayRoutes from './routes/holidays.js';
import shiftRequestRoutes from './routes/shiftRequestRoutes.js';
import workTypeRequestRoutes from './routes/workTypeRequestRoutes.js';
import onboardingRoutes from './routes/onboardingRoutes.js';
import hiredEmployeeRoutes from './routes/hiredEmployeeRoutes.js';
import timesheetRoutes from './routes/timesheetRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import { authenticate, companyFilter } from './middleware/companyAuth.js';
import invitationRoutes from './routes/invitationRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { startAllJobs } from './Jobs/index.js'; // Import the job scheduler
import { startExpiryReminderScheduler } from './Jobs/paymentExpiryScheduler.js';
import objectiveRoutes from './routes/objectiveRoutes.js';
import offboardingRoutes from './routes/offboardingRoutes.js';
import resignationRoutes from './routes/resignationRoutes.js';
import Feedback from './routes/feedbackRoutes.js';
import payrollContractRoutes from './routes/payrollContractRoutes.js';
import payrollRoutes from './routes/PayrollRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import policyRoutes from './routes/policyRoutes.js';
import organizationRoutes from './routes/organizationRoutes.js';
import disciplinaryActionRoutes from './routes/disciplinaryActions.js'; 
import timeOffRequestRoutes from './routes/timeOffRequests.js'; 
import rotatingShiftRoutes from './routes/rotatingShiftRoutes.js';
import rotatingWorktypeRoutes from './routes/rotatingWorktypeRoutes.js';
import myLeaveRequestRoutes from './routes/myLeaveRequestRoutes.js';
import leaveRequestRoutes from './routes/leaveRequestRoutes.js';
import s3Routes from './routes/s3Routes.js';
import { printStartupDiagnostics, printSocketDiagnostics, checkMissingEnvVars } from './utils/diagnostics.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);





// Print startup diagnostics
printStartupDiagnostics();
checkMissingEnvVars();

// Connect to the main database with error handling and retry
(async function setupDatabase() {
  try {
    console.log('Initializing database connection...');
    await connectMainDB();
    console.log('Main database connection established successfully');
  } catch (error) {
    console.error('Failed to connect to the main database:', error.message);
    console.log('Server will continue to run and retry connections as needed');
    // The server will continue running and connections will be retried when needed
  }
})();

const app = express();
app.set('trust proxy', true); // which enable ALB/ELB to pass the real IP address of the client

// // Start scheduled jobs after server setup
// startAllJobs();

// Add a graceful shutdown handler
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  const { closeAllConnections } = await import('./config/db.js');
  await closeAllConnections();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  const { closeAllConnections } = await import('./config/db.js');
  await closeAllConnections();
  process.exit(0);
});

// Create HTTP server
const server = http.createServer(app);

// Middleware to parse JSON request bodies
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',')  ;

// Socket.IO setup with enhanced CORS
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow no-origin (Postman, mobile apps)

      // Always allow local development origins
      const lowerOrigin = origin.toLowerCase();
      if (lowerOrigin.includes('localhost') || lowerOrigin.includes('0.0.0.0')) {
        return callback(null, true);
      }

      // Check whitelist
      const normalizedAllowed = allowedOrigins.map(o => o.toLowerCase());
      if (normalizedAllowed.includes(lowerOrigin)) {
        return callback(null, true);
      }

      // Not allowed (for debugging, still calling callback(null,true) to allow)
      console.log(`Socket.IO CORS blocked: ${origin}`);
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "x-company-code", "X-Company-Code"]
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Handle Socket.IO events
io.on('connection', (socket) => {
  console.log('📡 Socket.IO: User connected', socket.id);
  
  // Join a user-specific room
  socket.on('join', (data) => {
    let userId = null;
    if (typeof data === 'object' && data.userId) {
      userId = data.userId;
    } else if (typeof data === 'string') {
      userId = data;
    }
    if (userId) {
      socket.join(userId);
      console.log(`📡 Socket.IO: User ${userId} joined room ${userId}`);
      socket.emit('joined', { userId, message: 'Successfully joined notification room' });
    } else {
      console.error('📡 Socket.IO: Invalid join data:', data);
      socket.emit('error', { message: 'Invalid user data for joining room' });
    }
  });

  socket.on('error', (error) => {
    console.error('📡 Socket.IO: Socket error:', error);
  });

  socket.on('disconnect', (reason) => {
    console.log('📡 Socket.IO: User disconnected:', socket.id, 'Reason:', reason);
  });

  socket.on('ping', () => {
    socket.emit('pong');
  });
});

// Print Socket.IO diagnostics
printSocketDiagnostics(allowedOrigins);

// CORS settings for Express routes
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow no-origin

    const lowerOrigin = origin.toLowerCase();
    const normalizedAllowed = allowedOrigins.map(o => o.toLowerCase());

    // Always allow localhost
    if (lowerOrigin.includes('localhost') || lowerOrigin.includes('0.0.0.0')) {
      return callback(null, true);
    }

    if (normalizedAllowed.includes(lowerOrigin)) {
      return callback(null, true);
    } else {
      console.error(`Blocked by CORS: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Access-Control-Allow-Methods",
    "Access-Control-Allow-Origin",
    "X-Company-Code",
    "x-company-code"
  ]
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Error handling middleware (catches internal errors)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Parse JSON request bodies
app.use(express.json());

// Static files middleware (must come before protected routes)
app.use('/uploads', (req, res, next) => {
  // Allow cross-origin GET/OPTIONS
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');

  // Handle preflight for static files
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  // Set proper content types and cache headers for images
  if (req.path.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    res.header('Cache-Control', 'public, max-age=86400');
    if (req.path.match(/\.(jpg|jpeg)$/i)) {
      res.header('Content-Type', 'image/jpeg');
    } else if (req.path.match(/\.png$/i)) {
      res.header('Content-Type', 'image/png');
    }
  }
  
  next();
}, express.static('uploads', {
  etag: false,
  setHeaders: function (res, path, stat) {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads', 'contracts');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads/contracts directory');
}


// Health check endpoint (no auth required)
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'hrms-backend'
  });
});

app.use('/api/users', userRoutes);

// IMPORTANT: Do NOT apply authentication middleware globally here
// Instead, apply it within each route file for protected routes only

// Public routes - no authentication required
app.use("/api/auth", authRouter);
app.use("/api/companies", companyRoutes); // Company routes handle their own authentication

// CRITICAL: Payment routes MUST be here (before ANY routes with authentication middleware)
app.use('/api/payments', (req, res, next) => {
  console.log(`🔓 PAYMENT ROUTE: ${req.method} ${req.url} - NO AUTH REQUIRED`);
  console.log(`🔗 Origin: ${req.headers.origin || 'unknown'}`);
  console.log(`🔑 Authorization header: ${req.headers.authorization ? 'PRESENT (IGNORING)' : 'NOT PRESENT'}`);
  next();
}, paymentRoutes);

// Protected routes - these routes should handle their own authentication
app.use("/api/employees", employeesRouter);
app.use("/api/profiles", profileRouter);
app.use(candidateRoutes);
app.use(surveyRoutes);
app.use('/api/applicantProfiles', applicantProfileRoutes);
app.use('/api/interviews', interviewRoutes);
app.use(skillZoneRoutes);
app.use('/api/employees',employeeRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/dashboard', assetDashboardRoutes);
app.use('/api/asset-batches', assetBatchRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/companyHolidays', companyHolidaysRoute);
app.use('/api/restrictLeaves', restrictLeaveRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/faqCategories', faqCategoryRoutes);
app.use('/api/hired-employees', hiredEmployeeRoutes);
app.use('/api/shift-request', shiftRequestRoutes);
app.use('/api/work-type-requests', workTypeRequestRoutes);
app.use('/api/timesheet', timesheetRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payroll-contracts', payrollContractRoutes);
app.use('/api/objectives', objectiveRoutes);
app.use('/api/feedback', Feedback);
app.use('/api/offboarding', offboardingRoutes);
app.use('/api/resignations', resignationRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api', documentRoutes);
app.use('/api', policyRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/disciplinary-actions', disciplinaryActionRoutes)
app.use('/api/time-off-requests', timeOffRequestRoutes);
app.use('/api/rotating-shift', rotatingShiftRoutes);
app.use('/api/rotating-worktype', rotatingWorktypeRoutes);
app.use('/api/leave-requests', myLeaveRequestRoutes);
app.use('/api/leave-requests', leaveRequestRoutes);
app.use('/api/s3', s3Routes);

// Payment routes already registered above as public routes

// User management routes
app.use('/api/roles', roleRoutes);
app.use('/api/invitations', invitationRoutes);

// After creating the io instance
app.set('io', io);

app.use('/api/roles', roleRoutes);

const PORT = process.env.PORT || 5002;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✨ Server running on port 0.0.0.0:${PORT}`);
  
  // Start payment expiry reminder scheduler
  try {
    startExpiryReminderScheduler();
  } catch (error) {
    console.error('Failed to start payment expiry scheduler:', error);
  }
});
