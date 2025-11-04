import TimeOffRequest, { timeOffRequestSchema } from '../models/TimeOffRequest.js';
import Notification from '../models/Notification.js';
import getModelForCompany from '../models/genericModelFactory.js';
import { notifyAdminHRManager } from './notificationController.js';

// Get all time off requests
export const getAllRequests = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Fetching time off requests for company: ${companyCode}`);
    
    // Get company-specific TimeOffRequest model
    const CompanyTimeOffRequest = await getModelForCompany(companyCode, 'TimeOffRequest', timeOffRequestSchema);
    
    const { searchTerm, status } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (searchTerm) {
      filter.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { empId: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    // Get requests from company database
    const requests = await CompanyTimeOffRequest.find(filter).sort({ createdAt: -1 });
    
    console.log(`Retrieved ${requests.length} time off requests for company ${companyCode}`);
    res.status(200).json(requests);
  } catch (error) {
    console.error(`Error fetching time off requests for company ${req.companyCode}:`, error);
    res.status(500).json({ 
      error: 'Error fetching time off requests', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get time off requests by user ID
export const getRequestsByUserId = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    const { userId } = req.params;
    const { searchTerm, status } = req.query;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'Invalid request', 
        message: 'User ID is required' 
      });
    }
    
    console.log(`Fetching time off requests for user ${userId} in company: ${companyCode}`);
    
    // Get company-specific TimeOffRequest model
    const CompanyTimeOffRequest = await getModelForCompany(companyCode, 'TimeOffRequest', timeOffRequestSchema);
    
    // Build filter object
    const filter = { userId };
    
    if (searchTerm) {
      filter.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { empId: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    // Get requests from company database
    const requests = await CompanyTimeOffRequest.find(filter).sort({ createdAt: -1 });
    
    console.log(`Retrieved ${requests.length} time off requests for user ${userId} in company ${companyCode}`);
    res.status(200).json(requests);
  } catch (error) {
    console.error(`Error fetching user requests for company ${req.companyCode}:`, error);
    res.status(500).json({ 
      error: 'Error fetching user requests', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Create a new time off request
export const createRequest = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Creating time off request for company: ${companyCode}`);
    
    // Get company-specific TimeOffRequest model
    const CompanyTimeOffRequest = await getModelForCompany(companyCode, 'TimeOffRequest', timeOffRequestSchema);
    
    // Validate required fields
    const requiredFields = ['name', 'empId', 'userId', 'date', 'day', 'checkIn', 'checkOut', 'shift', 'workType', 'minHour', 'atWork'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    const requestData = {
      ...req.body,
      date: new Date(req.body.date),
      minHour: Number(req.body.minHour),
      atWork: Number(req.body.atWork),
      overtime: Number(req.body.overtime) || 0
    };
    
    // Create new request in company database
    const newRequest = new CompanyTimeOffRequest(requestData);
    const savedRequest = await newRequest.save();
    
    console.log(`Time off request created successfully for ${req.body.name}`);
    
    // Notify Admin/HR/Manager about the new time off request
    try {
      const io = req.app.get('io');
      const message = `${req.body.name} has requested time off for ${req.body.day} on ${new Date(req.body.date).toLocaleDateString()}`;
      await notifyAdminHRManager(companyCode, message, 'timeoff', 'pending', io);
    } catch (notificationError) {
      console.error('Error notifying admin/hr/manager:', notificationError);
    }
    
    res.status(201).json(savedRequest);
  } catch (error) {
    console.error('Error creating time off request:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message,
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    
    if (error.name === 'MongoServerError' && error.code === 11000) {
      return res.status(409).json({
        error: 'Duplicate entry',
        message: 'A time off request with these details already exists'
      });
    }
    
    res.status(500).json({ 
      error: 'Error creating time off request', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get a specific time off request by ID
export const getRequestById = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ 
        error: 'Invalid request', 
        message: 'Request ID is required' 
      });
    }
    
    console.log(`Fetching time off request ${id} for company: ${companyCode}`);
    
    // Get company-specific TimeOffRequest model
    const CompanyTimeOffRequest = await getModelForCompany(companyCode, 'TimeOffRequest', timeOffRequestSchema);
    
    // Get request from company database
    const request = await CompanyTimeOffRequest.findById(id);
    
    if (!request) {
      return res.status(404).json({ 
        error: 'Time off request not found',
        message: `No time off request found with ID: ${id}`
      });
    }
    
    console.log(`Retrieved time off request ${id} for company ${companyCode}`);
    res.status(200).json(request);
  } catch (error) {
    console.error(`Error fetching time off request ${req.params.id} for company ${req.companyCode}:`, error);
    
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({
        error: 'Invalid ID',
        message: 'The provided request ID is not valid'
      });
    }
    
    res.status(500).json({ 
      error: 'Error fetching time off request', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Update a time off request
export const updateRequest = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ 
        error: 'Invalid request', 
        message: 'Request ID is required' 
      });
    }
    
    console.log(`Updating time off request ${id} for company: ${companyCode}`);
    
    // Get company-specific TimeOffRequest model
    const CompanyTimeOffRequest = await getModelForCompany(companyCode, 'TimeOffRequest', timeOffRequestSchema);
    
    // Get the time off request
    const timeOffRequest = await CompanyTimeOffRequest.findById(id);
    if (!timeOffRequest) {
      return res.status(404).json({ 
        error: 'Request not found',
        message: `No time off request found with ID: ${id}`
      });
    }
    
    // Store the previous status to check if it changed
    const previousStatus = timeOffRequest.status;
    
    // Update request in company database with validation
    const updatedRequest = await CompanyTimeOffRequest.findByIdAndUpdate(
      id,
      { 
        ...req.body,
        // If status is being updated, add reviewer info and timestamp
        ...(req.body.status && req.body.status !== previousStatus ? {
          reviewedBy: req.body.reviewedBy,
          reviewedAt: new Date()
        } : {})
      },
      { 
        new: true,
        runValidators: true // This ensures validation runs on update
      }
    );
    
    // If status changed to Approved or Rejected, create a notification
    if (req.body.status && req.body.status !== previousStatus && 
        (req.body.status === 'Approved' || req.body.status === 'Rejected') && 
        timeOffRequest.userId) {
      
      // Create notification message
      const notificationMessage = `Your time off request for ${new Date(timeOffRequest.date).toLocaleDateString()} has been ${req.body.status.toLowerCase()}`;
      
      try {
        // Get company-specific Notification model
        const CompanyNotification = await getModelForCompany(companyCode, 'Notification', Notification.schema);
        
        // Create notification in company database
        const notification = new CompanyNotification({
          message: notificationMessage,
          type: 'timesheet',
          userId: timeOffRequest.userId,
          status: req.body.status.toLowerCase(),
          read: false,
          time: new Date()
        });
        
        await notification.save();
        console.log(`Notification saved to database for user ${timeOffRequest.userId}`);
        
        // Get the io instance from the request app
        const io = req.app.get('io');
        
        if (io) {
          // Emit to the specific user's room
          io.to(timeOffRequest.userId).emit('new-notification', notification);
          console.log(`Socket notification emitted to user ${timeOffRequest.userId}`);
        } else {
          console.error('Socket.io instance not available');
        }
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
      }
    }
    
    console.log(`Time off request ${id} updated successfully`);
    res.status(200).json(updatedRequest);
  } catch (error) {
    console.error(`Error updating time off request ${req.params.id}:`, error);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message,
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({
        error: 'Invalid ID',
        message: 'The provided request ID is not valid'
      });
    }
    
    res.status(500).json({ 
      error: 'Error updating time off request', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Delete a time off request
export const deleteRequest = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ 
        error: 'Invalid request', 
        message: 'Request ID is required' 
      });
    }
    
    console.log(`Deleting time off request ${id} for company: ${companyCode}`);
    
    // Get company-specific TimeOffRequest model
    const CompanyTimeOffRequest = await getModelForCompany(companyCode, 'TimeOffRequest', timeOffRequestSchema);
    
    // Delete request from company database
    const deletedRequest = await CompanyTimeOffRequest.findByIdAndDelete(id);
    
    if (!deletedRequest) {
      return res.status(404).json({ 
        error: 'Time off request not found',
        message: `No time off request found with ID: ${id}`
      });
    }
    
    console.log(`Time off request ${id} deleted successfully`);
    res.status(200).json({ message: 'Time off request deleted successfully' });
  } catch (error) {
    console.error(`Error deleting time off request ${req.params.id}:`, error);
    
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({
        error: 'Invalid ID',
        message: 'The provided request ID is not valid'
      });
    }
    
    res.status(500).json({ 
      error: 'Error deleting time off request', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get time off request statistics
export const getRequestStats = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Fetching time off request statistics for company: ${companyCode}`);
    
    // Get company-specific TimeOffRequest model
    const CompanyTimeOffRequest = await getModelForCompany(companyCode, 'TimeOffRequest', timeOffRequestSchema);
    
    // Get counts by status
    const pendingCount = await CompanyTimeOffRequest.countDocuments({ status: 'Pending' });
    const approvedCount = await CompanyTimeOffRequest.countDocuments({ status: 'Approved' });
    const rejectedCount = await CompanyTimeOffRequest.countDocuments({ status: 'Rejected' });
    
    // Get total count
    const totalCount = pendingCount + approvedCount + rejectedCount;
    
    // Get recent requests
    const recentRequests = await CompanyTimeOffRequest.find()
      .sort({ createdAt: -1 })
      .limit(5);
    
    console.log(`Retrieved time off request statistics for company ${companyCode}`);
    res.status(200).json({
      totalCount,
      pendingCount,
      approvedCount,
      rejectedCount,
      recentRequests
    });
  } catch (error) {
    console.error(`Error fetching time off request statistics for company ${req.companyCode}:`, error);
    res.status(500).json({ 
      error: 'Error fetching time off request statistics', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

