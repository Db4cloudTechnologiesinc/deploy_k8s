import WorkTypeRequest, { workTypeRequestSchema } from '../models/WorkTypeRequest.js';
import Notification from '../models/Notification.js';
import getModelForCompany from '../models/genericModelFactory.js';
import { notifyAdminHRManager } from './notificationController.js';

export const getWorkTypeRequestsByUserId = async (req, res) => {
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
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    console.log(`Fetching work type requests for user ${userId} in company: ${companyCode}`);
    
    // Get company-specific WorkTypeRequest model
    const CompanyWorkTypeRequest = await getModelForCompany(companyCode, 'WorkTypeRequest', workTypeRequestSchema);
    
    // Only return requests made by the specific user
    const requests = await CompanyWorkTypeRequest.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching user work type requests:', error);
    res.status(500).json({ message: 'Error fetching user work type requests', error: error.message });
  }
};

export const getAllWorkTypeRequests = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Fetching work type requests for company: ${companyCode}`);
    
    // Get company-specific WorkTypeRequest model
    const CompanyWorkTypeRequest = await getModelForCompany(companyCode, 'WorkTypeRequest', workTypeRequestSchema);
    
    // Check if this is for review (admin/hr/manager view)
    const { forReview } = req.query;
    
    let query = {};
    if (forReview === 'true') {
      // For review tab, show all requests (admin/hr/manager can see all)
      query = {};
    }
    
    const workTypeRequests = await CompanyWorkTypeRequest.find(query).sort({ createdAt: -1 });
    res.status(200).json(workTypeRequests);
  } catch (error) {
    console.error('Error fetching work type requests:', error);
    res.status(500).json({ message: 'Error fetching work type requests', error: error.message });
  }
};

export const createWorkTypeRequest = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Creating work type request for company: ${companyCode}`);
    
    // Get company-specific WorkTypeRequest model
    const CompanyWorkTypeRequest = await getModelForCompany(companyCode, 'WorkTypeRequest', workTypeRequestSchema);
    
    const newWorkTypeRequest = new CompanyWorkTypeRequest(req.body);
    const savedRequest = await newWorkTypeRequest.save();
    
    // Notify Admin/HR/Manager about the new work type request
    try {
      const io = req.app.get('io');
      const message = `${req.body.name} has requested a work type change to ${req.body.requestedWorkType} from ${new Date(req.body.requestedDate).toLocaleDateString()} to ${new Date(req.body.requestedTill).toLocaleDateString()}`;
      await notifyAdminHRManager(companyCode, message, 'worktype', 'pending', io);
    } catch (notificationError) {
      console.error('Error notifying admin/hr/manager:', notificationError);
    }
    
    res.status(201).json(savedRequest);
  } catch (error) {
    console.error('Error creating work type request:', error);
    res.status(500).json({ message: 'Error creating work type request', error: error.message });
  }
};

export const updateWorkTypeRequest = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Updating work type request for company: ${companyCode}`);
    
    // Get company-specific WorkTypeRequest model
    const CompanyWorkTypeRequest = await getModelForCompany(companyCode, 'WorkTypeRequest', workTypeRequestSchema);
    
    const updatedRequest = await CompanyWorkTypeRequest.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!updatedRequest) {
      return res.status(404).json({ message: 'Work type request not found' });
    }
    
    res.status(200).json(updatedRequest);
  } catch (error) {
    console.error('Error updating work type request:', error);
    res.status(500).json({ message: 'Error updating work type request', error: error.message });
  }
};

export const deleteWorkTypeRequest = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Deleting work type request for company: ${companyCode}`);
    
    // Get company-specific WorkTypeRequest model
    const CompanyWorkTypeRequest = await getModelForCompany(companyCode, 'WorkTypeRequest', workTypeRequestSchema);
    
    const deletedRequest = await CompanyWorkTypeRequest.findByIdAndDelete(req.params.id);
    
    if (!deletedRequest) {
      return res.status(404).json({ message: 'Work type request not found' });
    }
    
    res.status(200).json({ message: 'Work type request deleted successfully' });
  } catch (error) {
    console.error('Error deleting work type request:', error);
    res.status(500).json({ message: 'Error deleting work type request', error: error.message });
  }
};

export const approveWorkTypeRequest = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Approving work type request for company: ${companyCode}`);
    
    // Get company-specific WorkTypeRequest model
    const CompanyWorkTypeRequest = await getModelForCompany(companyCode, 'WorkTypeRequest', workTypeRequestSchema);
    
    const request = await CompanyWorkTypeRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Work type request not found' });
    }

    const previousStatus = request.status;
    
    const updatedRequest = await CompanyWorkTypeRequest.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'Approved',
        reviewedBy: req.body.reviewerName || 'Admin',
        reviewedAt: new Date()
      },
      { new: true }
    );

    // Create notification if status changed to Approved
    if (previousStatus !== 'Approved' && request.userId) {
      try {
        // Create notification message
        const notificationMessage = `Your work type request for ${new Date(request.requestedDate).toLocaleDateString()} has been approved`;
        
        // Create notification in database
        const notification = new Notification({
          message: notificationMessage,
          type: 'worktype',
          userId: request.userId,
          status: 'approved',
          read: false,
          time: new Date()
        });
        
        await notification.save();
        
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
    
    res.status(200).json(updatedRequest);
  } catch (error) {
    console.error('Error approving work type request:', error);
    res.status(500).json({ message: 'Error approving work type request', error: error.message });
  }
};

export const rejectWorkTypeRequest = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Rejecting work type request for company: ${companyCode}`);
    
    // Get company-specific WorkTypeRequest model
    const CompanyWorkTypeRequest = await getModelForCompany(companyCode, 'WorkTypeRequest', workTypeRequestSchema);
    
    const request = await CompanyWorkTypeRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Work type request not found' });
    }

    const previousStatus = request.status;
    
    const updatedRequest = await CompanyWorkTypeRequest.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'Rejected',
        reviewedBy: req.body.reviewerName || 'Admin',
        reviewedAt: new Date()
      },
      { new: true }
    );

    // Create notification if status changed to Rejected
    if (previousStatus !== 'Rejected' && request.userId) {
      try {
        // Create notification message
        const notificationMessage = `Your work type request for ${new Date(request.requestedDate).toLocaleDateString()} has been rejected`;
        
        // Create notification in database
        const notification = new Notification({
          message: notificationMessage,
          type: 'worktype',
          userId: request.userId,
          status: 'rejected',
          read: false,
          time: new Date()
        });
        
        await notification.save();
        
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
    
    res.status(200).json(updatedRequest);
  } catch (error) {
    console.error('Error rejecting work type request:', error);
    res.status(500).json({ message: 'Error rejecting work type request', error: error.message });
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
    
    console.log(`Bulk approving work type requests for company: ${companyCode}`);
    
    // Get company-specific WorkTypeRequest model
    const CompanyWorkTypeRequest = await getModelForCompany(companyCode, 'WorkTypeRequest', workTypeRequestSchema);
    
    const { ids } = req.body;
    
    // First get all requests to send notifications
    const requests = await CompanyWorkTypeRequest.find({ _id: { $in: ids } });
    
    // Update all requests
    await CompanyWorkTypeRequest.updateMany(
      { _id: { $in: ids } },
      { 
        status: 'Approved',
        reviewedBy: req.body.reviewerName || 'Admin',
        reviewedAt: new Date()
      }
    );
    
    // Send notifications for each request
    const io = req.app.get('io');
    
    if (io) {
      for (const request of requests) {
        if (request.userId) {
          try {
            const notificationMessage = `Your work type request for ${new Date(request.requestedDate).toLocaleDateString()} has been approved`;
            
            const notification = new Notification({
              message: notificationMessage,
              type: 'worktype',
              userId: request.userId,
              status: 'approved',
              read: false,
              time: new Date()
            });
            
            await notification.save();
            io.to(request.userId).emit('new-notification', notification);
          } catch (error) {
            console.error('Error sending notification:', error);
          }
        }
      }
    }
    
    res.status(200).json({ message: 'Requests approved successfully' });
  } catch (error) {
    console.error('Error bulk approving requests:', error);
    res.status(500).json({ message: 'Error bulk approving requests', error: error.message });
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
    
    console.log(`Bulk rejecting work type requests for company: ${companyCode}`);
    
    // Get company-specific WorkTypeRequest model
    const CompanyWorkTypeRequest = await getModelForCompany(companyCode, 'WorkTypeRequest', workTypeRequestSchema);
    
    const { ids } = req.body;
    
    // First get all requests to send notifications
    const requests = await CompanyWorkTypeRequest.find({ _id: { $in: ids } });
    
    // Update all requests
    await CompanyWorkTypeRequest.updateMany(
      { _id: { $in: ids } },
      { 
        status: 'Rejected',
        reviewedBy: req.body.reviewerName || 'Admin',
        reviewedAt: new Date()
      }
    );
    
    // Send notifications for each request
    const io = req.app.get('io');
    
    if (io) {
      for (const request of requests) {
        if (request.userId) {
          try {
            const notificationMessage = `Your work type request for ${new Date(request.requestedDate).toLocaleDateString()} has been rejected`;
            
            const notification = new Notification({
                            message: notificationMessage,
              type: 'worktype',
              userId: request.userId,
              status: 'rejected',
              read: false,
              time: new Date()
            });
            
            await notification.save();
            io.to(request.userId).emit('new-notification', notification);
          } catch (error) {
            console.error('Error sending notification:', error);
          }
        }
      }
    }
    
    res.status(200).json({ message: 'Requests rejected successfully' });
  } catch (error) {
    console.error('Error bulk rejecting requests:', error);
    res.status(500).json({ message: 'Error bulk rejecting requests', error: error.message });
  }
};

export const getWorkTypeRequestsByEmployeeCode = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Fetching work type requests for employee in company: ${companyCode}`);
    
    // Get company-specific WorkTypeRequest model
    const CompanyWorkTypeRequest = await getModelForCompany(companyCode, 'WorkTypeRequest', workTypeRequestSchema);
    
    const { employeeCode } = req.params;
    
    if (!employeeCode) {
      return res.status(400).json({ message: 'Employee code is required' });
    }
    
    const requests = await CompanyWorkTypeRequest.find({ employeeCode }).sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching employee work type requests:', error);
    res.status(500).json({ message: 'Error fetching employee work type requests', error: error.message });
  }
};


