import RotatingShift, { rotatingShiftSchema } from '../models/RotatingShift.js';
import Notification from '../models/Notification.js';
import getModelForCompany from '../models/genericModelFactory.js';
import { notifyAdminHRManager } from './notificationController.js';

export const getAllShifts = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Fetching rotating shifts for company: ${companyCode}`);
    
    // Get company-specific RotatingShift model
    const CompanyRotatingShift = await getModelForCompany(companyCode, 'RotatingShift', rotatingShiftSchema);
    
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
    
    const shifts = await CompanyRotatingShift.find(queryObj).sort('-createdAt');
    res.status(200).json(shifts);
  } catch (error) {
    console.error('Error fetching rotating shifts:', error);
    res.status(500).json({ 
      error: 'Error fetching rotating shifts', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const getUserShifts = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ 
        error: 'Invalid request', 
        message: 'User ID is required' 
      });
    }
    
    console.log(`Fetching rotating shifts for user ${userId} in company: ${companyCode}`);
    
    // Get company-specific RotatingShift model
    const CompanyRotatingShift = await getModelForCompany(companyCode, 'RotatingShift', rotatingShiftSchema);
    
    const shifts = await CompanyRotatingShift.find({ userId }).sort('-createdAt');
    res.status(200).json(shifts);
  } catch (error) {
    console.error('Error fetching user rotating shifts:', error);
    res.status(500).json({ 
      error: 'Error fetching user rotating shifts', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const createShift = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    // Ensure userId is included in the request
    if (!req.body.userId) {
      return res.status(400).json({ 
        error: 'Invalid request', 
        message: 'User ID is required' 
      });
    }
    
    console.log(`Creating rotating shift for company: ${companyCode}`);
    
    // Get company-specific RotatingShift model
    const CompanyRotatingShift = await getModelForCompany(companyCode, 'RotatingShift', rotatingShiftSchema);
    
    const newShift = new CompanyRotatingShift({
      ...req.body,
      isForReview: true,
      isAllocated: req.body.isAllocated || false
    });
    
    const savedShift = await newShift.save();
    
    // Notify Admin/HR/Manager about the new rotating shift request
    try {
      const io = req.app.get('io');
      const message = `${req.body.name} has requested a rotating shift to ${req.body.requestedShift} from ${new Date(req.body.requestedDate).toLocaleDateString()} to ${new Date(req.body.requestedTill).toLocaleDateString()}`;
      await notifyAdminHRManager(companyCode, message, 'rotating-shift', 'pending', io);
    } catch (notificationError) {
      console.error('Error creating admin notification:', notificationError);
    }
    
    res.status(201).json(savedShift);
  } catch (error) {
    console.error('Error creating rotating shift:', error);
    res.status(400).json({ 
      error: 'Error creating rotating shift', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const updateShift = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Updating rotating shift for company: ${companyCode}`);
    
    // Get company-specific RotatingShift model
    const CompanyRotatingShift = await getModelForCompany(companyCode, 'RotatingShift', rotatingShiftSchema);
    
    // Find the shift first to check ownership
    const rotatingShift = await CompanyRotatingShift.findById(req.params.id);
    
    if (!rotatingShift) {
      return res.status(404).json({ 
        error: 'Not found', 
        message: 'Shift request not found' 
      });
    }
    
    // Check if the user owns this request (if userId is provided in the request)
    if (req.body.userId && rotatingShift.userId !== req.body.userId) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'You can only update your own requests' 
      });
    }
    
    const updatedShift = await CompanyRotatingShift.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    // If status changed, send notification
    if (req.body.status && req.body.status !== rotatingShift.status) {
      try {
        const statusText = req.body.status.toLowerCase();
        const notificationMessage = `Your rotating shift request has been updated to ${statusText}`;
        
        const notification = new Notification({
          message: notificationMessage,
          type: 'shift',
          userId: rotatingShift.userId,
          status: statusText,
          read: false,
          time: new Date()
        });
        
        await notification.save();
        
        const io = req.app.get('io');
        if (io) {
          io.to(rotatingShift.userId).emit('new-notification', notification);
        }
      } catch (notificationError) {
        console.error('Error creating status change notification:', notificationError);
      }
    }
    
    res.status(200).json(updatedShift);
  } catch (error) {
    console.error('Error updating rotating shift:', error);
    res.status(400).json({ 
      error: 'Error updating rotating shift', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const deleteShift = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Deleting rotating shift for company: ${companyCode}`);
    
    // Get company-specific RotatingShift model
    const CompanyRotatingShift = await getModelForCompany(companyCode, 'RotatingShift', rotatingShiftSchema);
    
    // Find the shift first to check ownership
    const rotatingShift = await CompanyRotatingShift.findById(req.params.id);
    
    if (!rotatingShift) {
      return res.status(404).json({ 
        error: 'Not found', 
        message: 'Shift request not found' 
      });
    }
    
    // Check if the user owns this request (if userId is provided in the query)
    if (req.query.userId && rotatingShift.userId !== req.query.userId) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'You can only delete your own requests' 
      });
    }
    
    await CompanyRotatingShift.findByIdAndDelete(req.params.id);
    
    // Optionally, notify user that their request was deleted by admin
    if (req.query.adminDeleted && rotatingShift.userId) {
      try {
        const notification = new Notification({
          message: `Your rotating shift request for ${new Date(rotatingShift.requestedDate).toLocaleDateString()} has been deleted by an administrator`,
          type: 'shift',
          userId: rotatingShift.userId,
          status: 'deleted',
          read: false,
          time: new Date()
        });
        
        await notification.save();
        
        const io = req.app.get('io');
        if (io) {
          io.to(rotatingShift.userId).emit('new-notification', notification);
        }
      } catch (notificationError) {
        console.error('Error creating deletion notification:', notificationError);
      }
    }
    
    res.status(200).json({ message: 'Shift deleted successfully' });
  } catch (error) {
    console.error('Error deleting rotating shift:', error);
    res.status(400).json({ 
      error: 'Error deleting rotating shift', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const approveShift = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Approving rotating shift for company: ${companyCode}`);
    
    // Get company-specific RotatingShift model
    const CompanyRotatingShift = await getModelForCompany(companyCode, 'RotatingShift', rotatingShiftSchema);
    
    const shift = await CompanyRotatingShift.findById(req.params.id);
    
    if (!shift) {
      return res.status(404).json({ 
        error: 'Not found', 
        message: 'Shift request not found' 
      });
    }
    
    const updatedShift = await CompanyRotatingShift.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'Approved',
        isForReview: false,
        reviewedBy: req.body.reviewedBy || 'Admin',
        reviewedAt: new Date(),
        reviewComment: req.body.reviewComment || ''
      },
      { new: true }
    );
    
    // Create notification for the user
    if (shift.userId) {
      try {
        // Create a more detailed notification message
        const notificationMessage = `Your rotating shift request for ${new Date(shift.requestedDate).toLocaleDateString()} has been approved`;
        
        const notification = new Notification({
          message: notificationMessage,
          type: 'shift',
          userId: shift.userId,
          status: 'approved',
          read: false,
          time: new Date(),
          // Add additional context data if needed
          data: {
            requestId: shift._id,
            requestType: 'rotating-shift',
            requestDate: shift.requestedDate,
            requestedShift: shift.requestedShift,
            reviewComment: req.body.reviewComment || ''
          }
        });
        
                await notification.save();
        
        // Get the io instance from the request app
        const io = req.app.get('io');
        
        if (io) {
          // Emit to the specific user's room
          io.to(shift.userId).emit('new-notification', notification);
        }
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
      }
    }
    
    res.status(200).json(updatedShift);
  } catch (error) {
    console.error('Error approving rotating shift:', error);
    res.status(400).json({ 
      error: 'Error approving rotating shift', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const rejectShift = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Rejecting rotating shift for company: ${companyCode}`);
    
    // Get company-specific RotatingShift model
    const CompanyRotatingShift = await getModelForCompany(companyCode, 'RotatingShift', rotatingShiftSchema);
    
    const shift = await CompanyRotatingShift.findById(req.params.id);
    
    if (!shift) {
      return res.status(404).json({ 
        error: 'Not found', 
        message: 'Shift request not found' 
      });
    }
    
    const updatedShift = await CompanyRotatingShift.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'Rejected',
        isForReview: false,
        reviewedBy: req.body.reviewedBy || 'Admin',
        reviewedAt: new Date(),
        reviewComment: req.body.reviewComment || ''
      },
      { new: true }
    );
    
    // Create notification for the user
    if (shift.userId) {
      try {
        // Create a more detailed notification message
        const notificationMessage = `Your rotating shift request for ${new Date(shift.requestedDate).toLocaleDateString()} has been rejected`;
        
        const notification = new Notification({
          message: notificationMessage,
          type: 'shift',
          userId: shift.userId,
          status: 'rejected',
          read: false,
          time: new Date(),
          // Add additional context data if needed
          data: {
            requestId: shift._id,
            requestType: 'rotating-shift',
            requestDate: shift.requestedDate,
            requestedShift: shift.requestedShift,
            reviewComment: req.body.reviewComment || ''
          }
        });
        
        await notification.save();
        
        // Get the io instance from the request app
        const io = req.app.get('io');
        
        if (io) {
          // Emit to the specific user's room
          io.to(shift.userId).emit('new-notification', notification);
        }
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
      }
    }
    
    res.status(200).json(updatedShift);
  } catch (error) {
    console.error('Error rejecting rotating shift:', error);
    res.status(400).json({ 
      error: 'Error rejecting rotating shift', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const bulkApproveShifts = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Bulk approving rotating shifts for company: ${companyCode}`);
    
    // Get company-specific RotatingShift model
    const CompanyRotatingShift = await getModelForCompany(companyCode, 'RotatingShift', rotatingShiftSchema);
    
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid request', 
        message: 'No shift IDs provided for bulk approval' 
      });
    }
    
    // First get all shifts to send notifications
    const shifts = await CompanyRotatingShift.find({ _id: { $in: ids } });
    
    // Update all shifts
    await CompanyRotatingShift.updateMany(
      { _id: { $in: ids } },
      { 
        status: 'Approved',
        isForReview: false,
        reviewedBy: req.body.reviewedBy || 'Admin',
        reviewedAt: new Date(),
        reviewComment: req.body.reviewComment || ''
      }
    );
    
    // Send notifications for each shift
    const io = req.app.get('io');
    
    for (const shift of shifts) {
      if (shift.userId) {
        try {
          const notificationMessage = `Your rotating shift request for ${new Date(shift.requestedDate).toLocaleDateString()} has been approved`;
          
          const notification = new Notification({
            message: notificationMessage,
            type: 'shift',
            userId: shift.userId,
            status: 'approved',
            read: false,
            time: new Date()
          });
          
          await notification.save();
          
          if (io) {
            io.to(shift.userId).emit('new-notification', notification);
          }
        } catch (error) {
          console.error('Error sending notification:', error);
        }
      }
    }
    
    res.status(200).json({ message: `${ids.length} shifts approved successfully` });
  } catch (error) {
    console.error('Error bulk approving shifts:', error);
    res.status(400).json({ 
      error: 'Error bulk approving shifts', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const bulkRejectShifts = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Bulk rejecting rotating shifts for company: ${companyCode}`);
    
    // Get company-specific RotatingShift model
    const CompanyRotatingShift = await getModelForCompany(companyCode, 'RotatingShift', rotatingShiftSchema);
    
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid request', 
        message: 'No shift IDs provided for bulk rejection' 
      });
    }
    
    // First get all shifts to send notifications
    const shifts = await CompanyRotatingShift.find({ _id: { $in: ids } });
    
    // Update all shifts
    await CompanyRotatingShift.updateMany(
      { _id: { $in: ids } },
      { 
        status: 'Rejected',
        isForReview: false,
        reviewedBy: req.body.reviewedBy || 'Admin',
        reviewedAt: new Date(),
        reviewComment: req.body.reviewComment || ''
      }
    );
    
    // Send notifications for each shift
    const io = req.app.get('io');
    
    for (const shift of shifts) {
      if (shift.userId) {
        try {
          const notificationMessage = `Your rotating shift request for ${new Date(shift.requestedDate).toLocaleDateString()} has been rejected`;
          
          const notification = new Notification({
            message: notificationMessage,
            type: 'shift',
            userId: shift.userId,
            status: 'rejected',
            read: false,
            time: new Date()
          });
          
          await notification.save();
          
          if (io) {
            io.to(shift.userId).emit('new-notification', notification);
          }
        } catch (error) {
          console.error('Error sending notification:', error);
        }
      }
    }
    
    res.status(200).json({ message: `${ids.length} shifts rejected successfully` });
  } catch (error) {
    console.error('Error bulk rejecting shifts:', error);
    res.status(400).json({ 
      error: 'Error bulk rejecting shifts', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

