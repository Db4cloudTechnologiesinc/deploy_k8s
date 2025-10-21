import React, { useState, useEffect } from "react";
import { useNotifications } from "../../../context/NotificationContext";
import api from "../../../api/axiosInstance";
import { styled } from "@mui/material/styles";
import { formatDate } from "../../../utils/dateFormatter";
import {
  Box,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Menu,
  Tab,
  Checkbox,
  Typography,
  Paper,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  MenuItem,
  InputAdornment,
  useTheme,
  alpha,
  CircularProgress,
  Alert,
  Tooltip,
  Snackbar,
} from "@mui/material";
import { Search, Add, Edit, Delete } from "@mui/icons-material";
import { io } from 'socket.io-client';


const API_URL = "/rotating-shift";
const USER_API_URL = (userId) =>
  `/rotating-shift/user/${userId}`;

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(1),
  boxShadow: "0 3px 5px 2px rgba(0, 0, 0, .1)",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
  },
}));

const SearchTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: theme.spacing(2),
    "&:hover fieldset": {
      borderColor: theme.palette.primary.main,
    },
  },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  fontSize: 14,
  fontWeight: "bold",
  padding: theme.spacing(2),
  whiteSpace: "normal", // Allow wrapping
  "&.MuiTableCell-body": {
    color: theme.palette.text.primary,
    fontSize: 14,
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
    padding: { xs: theme.spacing(1.5), sm: theme.spacing(2) }, // Reduce padding on mobile
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: alpha(theme.palette.primary.light, 0.05),
  },
  "&:hover": {
    backgroundColor: alpha(theme.palette.primary.light, 0.1),
    transition: "background-color 0.2s ease",
  },
  // Hide last border
  "&:last-child td, &:last-child th": {
    borderBottom: 0,
  },
}));

const RotatingShiftAssign = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [selectedAllocations, setSelectedAllocations] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [isPermanentRequest, setIsPermanentRequest] = useState(false);
  const [showSelectionButtons, setShowSelectionButtons] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [shiftRequests, setShiftRequests] = useState([]);
  const [reviewRequests, setReviewRequests] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const [formData, setFormData] = useState({
    employee: "",
    employeeCode: "",
    requestShift: "",
    requestedDate: "",
    requestedTill: "",
    description: "",
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState(""); // "shift" or "bulk"
  const [itemToDelete, setItemToDelete] = useState(null);
  const [loading, setLoading] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const [loadingCurrentUser, setLoadingCurrentUser] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const { sendRotatingShiftNotification } = useNotifications();

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      await fetchCurrentUser();
      await loadRotatingShiftRequests();

      // Check if the user is an admin
      const userRole = localStorage.getItem("userRole");
      setIsAdmin(userRole === "admin");
    };

    initializeData();
  }, []);

  useEffect(() => {
    loadRotatingShiftRequests();
  }, [tabValue]);





useEffect(() => {
  const userId = localStorage.getItem("userId");
  if (!userId) return;

  // Connect to the WebSocket server
  // Determine the correct Socket.IO URL
const getSocketUrl = () => {
  // For production (EC2/ALB), use current domain so nginx can proxy
  if (process.env.NODE_ENV === 'production') {
    return window.location.origin;
  }
  // For development, use the environment variable or localhost
  return process.env.REACT_APP_API_URL || 'http://localhost:5002';
};

const baseURL = getSocketUrl();
const socket = io(baseURL, {
    query: { userId }
  });

  // Listen for new notifications
  socket.on('new-notification', (notification) => {
    console.log('Received notification:', notification);
    
    // Show a snackbar with the notification
    setSnackbar({
      open: true,
      message: notification.message,
      severity: notification.status === 'approved' ? 'success' : 'error'
    });
    
    // Reload the shift requests to reflect the changes
    loadRotatingShiftRequests();
  });

  // Join a room specific to this user
  socket.emit('join', userId);

  // Cleanup on component unmount
  return () => {
    socket.disconnect();
  };
}, []);
  
const fetchCurrentUser = async () => {
  try {
    setLoadingCurrentUser(true);
    const userId = localStorage.getItem("userId");

    if (!userId) {
      console.error("No user ID found in localStorage");
      setSnackbar({
        open: true,
        message: "User ID not found. Please log in again.",
        severity: "error",
      });
      return;
    }

    const response = await api.get(
      `/employees/by-user/${userId}`

    );

    if (response.data.success) {
      const userData = response.data.data;

      // Set the current user
      setCurrentUser(userData);

      // Pre-fill the form with the current user's details
      setFormData((prev) => ({
        ...prev,
        employee: `${userData.personalInfo?.firstName || ""} ${
          userData.personalInfo?.lastName || ""
        }`,
        employeeCode: userData.Emp_ID,
        currentShift: userData.joiningDetails?.shiftType || "Not Assigned",
      }));

      console.log("Current user loaded successfully:", userData.Emp_ID);
      return userData; // Return the user data for chaining
    } else {
      throw new Error("Failed to load user data");
    }
  } catch (error) {
    console.error("Error fetching current user:", error);
    setSnackbar({
      open: true,
      message: "Error loading user data: " + error.message,
      severity: "error",
    });
    return null;
  } finally {
    setLoadingCurrentUser(false);
  }
};


const loadRotatingShiftRequests = async () => {
  try {
    const userId = localStorage.getItem("userId");

    if (tabValue === 0) {
      // For Rotating Shift Requests tab, only show the current user's requests
      const endpoint = userId ? USER_API_URL(userId) : API_URL;
      const response = await api.get(endpoint

    );
      setShiftRequests(response.data);
    } else {
      // For Review tab, show all requests that need review (admin view)
      const response = await api.get(API_URL, {
        params: { forReview: true }

      });
      setReviewRequests(response.data);
    }
  } catch (error) {
    console.error("Error loading rotating shift requests:", error);
    setSnackbar({
      open: true,
      message: "Error loading rotating shift requests: " + error.message,
      severity: "error",
    });
  }
};

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRowClick = (id) => {
    const newSelected = selectedAllocations.includes(id)
      ? selectedAllocations.filter((item) => item !== id)
      : [...selectedAllocations, id];
    setSelectedAllocations(newSelected);
    setShowSelectionButtons(newSelected.length > 0);
  };

  const handleSelectAll = () => {
    const currentData = tabValue === 0 ? shiftRequests : reviewRequests;
    const allIds = currentData.map((req) => req._id);
    setSelectedAllocations(allIds);
    setShowSelectionButtons(true);
  };

  const handleUnselectAll = () => {
    setSelectedAllocations([]);
    setShowSelectionButtons(false);
  };

const handleBulkApprove = async () => {
  try {
    // Get all selected requests
    const selectedRequests = tabValue === 0
      ? shiftRequests.filter(req => selectedAllocations.includes(req._id))
      : reviewRequests.filter(req => selectedAllocations.includes(req._id));
    
    await api.post(`${API_URL}/bulk-approve`, {
      ids: selectedAllocations,
      isForReview: false, // Remove from review after approval
    });
    
    // Update each employee's shift type in their profile
    for (const request of selectedRequests) {
      if (request.employeeCode) {
        await api.put(`/employees/work-info/${request.employeeCode}`, {
          shiftType: request.requestedShift,
          // Include other fields to avoid overwriting them
          workType: null, // This will be fetched from the backend
          uanNumber: null,
          pfNumber: null
        });
        
        console.log(`Updated employee ${request.employeeCode}'s shift type to ${request.requestedShift}`);
      }
      
      // Send notification to the user who made the request
      if (request.userId) {
        const message = `Your shift request for ${request.requestedShift} from ${formatDate(request.requestedDate)} to ${formatDate(request.requestedTill)} has been approved.`;
        
        await sendRotatingShiftNotification(
          request.userId,
          message,
          "approved",
          request._id
        );
      }
    }
    
    await loadRotatingShiftRequests();
    setSelectedAllocations([]);
    setShowSelectionButtons(false);
    setAnchorEl(null);
    setSnackbar({
      open: true,
      message: "Rotating shift requests approved successfully",
      severity: "success",
    });
  } catch (error) {
    console.error("Error bulk approving shifts:", error);
    setSnackbar({
      open: true,
      message:
        "Error approving rotating shift requests: " +
        (error.response?.data?.message || error.message),
      severity: "error",
    });
  }
};



const handleBulkReject = async () => {
  try {
    // Get all selected requests
    const selectedRequests = tabValue === 0
      ? shiftRequests.filter(req => selectedAllocations.includes(req._id))
      : reviewRequests.filter(req => selectedAllocations.includes(req._id));
    
    await api.post(`${API_URL}/bulk-reject`, {
      ids: selectedAllocations,
      isForReview: false, // Remove from review after rejection
    });
    
    // Send notifications to all affected users
    for (const request of selectedRequests) {
      if (request.userId) {
        const message = `Your shift request for ${request.requestedShift} from ${formatDate(request.requestedDate)} to ${formatDate(request.requestedTill)} has been rejected.`;
        
        await sendRotatingShiftNotification(
          request.userId,
          message,
          "rejected",
          request._id
        );
      }
    }
    
    await loadRotatingShiftRequests();
    setSelectedAllocations([]);
    setShowSelectionButtons(false);
    setAnchorEl(null);
    setSnackbar({
      open: true,
      message: "Rotating shift requests rejected successfully",
      severity: "success",
    });
  } catch (error) {
    console.error("Error bulk rejecting shifts:", error);
    setSnackbar({
      open: true,
      message:
        "Error rejecting rotating shift requests: " +
        (error.response?.data?.message || error.message),
      severity: "error",
    });
  }
};



  
  const handleBulkDeleteClick = () => {
    setDeleteType("bulk");
    setItemToDelete({
      count: selectedAllocations.length,
      type: tabValue === 0 ? "requests" : "review requests",
    });
    setDeleteDialogOpen(true);
    setAnchorEl(null);
  };

const handleApprove = async (id, e) => {
  e.stopPropagation();
  try {
    // Get the request details before updating
    const requestToApprove = tabValue === 0 
      ? shiftRequests.find(req => req._id === id)
      : reviewRequests.find(req => req._id === id);
    
    await api.put(`${API_URL}/${id}/approve`, {
      isForReview: false, // Remove from review after approval
    });
    
    // Update the employee's shift type in their profile
    if (requestToApprove && requestToApprove.employeeCode) {
      await api.put(`/employees/work-info/${requestToApprove.employeeCode}`, {
        shiftType: requestToApprove.requestedShift,
        // Include other fields to avoid overwriting them
        workType: null, // This will be fetched from the backend
        uanNumber: null,
        pfNumber: null
      });
      
      console.log(`Updated employee ${requestToApprove.employeeCode}'s shift type to ${requestToApprove.requestedShift}`);
    }
    
    // Send notification to the user who made the request
    if (requestToApprove && requestToApprove.userId) {
      const message = `Your shift request for ${requestToApprove.requestedShift} from ${formatDate(requestToApprove.requestedDate)} to ${formatDate(requestToApprove.requestedTill)} has been approved.`;
      
      await sendRotatingShiftNotification(
        requestToApprove.userId,
        message,
        "approved",
        id
      );
    }
    
    await loadRotatingShiftRequests();
    setSnackbar({
      open: true,
      message: "Rotating shift request approved successfully",
      severity: "success",
    });
  } catch (error) {
    console.error("Error approving shift:", error);
    setSnackbar({
      open: true,
      message:
        "Error approving rotating shift request: " +
        (error.response?.data?.message || error.message),
      severity: "error",
    });
  }
};


const handleReject = async (id, e) => {
  e.stopPropagation();
  try {
    // Get the request details before updating
    const requestToReject = tabValue === 0 
      ? shiftRequests.find(req => req._id === id)
      : reviewRequests.find(req => req._id === id);
    
    await api.put(`${API_URL}/${id}/reject`, {
      isForReview: false, // Remove from review after rejection
    });
    
    // Send notification to the user who made the request
    if (requestToReject && requestToReject.userId) {
      const message = `Your shift request for ${requestToReject.requestedShift} from ${formatDate(requestToReject.requestedDate)} to ${formatDate(requestToReject.requestedTill)} has been rejected.`;
      
      await sendRotatingShiftNotification(
        requestToReject.userId,
        message,
        "rejected",
        id
      );
    }
    
    await loadRotatingShiftRequests();
    setSnackbar({
      open: true,
      message: "Rotating shift request rejected successfully",
      severity: "success",
    });
  } catch (error) {
    console.error("Error rejecting shift:", error);
    setSnackbar({
      open: true,
      message:
        "Error rejecting rotating shift request: " +
        (error.response?.data?.message || error.message),
      severity: "error",
    });
  }
};


const handleCreateShift = async () => {
  try {
    const userId = localStorage.getItem("userId");
    // const token = getAuthToken();
    
    if (!userId) {
      setSnackbar({
        open: true,
        message: "Unable to create rotating shift request: User ID not available",
        severity: "error",
      });
      return;
    }

    // If currentUser is not loaded yet, try to fetch it again
    let userToUse = currentUser;
    if (!userToUse) {
      console.log("Current user not loaded, fetching again...");
      userToUse = await fetchCurrentUser();

      if (!userToUse) {
        setSnackbar({
          open: true,
          message: "Unable to create rotating shift request: Failed to load user data",
          severity: "error",
        });
        return;
      }
    }

    // Validate form data
    if (!formData.requestShift) {
      setSnackbar({
        open: true,
        message: "Please select a shift type",
        severity: "warning",
      });
      return;
    }

    if (!formData.requestedDate) {
      setSnackbar({
        open: true,
        message: "Please select a requested date",
        severity: "warning",
      });
      return;
    }

    if (!formData.requestedTill) {
      setSnackbar({
        open: true,
        message: "Please select a requested till date",
        severity: "warning",
      });
      return;
    }

    const shiftData = {
      name: `${userToUse.personalInfo?.firstName || ""} ${
        userToUse.personalInfo?.lastName || ""
      }`,
      employeeCode: userToUse.Emp_ID,
      requestedShift: formData.requestShift,
      currentShift: userToUse.joiningDetails?.shiftType || "Not Assigned",
      requestedDate: formData.requestedDate,
      requestedTill: formData.requestedTill,
      description: formData.description || "",
      isPermanentRequest,
      isForReview: true, // Send for review
      userId: userId,
    };

    console.log("Creating rotating shift request with data:", shiftData);

    const response = await api.post(API_URL, shiftData

  );
    console.log("Rotating shift request created:", response.data);

    await loadRotatingShiftRequests();
    setCreateDialogOpen(false);
    resetFormData();

    setSnackbar({
      open: true,
      message: "Rotating shift request created successfully and sent for review",
      severity: "success",
    });
  } catch (error) {
    console.error("Error creating shift:", error);
    setSnackbar({
      open: true,
      message:
        "Error creating rotating shift request: " +
        (error.response?.data?.message || error.message),
      severity: "error",
    });
  }
};

  // Handle edit
  const handleEdit = (shift, e) => {
    e.stopPropagation();
    setEditingShift(shift);
    setFormData({
      employee: shift.name,
      employeeCode: shift.employeeCode,
      requestShift: shift.requestedShift,
      requestedDate: new Date(shift.requestedDate).toISOString().split("T")[0],
      requestedTill: new Date(shift.requestedTill).toISOString().split("T")[0],
      description: shift.description,
    });
    setEditDialogOpen(true);
  };

 
const handleSaveEdit = async () => {
  try {
    const userId = localStorage.getItem("userId");
    // const token = getAuthToken();

    const updatedData = {
      name: formData.employee,
      employeeCode: formData.employeeCode,
      requestedShift: formData.requestShift,
      requestedDate: formData.requestedDate,
      requestedTill: formData.requestedTill,
      description: formData.description,
      isForReview: true, // Send back for review after edit
      userId: userId, // Include userId for ownership verification
    };

    await api.put(`${API_URL}/${editingShift._id}`, updatedData

  );
    await loadRotatingShiftRequests();
    setEditDialogOpen(false);
    setEditingShift(null);
    resetFormData();

    setSnackbar({
      open: true,
      message: "Rotating shift request updated successfully",
      severity: "success",
    });
  } catch (error) {
    console.error("Error updating shift:", error);
    setSnackbar({
      open: true,
      message:
        "Error updating rotating shift request: " +
        (error.response?.data?.message || error.message),
      severity: "error",
    });
  }
};


  // Handle delete click
  const handleDeleteClick = (shift, e) => {
    e.stopPropagation();
    setDeleteType("shift");
    setItemToDelete(shift);
    setDeleteDialogOpen(true);
  };

  // Handle close delete dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  
const handleConfirmDelete = async () => {
  try {
    setLoading(true);
    const userId = localStorage.getItem("userId");

    if (deleteType === "shift" && itemToDelete) {
      await api.delete(`${API_URL}/${itemToDelete._id}`

    );
      await loadRotatingShiftRequests();
      setSnackbar({
        open: true,
        message: "Rotating shift request deleted successfully",
        severity: "success",
      });
    } else if (deleteType === "bulk" && selectedAllocations.length > 0) {
      // For bulk operations, we'll need to ensure these are only the user's own requests
      await Promise.all(
        selectedAllocations.map((id) =>
          api.delete(`${API_URL}/${id}`

        )
        )
      );
      await loadRotatingShiftRequests();
      setSelectedAllocations([]);
      setShowSelectionButtons(false);
      setSnackbar({
        open: true,
        message: `${selectedAllocations.length} ${itemToDelete.type} deleted successfully`,
        severity: "success",
      });
    }

    handleCloseDeleteDialog();
  } catch (error) {
    console.error(`Error deleting ${deleteType}:`, error);
    setSnackbar({
      open: true,
      message: `Error deleting ${deleteType}: ${
        error.response?.data?.message || error.message
      }`,
      severity: "error",
    });
  } finally {
    setLoading(false);
  }
};

  // Reset form data
  const resetFormData = () => {
    // If we have current user data, preserve the employee info
    if (currentUser) {
      setFormData({
        employee: `${currentUser.personalInfo?.firstName || ""} ${
          currentUser.personalInfo?.lastName || ""
        }`,
        employeeCode: currentUser.Emp_ID,
        currentShift: currentUser.joiningDetails?.shiftType || "Not Assigned",
        requestShift: "",
        requestedDate: "",
        requestedTill: "",
        description: "",
      });
    } else {
      setFormData({
        employee: "",
        employeeCode: "",
        currentShift: "",
        requestShift: "",
        requestedDate: "",
        requestedTill: "",
        description: "",
      });
    }
    setIsPermanentRequest(false);
  };

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      <Box>
        <Typography
          variant="h4"
          sx={{
            mb: { xs: 2, sm: 3, md: 4 },
            color: theme.palette.primary.main,
            fontWeight: 600,
            letterSpacing: 0.5,
            fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
          }}
        >
          {tabValue === 0 ? "Rotating Shift Requests" : "Review Requests"}
        </Typography>

        <StyledPaper sx={{ p: { xs: 2, sm: 3 } }}>
          <Box
            display="flex"
            flexDirection={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            gap={2}
            sx={{
              width: "100%",
              justifyContent: "space-between",
            }}
          >
            <SearchTextField
              placeholder="Search Employee"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{
                width: { xs: "100%", sm: "300px" },
                marginRight: { xs: 0, sm: "auto" },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="primary" />
                  </InputAdornment>
                ),
              }}
            />

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: { xs: 1, sm: 1 },
                width: { xs: "100%", sm: "auto" },
              }}
            >
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setCreateDialogOpen(true)}
                sx={{
                  height: { xs: "auto", sm: 50 },
                  padding: { xs: "8px 16px", sm: "6px 16px" },
                  width: { xs: "100%", sm: "auto" },
                  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
                  color: "white",
                  "&:hover": {
                    background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
                  },
                }}
              >
                Create {tabValue === 0 ? "Request" : "Review Request"}
              </Button>
            </Box>
          </Box>
        </StyledPaper>

        {/* Selection Buttons */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            mb: 2,
            mt: { xs: 2, sm: 2 },
          }}
        >
          <Button
            variant="outlined"
            sx={{
              color: "green",
              borderColor: "green",
              width: { xs: "100%", sm: "auto" },
            }}
            onClick={handleSelectAll}
          >
            Select All {tabValue === 0 ? "Requests" : "Review Requests"}
          </Button>
          {showSelectionButtons && (
            <>
              <Button
                variant="outlined"
                sx={{
                  color: "grey.500",
                  borderColor: "grey.500",
                  width: { xs: "100%", sm: "auto" },
                }}
                onClick={handleUnselectAll}
              >
                Unselect All
              </Button>
              <Button
                variant="outlined"
                sx={{
                  color: "maroon",
                  borderColor: "maroon",
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                {selectedAllocations.length} Selected
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: {
            width: { xs: 200, sm: 250 },
            borderRadius: 2,
            boxShadow: 3,
          },
        }}
      >
        {/* Only show approve/reject options in Review tab */}
        {tabValue === 1 && (
          <>
            <MenuItem onClick={handleBulkApprove} sx={{ py: 1.5 }}>
              Approve Selected
            </MenuItem>
            <MenuItem onClick={handleBulkReject} sx={{ py: 1.5 }}>
              Reject Selected
            </MenuItem>
          </>
        )}
        <MenuItem onClick={handleBulkDeleteClick} sx={{ py: 1.5 }}>
          Delete Selected
        </MenuItem>
      </Menu>

      {/* Status Filter Buttons */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 1,
          mb: 2,
        }}
      >
        <Button
          sx={{
            color: "green",
            justifyContent: { xs: "flex-start", sm: "center" },
            width: { xs: "100%", sm: "auto" },
          }}
          onClick={() => setFilterStatus("Approved")}
        >
          ● Approved
        </Button>
        <Button
          sx={{
            color: "red",
            justifyContent: { xs: "flex-start", sm: "center" },
            width: { xs: "100%", sm: "auto" },
          }}
          onClick={() => setFilterStatus("Rejected")}
        >
          ● Rejected
        </Button>
        <Button
          sx={{
            color: "orange",
            justifyContent: { xs: "flex-start", sm: "center" },
            width: { xs: "100%", sm: "auto" },
          }}
          onClick={() => setFilterStatus("Pending")}
        >
          ● Pending
        </Button>
        <Button
          sx={{
            color: "gray",
            justifyContent: { xs: "flex-start", sm: "center" },
            width: { xs: "100%", sm: "auto" },
          }}
          onClick={() => setFilterStatus("all")}
        >
          ● All
        </Button>
      </Box>

      {/* Tabs */}
      <Tabs
        value={tabValue}
        onChange={(e, newValue) => {
          setTabValue(newValue);
          setSelectedAllocations([]);
          setShowSelectionButtons(false);
          setFilterStatus("all");
        }}
        textColor="primary"
        indicatorColor="primary"
        sx={{
          mb: 2,
          "& .MuiTabs-flexContainer": {
            flexDirection: { xs: "column", sm: "row" },
          },
          "& .MuiTab-root": {
            width: { xs: "100%", sm: "auto" },
            fontSize: { xs: "0.875rem", sm: "0.875rem", md: "1rem" },
          },
        }}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="Rotating Shift Requests" />
        <Tab label="Review" />
      </Tabs>

      <Divider sx={{ mb: 2 }} />

      {/* Main Table */}
      <TableContainer
        component={Paper}
        sx={{
          maxHeight: { xs: 450, sm: 500, md: 550 },
          overflowY: "auto",
          overflowX: "auto",
          mx: 0,
          borderRadius: 2,
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          mb: 4,
          "& .MuiTableContainer-root": {
            scrollbarWidth: "thin",
            "&::-webkit-scrollbar": {
              width: 8,
              height: 8,
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: alpha(theme.palette.primary.light, 0.1),
              borderRadius: 8,
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: alpha(theme.palette.primary.main, 0.2),
              borderRadius: 8,
              "&:hover": {
                backgroundColor: alpha(theme.palette.primary.main, 0.3),
              },
            },
          },
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <StyledTableCell
                padding="checkbox"
                sx={{ position: "sticky", left: 0, zIndex: 3 }}
              >
                <Checkbox
                  sx={{
                    color: "white",
                    "&.Mui-checked": {
                      color: "white",
                    },
                  }}
                  onChange={(e) => {
                    if (e.target.checked) handleSelectAll();
                    else handleUnselectAll();
                  }}
                  checked={
                    selectedAllocations.length ===
                      (tabValue === 0
                        ? shiftRequests.length
                        : reviewRequests.length) &&
                    (tabValue === 0
                      ? shiftRequests.length > 0
                      : reviewRequests.length > 0)
                  }
                />
              </StyledTableCell>
              <StyledTableCell sx={{ minWidth: 200 }}>Employee</StyledTableCell>
              <StyledTableCell sx={{ minWidth: 150 }}>
                Requested Shift
              </StyledTableCell>
              <StyledTableCell sx={{ minWidth: 150 }}>
                Previous/Current Shift
              </StyledTableCell>
              <StyledTableCell sx={{ minWidth: 130 }}>
                Requested Date
              </StyledTableCell>
              <StyledTableCell sx={{ minWidth: 130 }}>
                Requested Till
              </StyledTableCell>
              <StyledTableCell sx={{ minWidth: 100 }}>Status</StyledTableCell>
              <StyledTableCell sx={{ minWidth: 150 }}>
                Description
              </StyledTableCell>
              {/* Only show Confirmation column in Review tab */}
              {tabValue === 1 && (
                <StyledTableCell sx={{ minWidth: 120, textAlign: "center" }}>
                  Confirmation
                </StyledTableCell>
              )}
              <StyledTableCell sx={{ minWidth: 100, textAlign: "center" }}>
                Actions
              </StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(tabValue === 0 ? shiftRequests : reviewRequests)
              .filter((request) => {
                const employeeName = request?.name || "";
                return (
                  employeeName
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) &&
                  (filterStatus === "all" || request.status === filterStatus)
                );
              })
              .map((request) => (
                <StyledTableRow
                  key={request._id}
                  hover
                  onClick={() => handleRowClick(request._id)}
                  selected={selectedAllocations.includes(request._id)}
                  sx={{
                    cursor: "pointer",
                    ...(selectedAllocations.includes(request._id) && {
                      backgroundColor: alpha(theme.palette.primary.light, 0.15),
                      "&:hover": {
                        backgroundColor: alpha(
                          theme.palette.primary.light,
                          0.2
                        ),
                      },
                    }),
                  }}
                >
                  <TableCell
                    padding="checkbox"
                    sx={{
                      position: "sticky",
                      left: 0,
                      backgroundColor: selectedAllocations.includes(request._id)
                        ? alpha(theme.palette.primary.light, 0.15)
                        : request._id % 2 === 0
                        ? alpha(theme.palette.primary.light, 0.05)
                        : "inherit",
                      "&:hover": {
                        backgroundColor: alpha(
                          theme.palette.primary.light,
                          0.2
                        ),
                      },
                    }}
                  >
                    <Checkbox
                      checked={selectedAllocations.includes(request._id)}
                      onChange={() => handleRowClick(request._id)}
                      sx={{
                        "&.Mui-checked": {
                          color: theme.palette.primary.main,
                        },
                      }}
                    />
                  </TableCell>

                  <TableCell>
                    <Box display="flex" alignItems="flex-start" gap={1}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          bgcolor:
                            request._id % 2 === 0
                              ? alpha(theme.palette.primary.main, 0.8)
                              : alpha(theme.palette.secondary.main, 0.8),
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "bold",
                          fontSize: "0.875rem",
                          flexShrink: 0,
                          mt: 0.5,
                        }}
                      >
                        {request.name?.[0] || "U"}
                      </Box>
                      <Box sx={{ display: "flex", flexDirection: "column" }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            wordBreak: "break-word",
                            whiteSpace: "normal",
                            lineHeight: 1.3,
                          }}
                        >
                          {request.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {request.employeeCode}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {request.requestedShift}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {request.currentShift}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(request.requestedDate)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(request.requestedTill)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: "inline-block",
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: "0.75rem",
                        fontWeight: "medium",
                        backgroundColor:
                          request.status === "Approved"
                            ? alpha("#4caf50", 0.1)
                            : request.status === "Rejected"
                            ? alpha("#f44336", 0.1)
                            : alpha("#ff9800", 0.1),
                        color:
                          request.status === "Approved"
                            ? "#2e7d32"
                            : request.status === "Rejected"
                            ? "#d32f2f"
                            : "#e65100",
                      }}
                    >
                      {request.status}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: 200,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {request.description}
                    </Typography>
                  </TableCell>

                  {/* Only show Confirmation cell in Review tab */}
                  {tabValue === 1 && (
                    <TableCell align="center">
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          gap: 1,
                        }}
                      >
                        <IconButton
                          size="small"
                          color="success"
                          onClick={(e) => handleApprove(request._id, e)}
                          disabled={request.status === "Approved"}
                          sx={{
                            backgroundColor: alpha("#4caf50", 0.1),
                            "&:hover": {
                              backgroundColor: alpha("#4caf50", 0.2),
                            },
                            "&.Mui-disabled": {
                              backgroundColor: alpha("#e0e0e0", 0.3),
                            },
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: "bold" }}
                          >
                            ✓
                          </Typography>
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => handleReject(request._id, e)}
                          disabled={request.status === "Rejected"}
                          sx={{
                            backgroundColor: alpha("#f44336", 0.1),
                            "&:hover": {
                              backgroundColor: alpha("#f44336", 0.2),
                            },
                            "&.Mui-disabled": {
                              backgroundColor: alpha("#e0e0e0", 0.3),
                            },
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: "bold" }}
                          >
                            ✕
                          </Typography>
                        </IconButton>
                      </Box>
                    </TableCell>
                  )}

                  <TableCell align="center">
                    <Box
                      sx={{ display: "flex", justifyContent: "center", gap: 1 }}
                    >
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => handleEdit(request, e)}
                        sx={{
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.1
                          ),
                          "&:hover": {
                            backgroundColor: alpha(
                              theme.palette.primary.main,
                              0.2
                            ),
                          },
                        }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => handleDeleteClick(request, e)}
                        sx={{
                          backgroundColor: alpha(theme.palette.error.main, 0.1),
                          "&:hover": {
                            backgroundColor: alpha(
                              theme.palette.error.main,
                              0.2
                            ),
                          },
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </StyledTableRow>
              ))}
            {/* Empty state message when no records match filters */}
            {(tabValue === 0 ? shiftRequests : reviewRequests).filter(
              (request) => {
                const employeeName = request?.name || "";
                return (
                  employeeName
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) &&
                  (filterStatus === "all" || request.status === filterStatus)
                );
              }
            ).length === 0 && (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No {tabValue === 0 ? "rotating shift requests" : "review requests"}{" "}
                    found matching your filters.
                  </Typography>
                  <Button
                    variant="text"
                    color="primary"
                    onClick={() => {
                      setSearchTerm("");
                      setFilterStatus("all");
                    }}
                    sx={{ mt: 1 }}
                  >
                    Clear filters
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        PaperProps={{
          sx: {
            width: { xs: "95%", sm: "500px" },
            maxWidth: "500px",
            borderRadius: "20px",
            overflow: "hidden",
            margin: { xs: "8px", sm: "32px" },
          },
        }}
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(45deg, #f44336, #ff7961)",
            fontSize: { xs: "1.25rem", sm: "1.5rem" },
            fontWeight: 600,
            padding: { xs: "16px 24px", sm: "24px 32px" },
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Delete />
          Confirm Deletion
        </DialogTitle>
        <DialogContent
          sx={{
            padding: { xs: "24px", sm: "32px" },
            backgroundColor: "#f8fafc",
            paddingTop: { xs: "24px", sm: "32px" },
          }}
        >
          <Alert severity="warning" sx={{ mb: 2 }}>
            {deleteType === "bulk"
              ? `Are you sure you want to delete ${selectedAllocations.length} selected ${itemToDelete?.type}?`
              : "Are you sure you want to delete this rotating shift request?"}
          </Alert>
          {itemToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: "#f8fafc", borderRadius: 2 }}>
              {deleteType === "bulk" ? (
                <>
                  <Typography variant="body1" fontWeight={600} color="#2c3e50">
                    Bulk Deletion
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    You are about to delete {selectedAllocations.length}{" "}
                    {itemToDelete.type}. This action cannot be undone.
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="body1" fontWeight={600} color="#2c3e50">
                    Rotating Shift Request Details:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 1,
                      p: 1,
                      bgcolor: "#fff",
                      borderRadius: 1,
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <strong>Employee:</strong> {itemToDelete.name} (
                    {itemToDelete.employeeCode})<br />
                    <strong>Requested Shift:</strong>{" "}
                    {itemToDelete.requestedShift}
                    <br />
                    <strong>Date Range:</strong>{" "}
                    {formatDate(itemToDelete.requestedDate)}{" "}
                    -{" "}
                    {formatDate(itemToDelete.requestedTill)}
                    <br />
                    <strong>Status:</strong> {itemToDelete.status}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            padding: { xs: "16px 24px", sm: "24px 32px" },
            backgroundColor: "#f8fafc",
            borderTop: "1px solid #e0e0e0",
            gap: 2,
          }}
        >
          <Button
            onClick={handleCloseDeleteDialog}
            sx={{
              border: "2px solid #1976d2",
              color: "#1976d2",
              "&:hover": {
                border: "2px solid #64b5f6",
                backgroundColor: "#e3f2fd",
                color: "#1976d2",
              },
              textTransform: "none",
              borderRadius: "8px",
              px: 3,
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={20} color="inherit" /> : null
            }
            sx={{
              background: "linear-gradient(45deg, #f44336, #ff7961)",
              fontSize: "0.95rem",
              textTransform: "none",
              padding: "8px 32px",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(244, 67, 54, 0.2)",
              color: "white",
              "&:hover": {
                background: "linear-gradient(45deg, #d32f2f, #f44336)",
              },
            }}
          >
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Create Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        fullScreen={window.innerWidth < 600} // Full screen on mobile
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: "600px" },
            maxWidth: "100%",
            borderRadius: { xs: 0, sm: "20px" },
            margin: { xs: 0, sm: 2 },
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(45deg, #1976d2, #64b5f6)",
            color: "white",
            fontSize: "1.5rem",
            fontWeight: 600,
            padding: "24px 32px",
          }}
        >
          {tabValue === 0 ? "Create Rotating Shift Request" : "Create Review Request"}
        </DialogTitle>
        <DialogContent sx={{ padding: "32px", backgroundColor: "#f8fafc" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Current User Information */}
            {loadingCurrentUser ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                <CircularProgress size={24} />
                <Typography variant="body2" sx={{ ml: 2 }}>
                  Loading user data...
                </Typography>
              </Box>
            ) : currentUser ? (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  backgroundColor: alpha(theme.palette.primary.light, 0.1),
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Your Details
                </Typography>
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}
                >
                  <Typography variant="body2">
                    <strong>Name:</strong>{" "}
                    {currentUser.personalInfo?.firstName || ""}{" "}
                    {currentUser.personalInfo?.lastName || ""}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Employee Code:</strong> {currentUser.Emp_ID}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Department:</strong>{" "}
                    {currentUser.joiningDetails?.department || "Not Assigned"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Current Shift:</strong>{" "}
                    {currentUser.joiningDetails?.shiftType || "Regular Shift"}
                  </Typography>
                </Box>
              </Paper>
            ) : (
              <Alert severity="warning">
                Unable to load your employee details. Please try again or
                contact support.
              </Alert>
            )}

            {/* Request Shift Type */}
            <TextField
              label="Request Work Type"
              name="requestShift"
              value={formData.requestShift}
              onChange={handleFormChange}
              fullWidth
              select
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "white",
                  borderRadius: "12px",
                  "&:hover fieldset": {
                    borderColor: "#1976d2",
                  },
                },
              }}
            >
              <MenuItem value="General Shift">General Shift</MenuItem>
              <MenuItem value="Morning Shift">Morning Shift</MenuItem>
              <MenuItem value="Evening Shift">Evening Shift</MenuItem>
              <MenuItem value="Night Shift">Night Shift</MenuItem>
            </TextField>

            {/* Rest of your form fields remain the same */}
            <TextField
              label="Requested Date"
              name="requestedDate"
              type="date"
              value={formData.requestedDate}
              onChange={handleFormChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "white",
                  borderRadius: "12px",
                  "&:hover fieldset": {
                    borderColor: "#1976d2",
                  },
                },
              }}
            />

            <TextField
              label="Requested Till"
              name="requestedTill"
              type="date"
              value={formData.requestedTill}
              onChange={handleFormChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "white",
                  borderRadius: "12px",
                  "&:hover fieldset": {
                    borderColor: "#1976d2",
                  },
                },
              }}
            />

            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              fullWidth
              multiline
              rows={4}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "white",
                  borderRadius: "12px",
                  "&:hover fieldset": {
                    borderColor: "#1976d2",
                  },
                },
              }}
            />

            {tabValue === 0 && (
              <FormControlLabel
                control={
                  <Switch
                    checked={isPermanentRequest}
                    onChange={(e) => setIsPermanentRequest(e.target.checked)}
                  />
                }
                label="Permanent Request"
              />
            )}
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            padding: "24px 32px",
            backgroundColor: "#f8fafc",
            borderTop: "1px solid #e0e0e0",
            gap: 2,
          }}
        >
          <Button
            onClick={() => {
              setCreateDialogOpen(false);
              resetFormData();
            }}
            sx={{
              border: "2px solid #1976d2",
              color: "#1976d2",
              "&:hover": {
                border: "2px solid #64b5f6",
                backgroundColor: "#e3f2fd",
                color: "#1976d2",
              },
              textTransform: "none",
              borderRadius: "8px",
              px: 3,
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateShift}
            disabled={
              !formData.requestShift ||
              !formData.requestedDate ||
              !formData.requestedTill
            }
            sx={{
              background: "linear-gradient(45deg, #1976d2, #64b5f6)",
              fontSize: "0.95rem",
              textTransform: "none",
              padding: "8px 32px",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(25, 118, 210, 0.2)",
              color: "white",
              "&:hover": {
                background: "linear-gradient(45deg, #1565c0, #42a5f5)",
              },
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        fullScreen={window.innerWidth < 600} // Full screen on mobile
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: "600px" },
            maxWidth: "100%",
            borderRadius: { xs: 0, sm: "20px" },
            margin: { xs: 0, sm: 2 },
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(45deg, #1976d2, #64b5f6)",
            color: "white",
            fontSize: "1.5rem",
            fontWeight: 600,
            padding: "24px 32px",
          }}
        >
          {tabValue === 0 ? "Edit Rotating Shift Request" : "Edit Review Request"}
        </DialogTitle>

        <DialogContent sx={{ padding: "32px", backgroundColor: "#f8fafc" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
              }}
            >
              <TextField
                label="Employee Name"
                name="employee"
                fullWidth
                value={formData.employee}
                onChange={handleFormChange}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: "12px",
                    "&:hover fieldset": {
                      borderColor: "#1976d2",
                    },
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#1976d2",
                  },
                }}
              />
              <TextField
                label="Employee ID"
                name="employeeCode"
                fullWidth
                value={formData.employeeCode || ""}
                onChange={handleFormChange}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: "12px",
                    "&:hover fieldset": {
                      borderColor: "#1976d2",
                    },
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#1976d2",
                  },
                }}
              />
            </Box>

            <TextField
              label="Request Work Type"
              name="requestShift"
              value={formData.requestShift}
              onChange={handleFormChange}
              fullWidth
              select
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "white",
                  borderRadius: "12px",
                  "&:hover fieldset": {
                    borderColor: "#1976d2",
                  },
                },
              }}
            >
              <MenuItem value="General Shift">General Shift</MenuItem>
              <MenuItem value="Morning Shift">Morning Shift</MenuItem>
              <MenuItem value="Evening Shift">Evening Shift</MenuItem>
              <MenuItem value="Night Shift">Night Shift</MenuItem>
            </TextField>

            <TextField
              label="Requested Date"
              name="requestedDate"
              type="date"
              value={formData.requestedDate}
              onChange={handleFormChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "white",
                  borderRadius: "12px",
                  "&:hover fieldset": {
                    borderColor: "#1976d2",
                  },
                },
              }}
            />

            <TextField
              label="Requested Till"
              name="requestedTill"
              type="date"
              value={formData.requestedTill}
              onChange={handleFormChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "white",
                  borderRadius: "12px",
                  "&:hover fieldset": {
                    borderColor: "#1976d2",
                  },
                },
              }}
            />

            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              fullWidth
              multiline
              rows={4}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "white",
                  borderRadius: "12px",
                  "&:hover fieldset": {
                    borderColor: "#1976d2",
                  },
                },
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            padding: "24px 32px",
            backgroundColor: "#f8fafc",
            borderTop: "1px solid #e0e0e0",
            gap: 2,
          }}
        >
          <Button
            onClick={() => setEditDialogOpen(false)}
            sx={{
              border: "2px solid #1976d2",
              color: "#1976d2",
              "&:hover": {
                border: "2px solid #64b5f6",
                backgroundColor: "#e3f2fd",
                color: "#1976d2",
              },
              textTransform: "none",
              borderRadius: "8px",
              px: 3,
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSaveEdit}
            disabled={
              !formData.employee ||
              !formData.requestShift ||
              !formData.requestedDate
            }
            sx={{
              background: "linear-gradient(45deg, #1976d2, #64b5f6)",
              fontSize: "0.95rem",
              textTransform: "none",
              padding: "8px 32px",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(25, 118, 210, 0.2)",
              "&:hover": {
                background: "linear-gradient(45deg, #1565c0, #42a5f5)",
              },
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RotatingShiftAssign;



