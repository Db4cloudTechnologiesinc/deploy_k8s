import Notification, { notificationSchema } from '../models/Notification.js';
import getModelForCompany from '../models/genericModelFactory.js';
import { getUserModel } from '../models/User.js';

export const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Add logging to debug
    console.log(`Fetching notifications for user: ${userId} in company: ${companyCode}`);
    
    // Get company-specific Notification model
    const CompanyNotification = await getModelForCompany(companyCode, 'Notification', notificationSchema);
    
    const notifications = await CompanyNotification.find({ 
      userId: userId 
    }).sort({ time: -1 });
    
    console.log(`Found ${notifications.length} notifications for user ${userId}`);
    
    res.json(notifications);
  } catch (error) {
    console.error('Error in getUserNotifications:', error);
    res.status(500).json({ message: error.message });
  }
};



export const createNotification = async (req, res) => {
  try {
    const { message, type, status, userId } = req.body;
    
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Get company-specific Notification model
    const CompanyNotification = await getModelForCompany(companyCode, 'Notification', notificationSchema);
    
    const notification = new CompanyNotification({
      message,
      type,
      status,
      userId,
      read: false,
      time: new Date()
    });
    
    const savedNotification = await notification.save();
    
    // Emit the new notification to the user's room
    const io = req.app.get('io');
    if (io) {
      io.to(userId).emit('new-notification', savedNotification);
      console.log(`Socket notification emitted to user ${userId}`);
    } else {
      console.error('Socket.io instance not available');
    }
    
    res.status(201).json(savedNotification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: error.message });
  }
};

// Mark a notification as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    // Get company-specific Notification model
    const CompanyNotification = await getModelForCompany(companyCode, 'Notification', notificationSchema);
    
    const notification = await CompanyNotification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark all notifications as read for a user
export const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    // Get company-specific Notification model
    const CompanyNotification = await getModelForCompany(companyCode, 'Notification', notificationSchema);
    
    await CompanyNotification.updateMany(
      { userId: userId, read: false },
      { read: true }
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a notification
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    // Get company-specific Notification model
    const CompanyNotification = await getModelForCompany(companyCode, 'Notification', notificationSchema);
    
    const notification = await CompanyNotification.findByIdAndDelete(id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Clear all notifications for a user
export const clearAllNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    // Get company-specific Notification model
    const CompanyNotification = await getModelForCompany(companyCode, 'Notification', notificationSchema);
    
    await CompanyNotification.deleteMany({ userId: userId });
    
    res.json({ message: 'All notifications cleared' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to send notifications to Admin, HR, and Manager users
export const notifyAdminHRManager = async (companyCode, message, type, status, io) => {
  try {
    if (!companyCode) {
      console.error('Company code is required for notifyAdminHRManager');
      return;
    }

    // Get all users with admin, hr, or manager roles
    const UserModel = await getUserModel(companyCode);
    const privilegedUsers = await UserModel.find({
      role: { $in: ['admin', 'hr', 'manager'] },
      isActive: true
    });

    console.log(`Found ${privilegedUsers.length} admin/hr/manager users in company ${companyCode}`);

    // Get company-specific Notification model
    const CompanyNotification = await getModelForCompany(companyCode, 'Notification', notificationSchema);

    // Create notification for each privileged user
    for (const user of privilegedUsers) {
      const notification = new CompanyNotification({
        message,
        type,
        status,
        userId: user._id.toString(),
        read: false,
        time: new Date()
      });

      const savedNotification = await notification.save();

      // Emit via Socket.IO if available
      if (io) {
        io.to(user._id.toString()).emit('new-notification', savedNotification);
        console.log(`Notification sent to ${user.role} user: ${user._id}`);
      }
    }

    console.log(`Notified ${privilegedUsers.length} admin/hr/manager users`);
  } catch (error) {
    console.error('Error in notifyAdminHRManager:', error);
  }
};

