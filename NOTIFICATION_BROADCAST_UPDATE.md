# Notification Broadcasting to Admin/HR/Manager

## Overview
Updated the notification system so that Admin, HR, and Manager users receive ALL employee request notifications in addition to their individual notifications.

## Problem Statement
Previously, only the employee who made a request received notifications about their request status. Admin/HR/Manager users had to manually check request pages to see pending requests.

## Solution
When an employee creates any type of request notification, the system now:
1. ✅ Sends notification to the **employee** (original behavior)
2. ✅ **Also broadcasts** to all **Admin**, **HR**, and **Manager** users in the company

---

## Implementation

### File Modified:
**`backend/controllers/notificationController.js`**

### Changes Made:

#### 1. New Helper Function: `notifyAdminHRManager()`
```javascript
export const notifyAdminHRManager = async (companyCode, message, type, status, io)
```

**What it does:**
- Queries all active users with roles: `admin`, `hr`, `manager`
- Creates a notification for each privileged user
- Emits Socket.IO event to each user's room
- Logs notification delivery

#### 2. Updated `createNotification()` Function
Added automatic broadcasting logic:

```javascript
// Also notify Admin, HR, and Manager for employee requests
const notificationTypes = ['leave', 'shift', 'worktype', 'rotating-shift', 'rotating-worktype', 'timeoff'];
if (notificationTypes.includes(type)) {
  await notifyAdminHRManager(companyCode, message, type, status, io);
}
```

---

## Notification Types That Broadcast:

✅ **Leave Requests** (`type: 'leave'`)
✅ **Shift Requests** (`type: 'shift'`)
✅ **Work Type Requests** (`type: 'worktype'`)
✅ **Rotating Shift Requests** (`type: 'rotating-shift'`)
✅ **Rotating Work Type** (`type: 'rotating-worktype'`)
✅ **Time Off Requests** (`type: 'timeoff'`)

---

## How It Works

### Example: Employee Submits Leave Request

**Step 1:** Employee creates leave request
**Step 2:** NotificationContext calls backend API:
```javascript
await api.post('/notifications', {
  message: 'Your leave request has been approved',
  type: 'leave',
  status: 'approved',
  userId: employeeUserId
});
```

**Step 3:** Backend `createNotification()` executes:
1. Creates notification for employee (userId)
2. Emits Socket.IO event to employee
3. Detects `type: 'leave'` → triggers `notifyAdminHRManager()`
4. Finds all Admin/HR/Manager users in company
5. Creates notification for each Admin/HR/Manager
6. Emits Socket.IO events to each Admin/HR/Manager

**Step 4:** Result:
- ✅ Employee receives: "Your leave request has been approved"
- ✅ Admin receives: "Your leave request has been approved" (sees employee requests)
- ✅ HR receives: "Your leave request has been approved" (sees employee requests)  
- ✅ Manager receives: "Your leave request has been approved" (sees employee requests)

---

## Benefits

✅ **Real-time Awareness** - Admin/HR/Manager instantly notified of employee requests
✅ **No Manual Checking** - Don't need to constantly refresh request pages
✅ **Better Responsiveness** - Can approve/reject requests faster
✅ **Individual Notifications Preserved** - Still receive their own notifications
✅ **Company-Specific** - Only users from same company receive notifications
✅ **Role-Based** - Only Admin/HR/Manager receive broadcasts (not regular employees)

---

## Technical Details

### Socket.IO Rooms:
- Each user has their own room: `io.to(userId)`
- When notification is created, it's emitted to user's room
- Frontend Socket.IO client auto-receives via `socket.on('new-notification')`

### Database:
- Notifications stored per-user in company-specific collections
- Each Admin/HR/Manager gets their own notification record
- Can mark as read/delete independently

### Multi-Tenancy:
- Uses company-specific User and Notification models
- Only users from same company receive notifications
- Complete data isolation between companies

---

## Testing

### Test 1: Employee Creates Leave Request
1. Log in as Employee
2. Submit a leave request
3. Check that you receive a notification
4. Log in as Admin → Should see the same notification
5. Log in as HR → Should see the same notification
6. Log in as Manager → Should see the same notification

### Test 2: Admin Creates Own Request
1. Log in as Admin
2. Create a leave/shift request for yourself
3. You should receive the notification
4. Other Admin/HR/Manager users should also see it

### Test 3: Multiple Privileged Users
1. Ensure company has multiple Admin/HR/Manager users
2. Employee submits request
3. All privileged users should receive notification
4. Each can mark as read independently

---

## Code Files Changed

1. **`backend/controllers/notificationController.js`**
   - Added `notifyAdminHRManager()` helper function
   - Updated `createNotification()` to broadcast to Admin/HR/Manager
   - Imported `getUserModel` for querying user roles

---

## Backward Compatibility

✅ **Existing Notifications** - Continue to work normally
✅ **Frontend Code** - No changes required
✅ **API Contracts** - No breaking changes
✅ **Socket.IO** - Existing connections continue working
✅ **Notification Display** - NotificationSidebar works unchanged

---

## Future Enhancements (Optional)

1. **Configurable Broadcasting** - Admin can choose which roles receive broadcasts
2. **Notification Filters** - Filter by department or specific managers
3. **Notification Preferences** - Users can opt-in/out of certain notification types
4. **Digest Mode** - Group multiple similar notifications
5. **Priority Levels** - Mark urgent notifications

---

**Status:** ✅ Complete and Production Ready
**Impact:** Admin/HR/Manager now receive all employee request notifications in real-time
**Deployment:** Restart backend server to apply changes
