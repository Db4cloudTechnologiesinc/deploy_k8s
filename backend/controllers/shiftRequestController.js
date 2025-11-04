import ShiftRequest, { shiftRequestSchema } from '../models/ShiftRequest.js';
import Notification from '../models/Notification.js';
import getModelForCompany from '../models/genericModelFactory.js';
import { notifyAdminHRManager } from './notificationController.js';

export const getAllShiftRequests = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Fetching shift requests for company: ${companyCode}`);
    
    // Get company-specific ShiftRequest model
    const CompanyShiftRequest = await getModelForCompany(companyCode, 'ShiftRequest', shiftRequestSchema);
    
    const { isForReview, userId } = req.query;
    
    // Build the query object
    const queryObj = {};
    
    // Add isForReview filter if provided
    if (isForReview === 'true' || isForReview === 'false') {
      queryObj.isForReview = isForReview === 'true';
    }
    
    // Add userId filter if provided
    if (userId) {
      queryObj.userId = userId;
    }
    
    const shifts = await CompanyShiftRequest.find(queryObj).sort('-createdAt');
    res.status(200).json(shifts);
  } catch (error) {
    console.error('Error fetching shift requests:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getUserShiftRequests = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Fetching user shift requests for company: ${companyCode}`);
    
    // Get company-specific ShiftRequest model
    const CompanyShiftRequest = await getModelForCompany(companyCode, 'ShiftRequest', shiftRequestSchema);
    
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const shifts = await CompanyShiftRequest.find({ userId }).sort('-createdAt');
    res.status(200).json(shifts);
  } catch (error) {
    console.error('Error fetching user shift requests:', error);
    res.status(500).json({ message: error.message });
  }
};

export const createShiftRequest = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Creating shift request for company: ${companyCode}`);
    
    // Get company-specific ShiftRequest model
    const CompanyShiftRequest = await getModelForCompany(companyCode, 'ShiftRequest', shiftRequestSchema);
    
    // Ensure userId is included in the request
    if (!req.body.userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const newShiftRequest = new CompanyShiftRequest({
      userId: req.body.userId,
      name: req.body.name,
      employeeCode: req.body.employeeCode,
      requestedShift: req.body.requestedShift,
      currentShift: req.body.currentShift,
      requestedDate: req.body.requestedDate,
      requestedTill: req.body.requestedTill,
      description: req.body.description,
      isPermanentRequest: req.body.isPermanentRequest,
      isForReview: true, // Always set to true for new requests
      isAllocated: req.body.isAllocated || false
    });
    
    const savedRequest = await newShiftRequest.save();
    
    // Notify Admin/HR/Manager about the new request
    const io = req.app.get('io');
    const message = `${req.body.name} has requested a shift change to ${req.body.requestedShift} from ${new Date(req.body.requestedDate).toLocaleDateString()} to ${new Date(req.body.requestedTill).toLocaleDateString()}`;
    await notifyAdminHRManager(companyCode, message, 'shift', 'pending', io);
    
    res.status(201).json(savedRequest);
  } catch (error) {
    console.error('Error creating shift request:', error);
    res.status(400).json({ message: error.message });
  }
};

export const updateShiftRequest = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Updating shift request for company: ${companyCode}`);
    
    // Get company-specific ShiftRequest model
    const CompanyShiftRequest = await getModelForCompany(companyCode, 'ShiftRequest', shiftRequestSchema);
    
    // Find the request first to check ownership
    const shiftRequest = await CompanyShiftRequest.findById(req.params.id);
    
    if (!shiftRequest) {
      return res.status(404).json({ message: 'Shift request not found' });
    }
    
    // Check if the user owns this request (if userId is provided in the request)
    if (req.body.userId && shiftRequest.userId !== req.body.userId && !isAdmin(req)) {
      return res.status(403).json({ message: 'You can only update your own requests' });
    }
    
    const updatedRequest = await CompanyShiftRequest.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    res.status(200).json(updatedRequest);
  } catch (error) {
    console.error('Error updating shift request:', error);
    res.status(400).json({ message: error.message });
  }
};

export const deleteShiftRequest = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Deleting shift request for company: ${companyCode}`);
    
    // Get company-specific ShiftRequest model
    const CompanyShiftRequest = await getModelForCompany(companyCode, 'ShiftRequest', shiftRequestSchema);
    
    // Find the request first to check ownership
    const shiftRequest = await CompanyShiftRequest.findById(req.params.id);
    
    if (!shiftRequest) {
      return res.status(404).json({ message: 'Shift request not found' });
    }
    
    // Check if the user owns this request (if userId is provided in the query)
    if (req.query.userId && shiftRequest.userId !== req.query.userId && !isAdmin(req)) {
      return res.status(403).json({ message: 'You can only delete your own requests' });
    }
    
    await CompanyShiftRequest.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Shift request deleted successfully' });
  } catch (error) {
    console.error('Error deleting shift request:', error);
    res.status(400).json({ message: error.message });
  }
};

export const approveShiftRequest = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Approving shift request for company: ${companyCode}`);
    
    // Get company-specific ShiftRequest model
    const CompanyShiftRequest = await getModelForCompany(companyCode, 'ShiftRequest', shiftRequestSchema);
    
    // Find the request first to get user information
    const shiftRequest = await CompanyShiftRequest.findById(req.params.id);
    
    if (!shiftRequest) {
      return res.status(404).json({ message: 'Shift request not found' });
    }
    
    // Store the previous status to check if it changed
    const previousStatus = shiftRequest.status;
    
    // Update the request to approved status and remove from review if specified
    const updateData = { 
      status: 'Approved',
      // If isForReview is specified in the request body, use that value
      ...(req.body.hasOwnProperty('isForReview') && { isForReview: req.body.isForReview }),
      reviewedBy: req.body.reviewedBy || 'Admin',
      reviewedAt: new Date()
    };
    
    const request = await CompanyShiftRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    // If status changed to Approved, create a notification
    if (previousStatus !== 'Approved' && shiftRequest.userId) {
      // Create notification message
      const notificationMessage = `Your shift request for ${new Date(shiftRequest.requestedDate).toLocaleDateString()} has been approved`;
      
      try {
        // Create notification in database
        const notification = new Notification({
          message: notificationMessage,
          type: 'shift',
          userId: shiftRequest.userId,
          status: 'approved',
          read: false,
          time: new Date()
        });
        
        await notification.save();
        console.log(`Notification saved to database for user ${shiftRequest.userId}`);
        
        // Get the io instance from the request app
        const io = req.app.get('io');
        
        if (io) {
          // Emit to the specific user's room
          io.to(shiftRequest.userId).emit('new-notification', notification);
          console.log(`Socket notification emitted to user ${shiftRequest.userId}`);
        } else {
          console.error('Socket.io instance not available');
        }
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
      }
    }
    
    res.status(200).json(request);
  } catch (error) {
    console.error('Error approving shift request:', error);
    res.status(400).json({ message: error.message });
  }
};

export const rejectShiftRequest = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Rejecting shift request for company: ${companyCode}`);
    
    // Get company-specific ShiftRequest model
    const CompanyShiftRequest = await getModelForCompany(companyCode, 'ShiftRequest', shiftRequestSchema);
    
    // Find the request first to get user information
    const shiftRequest = await CompanyShiftRequest.findById(req.params.id);
    
    if (!shiftRequest) {
      return res.status(404).json({ message: 'Shift request not found' });
    }
    
    // Store the previous status to check if it changed
    const previousStatus = shiftRequest.status;
    
    // Update the request to rejected status and remove from review if specified
    const updateData = { 
      status: 'Rejected',
      // If isForReview is specified in the request body, use that value
      ...(req.body.hasOwnProperty('isForReview') && { isForReview: req.body.isForReview }),
      reviewedBy: req.body.reviewedBy || 'Admin',
      reviewedAt: new Date()
    };
    
    const request = await CompanyShiftRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    // If status changed to Rejected, create a notification
    if (previousStatus !== 'Rejected' && shiftRequest.userId) {
      // Create notification message
      const notificationMessage = `Your shift request for ${new Date(shiftRequest.requestedDate).toLocaleDateString()} has been rejected`;
      
      try {
        // Create notification in database
        const notification = new Notification({
          message: notificationMessage,
          type: 'shift',
          userId: shiftRequest.userId,
          status: 'rejected',
          read: false,
          time: new Date()
        });
        
        await notification.save();
        console.log(`Notification saved to database for user ${shiftRequest.userId}`);
        
        // Get the io instance from the request app
        const io = req.app.get('io');
        
                if (io) {
          // Emit to the specific user's room
          io.to(shiftRequest.userId).emit('new-notification', notification);
          console.log(`Socket notification emitted to user ${shiftRequest.userId}`);
        } else {
          console.error('Socket.io instance not available');
        }
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
      }
    }
    
    res.status(200).json(request);
  } catch (error) {
    console.error('Error rejecting shift request:', error);
    res.status(400).json({ message: error.message });
  }
};

export const bulkApproveRequests = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Bulk approving shift requests for company: ${companyCode}`);
    
    // Get company-specific ShiftRequest model
    const CompanyShiftRequest = await getModelForCompany(companyCode, 'ShiftRequest', shiftRequestSchema);
    
    const { requestIds } = req.body;
    
    if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
      return res.status(400).json({ message: 'Request IDs array is required' });
    }
    
    // Update all requests to approved status
    const updateData = { 
      status: 'Approved',
      isForReview: false,
      reviewedBy: req.body.reviewedBy || 'Admin',
      reviewedAt: new Date()
    };
    
    // Find all requests first to get user information for notifications
    const shiftRequests = await CompanyShiftRequest.find({ _id: { $in: requestIds } });
    
    // Update all requests
    const result = await CompanyShiftRequest.updateMany(
      { _id: { $in: requestIds } },
      updateData
    );
    
    // Create notifications for all approved requests
    const notifications = [];
    
    for (const request of shiftRequests) {
      if (request.status !== 'Approved' && request.userId) {
        // Create notification message
        const notificationMessage = `Your shift request for ${new Date(request.requestedDate).toLocaleDateString()} has been approved`;
        
        try {
          // Create notification in database
          const notification = new Notification({
            message: notificationMessage,
            type: 'shift',
            userId: request.userId,
            status: 'approved',
            read: false,
            time: new Date()
          });
          
          await notification.save();
          notifications.push(notification);
          
          // Get the io instance from the request app
          const io = req.app.get('io');
          
          if (io) {
            // Emit to the specific user's room
            io.to(request.userId).emit('new-notification', notification);
          }
        } catch (notificationError) {
          console.error('Error creating notification:', notificationError);
        }
      }
    }
    
    res.status(200).json({ 
      message: `${result.modifiedCount} shift requests approved successfully`,
      notifications
    });
  } catch (error) {
    console.error('Error bulk approving shift requests:', error);
    res.status(400).json({ message: error.message });
  }
};

export const bulkRejectRequests = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Bulk rejecting shift requests for company: ${companyCode}`);
    
    // Get company-specific ShiftRequest model
    const CompanyShiftRequest = await getModelForCompany(companyCode, 'ShiftRequest', shiftRequestSchema);
    
    const { requestIds } = req.body;
    
    if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
      return res.status(400).json({ message: 'Request IDs array is required' });
    }
    
    // Update all requests to rejected status
    const updateData = { 
      status: 'Rejected',
      isForReview: false,
      reviewedBy: req.body.reviewedBy || 'Admin',
      reviewedAt: new Date()
    };
    
    // Find all requests first to get user information for notifications
    const shiftRequests = await CompanyShiftRequest.find({ _id: { $in: requestIds } });
    
    // Update all requests
    const result = await CompanyShiftRequest.updateMany(
      { _id: { $in: requestIds } },
      updateData
    );
    
    // Create notifications for all rejected requests
    const notifications = [];
    
    for (const request of shiftRequests) {
      if (request.status !== 'Rejected' && request.userId) {
        // Create notification message
        const notificationMessage = `Your shift request for ${new Date(request.requestedDate).toLocaleDateString()} has been rejected`;
        
        try {
          // Create notification in database
          const notification = new Notification({
            message: notificationMessage,
            type: 'shift',
            userId: request.userId,
            status: 'rejected',
            read: false,
            time: new Date()
          });
          
          await notification.save();
          notifications.push(notification);
          
          // Get the io instance from the request app
          const io = req.app.get('io');
          
          if (io) {
            // Emit to the specific user's room
            io.to(request.userId).emit('new-notification', notification);
          }
        } catch (notificationError) {
          console.error('Error creating notification:', notificationError);
        }
      }
    }
    
    res.status(200).json({ 
      message: `${result.modifiedCount} shift requests rejected successfully`,
      notifications
    });
  } catch (error) {
    console.error('Error bulk rejecting shift requests:', error);
    res.status(400).json({ message: error.message });
  }
};

// Helper function to check if a user is an admin
const isAdmin = (req) => {
  // This is a placeholder - implement your actual admin check logic
  return req.user && req.user.role === 'admin';
};



