import React, { useState, useEffect } from "react";
import api from "../../../api/axiosInstance";
import { motion } from "framer-motion";
import {
  Container,
  Paper,
  Typography,
  TextField,
  IconButton,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  useMediaQuery,
  useTheme,
  DialogActions,
  Alert,
  CircularProgress,
  Snackbar,
  InputAdornment,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Event as EventIcon,
  Close,
} from "@mui/icons-material";

function RestrictLeaves() {
  const [restrictLeaves, setRestrictLeaves] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    startDate: "",
    endDate: "",
    department: "",
    jobPosition: "",
    description: "",
    isOneDay: false,
  });
  const [validationErrors, setValidationErrors] = useState({
    title: "",
    endDate: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // Add responsive hooks
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  // Add delete confirmation dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leaveToDelete, setLeaveToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchRestrictLeaves();
  }, []);

  // Update the fetchRestrictLeaves function
  const fetchRestrictLeaves = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/restrictLeaves");
      setRestrictLeaves(data);
    } catch (err) {
      console.error("Error fetching restricted leaves:", err);
      showSnackbar("Error fetching restricted leaves", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Apply sentence case only for text fields
    const transformedValue = ["title", "description"].includes(name)
      ? toSentenceCase(value)
      : value;

    setFormData({ ...formData, [name]: transformedValue });

    // Add validation for title field
    if (name === "title" && value) {
      if (!validateTitle(value)) {
        setValidationErrors({
          ...validationErrors,
          title: "Title should contain only letters and spaces",
        });
      } else {
        setValidationErrors({
          ...validationErrors,
          title: "",
        });
      }
    }

    // Add validation for date fields
    if (name === "startDate" || name === "endDate") {
      const startDate = name === "startDate" ? value : formData.startDate;
      const endDate = name === "endDate" ? value : formData.endDate;

      if (startDate && endDate) {
        if (!validateEndDate(startDate, endDate)) {
          setValidationErrors({
            ...validationErrors,
            endDate: "End date must be equal to or after start date",
          });
        } else {
          setValidationErrors({
            ...validationErrors,
            endDate: "",
          });
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Check for validation errors
    if (validationErrors.title || validationErrors.endDate) {
      showSnackbar(validationErrors.title || validationErrors.endDate, "error");
      return;
    }

    // Additional validation for dates
    if (!validateEndDate(formData.startDate, formData.endDate)) {
      showSnackbar("End date must be equal to or after start date", "error");
      return;
    }
    setLoading(true);

    // Format dates before submitting
    const formattedFormData = {
      ...formData,
      startDate: new Date(formData.startDate).toISOString(), // Convert to ISO format
      endDate: new Date(formData.endDate).toISOString(), // Convert to ISO format
    };

    try {
      // const token = getAuthToken();

      if (isEditing) {
        await api.put(`/restrictLeaves/${editId}`, formattedFormData);
        console.log(`Updated restricted leave with ID: ${editId}`);
        showSnackbar("Restricted leave updated successfully");
      } else {
        await api.post("/restrictLeaves", formattedFormData);
        console.log(`Added new restricted leave`);
        showSnackbar("Restricted leave added successfully");
      }
      fetchRestrictLeaves();
      setIsAddModalOpen(false);
      setFormData({
        title: "",
        startDate: "",
        endDate: "",
        department: "",
        jobPosition: "",
        description: "",
      });
      setIsEditing(false);
      setEditId(null);
      setValidationErrors({ title: "", endDate: "" });
    } catch (err) {
      console.error("Error creating/updating restricted leave:", err);
      showSnackbar("Error saving restricted leave", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (leave) => {
    setFormData({
      title: leave.title,
      startDate: formatDateForInput(leave.startDate), // Format for the input field
      endDate: formatDateForInput(leave.endDate), // Format for the input field
      department: leave.department,
      jobPosition: leave.jobPosition,
      description: leave.description,
    });
    setEditId(leave._id);
    setIsEditing(true);
    setIsAddModalOpen(true);
    setValidationErrors({ title: "", endDate: "" });
  };

  // Add this function to validate title (only letters and spaces)
  const validateTitle = (title) => {
    const titleRegex = /^[a-zA-Z\s]+$/;
    return titleRegex.test(title);
  };

  // Add this function to validate end date
  const validateEndDate = (startDate, endDate) => {
    if (!startDate || !endDate) return true;

    const start = new Date(startDate);
    const end = new Date(endDate);

    return end >= start;
  };

  // Function to format date for input type="date"
  const formatDateForInput = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Replace direct delete with confirmation dialog
  const handleDeleteClick = (leave) => {
    setLeaveToDelete(leave);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setLeaveToDelete(null);
  };

  // Update the handleConfirmDelete function
  const handleConfirmDelete = async () => {
    try {
      if (!leaveToDelete) return;

      setLoading(true);
      // const token = getAuthToken();
      await api.delete(`/restrictLeaves/${leaveToDelete._id}`);
      console.log(`Deleted restricted leave with ID: ${leaveToDelete._id}`);
      fetchRestrictLeaves();
      showSnackbar("Restricted leave deleted successfully");
    } catch (err) {
      console.error("Error deleting restricted leave:", err);
      showSnackbar("Error deleting restricted leave", "error");
    } finally {
      setLoading(false);
      handleCloseDeleteDialog();
    }
  };

  const toSentenceCase = (str) => {
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4, px: isMobile ? 1 : 3 }}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Paper
        elevation={3}
        sx={{
          p: isMobile ? 2 : 3,
          borderRadius: 2,
          backgroundColor: "#ffffff",
        }}
      >
        <Box
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            backgroundColor: "#f5f5f5",
            //minHeight: "100vh",
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
              Restricted Leaves Management
            </Typography>

            <Paper
              elevation={3}
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 2,
                backgroundColor: "#ffffff",
                mb: 3,
              }}
            >
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
                <TextField
                  placeholder="Search restricted leaves..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="small"
                  sx={{
                    width: { xs: "100%", sm: "300px" },
                    marginRight: { xs: 0, sm: "auto" },
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "#f8fafc",
                      borderRadius: "8px",
                      "&:hover fieldset": {
                        borderColor: theme.palette.primary.main,
                      },
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
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
                    onClick={() => {
                      setFormData({
                        title: "",
                        startDate: "",
                        endDate: "",
                        department: "",
                        jobPosition: "",
                        description: "",
                      });
                      setIsAddModalOpen(true);
                      setIsEditing(false);
                    }}
                    //startIcon={<AddIcon />}
                    sx={{
                      height: { xs: "auto", sm: 70 },
                      padding: { xs: "8px 16px", sm: "6px 16px" },
                      width: { xs: "100%", sm: "auto" },
                      background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
                      color: "white",
                      "&:hover": {
                        background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
                      },
                    }}
                    variant="contained"
                  >
                    Add Restricted Leave
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Box>

        {/* Cards */}

        <Grid container spacing={isMobile ? 2 : 3}>
          {restrictLeaves
            .filter(
              (leave) =>
                leave.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                leave.department
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase()) ||
                leave.jobPosition
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase())
            )
            .map((leave) => (
              <Grid item xs={12} sm={6} md={4} key={leave._id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card
                    elevation={2}
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      borderRadius: 2,
                      overflow: "hidden",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        boxShadow: 8,
                        transform: "translateY(-4px)",
                      },
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Box
                      sx={{
                        p: 2,
                        background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <EventIcon />
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          wordBreak: "break-word",
                          overflowWrap: "break-word",
                          fontSize: { xs: "1rem", sm: "1.1rem", md: "1.25rem" },
                        }}
                      >
                        {leave.title}
                      </Typography>
                    </Box>

                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            Start Date
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight={500}
                            sx={{ mt: 0.5 }}
                          >
                            {formatDate(leave.startDate)}
                          </Typography>
                        </Grid>

                        <Grid item xs={6}>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            End Date
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight={500}
                            sx={{ mt: 0.5 }}
                          >
                            {formatDate(leave.endDate)}
                          </Typography>
                        </Grid>

                        <Grid item xs={12}>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            Department
                          </Typography>
                          <Box
                            sx={{
                              mt: 0.5,
                              display: "inline-flex",
                              alignItems: "center",
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 1,
                              fontSize: "0.75rem",
                              fontWeight: "medium",
                              backgroundColor: `${theme.palette.info.light}15`,
                              color: theme.palette.info.dark,
                            }}
                          >
                            {leave.department}
                          </Box>
                        </Grid>

                        <Grid item xs={12}>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            Position
                          </Typography>
                          <Box
                            sx={{
                              mt: 0.5,
                              display: "inline-flex",
                              alignItems: "center",
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 1,
                              fontSize: "0.75rem",
                              fontWeight: "medium",
                              backgroundColor: `${theme.palette.success.light}15`,
                              color: theme.palette.success.dark,
                            }}
                          >
                            {leave.jobPosition}
                          </Box>
                        </Grid>

                        <Grid item xs={12}>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            Description
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              mt: 0.5,
                              color: theme.palette.text.primary,
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              lineHeight: 1.5,
                            }}
                          >
                            {leave.description}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 1,
                          mt: 3,
                          pt: 2,
                          borderTop: `1px solid ${theme.palette.divider}`,
                        }}
                      >
                        <IconButton
                          onClick={() => handleEdit(leave)}
                          size="small"
                          sx={{
                            backgroundColor: `${theme.palette.primary.main}15`,
                            color: theme.palette.primary.main,
                            "&:hover": {
                              backgroundColor: `${theme.palette.primary.main}25`,
                              transform: "translateY(-2px)",
                            },
                            transition: "all 0.2s ease",
                            width: 36,
                            height: 36,
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteClick(leave)}
                          size="small"
                          sx={{
                            backgroundColor: `${theme.palette.error.main}15`,
                            color: theme.palette.error.main,
                            "&:hover": {
                              backgroundColor: `${theme.palette.error.main}25`,
                              transform: "translateY(-2px)",
                            },
                            transition: "all 0.2s ease",
                            width: 36,
                            height: 36,
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}

          {/* Empty state when no leaves match the filter */}
          {restrictLeaves.filter(
            (leave) =>
              leave.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              leave.department
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
              leave.jobPosition.toLowerCase().includes(searchTerm.toLowerCase())
          ).length === 0 && (
            <Grid item xs={12}>
              <Box
                sx={{
                  textAlign: "center",
                  py: 8,
                  px: 2,
                  backgroundColor: "white",
                  borderRadius: 2,
                  border: `1px dashed ${theme.palette.divider}`,
                }}
              >
                <EventIcon
                  sx={{
                    fontSize: 60,
                    color: theme.palette.action.disabled,
                    mb: 2,
                  }}
                />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No restricted leaves found
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  {searchTerm
                    ? `No restricted leaves match your search criteria. Try a different search term.`
                    : "There are no restricted leaves in the system yet."}
                </Typography>
                {searchTerm && (
                  <Button
                    variant="outlined"
                    onClick={() => setSearchTerm("")}
                    sx={{ mr: 1 }}
                  >
                    Clear Search
                  </Button>
                )}
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setFormData({
                      title: "",
                      startDate: "",
                      endDate: "",
                      department: "",
                      jobPosition: "",
                      description: "",
                    });
                    setIsAddModalOpen(true);
                    setIsEditing(false);
                  }}
                >
                  Add Restricted Leave
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>

        {/* Create Dialog */}
        <Dialog
          open={isAddModalOpen}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              width: isMobile ? "100%" : isTablet ? "600px" : "700px",
              maxWidth: "90vw",
              borderRadius: isMobile ? "0" : "20px",
              overflow: "hidden",
              margin: isMobile ? 0 : undefined,
              height: isMobile ? "100%" : undefined,
            },
          }}
        >
          <DialogTitle
            sx={{
              background: "linear-gradient(45deg, #1976d2, #64b5f6)",
              color: "white",
              fontSize: isMobile ? "1.25rem" : "1.5rem",
              fontWeight: 600,
              padding: isMobile ? "16px 20px" : "24px 32px",
              position: "relative",
            }}
          >
            {isEditing ? "Edit Restricted Leave" : "Add Restricted Leave"}
            <IconButton
              onClick={() => setIsAddModalOpen(false)}
              sx={{
                position: "absolute",
                right: 16,
                top: "50%",
                transform: "translateY(-50%)",
                color: "white",
              }}
            >
              <Close />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ padding: isMobile ? "20px" : "32px" }}>
            <form onSubmit={handleSubmit}>
              <Stack spacing={3} sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  error={!!validationErrors.title}
                  helperText={validationErrors.title}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                    },
                  }}
                />
                <Stack direction={isMobile ? "column" : "row"} spacing={2}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Start Date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    required
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                      },
                    }}
                  />

                  <TextField
                    fullWidth
                    type="date"
                    label="End Date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    required
                    error={!!validationErrors.endDate}
                    helperText={validationErrors.endDate}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                      },
                      mt: isMobile ? 0 : undefined,
                    }}
                  />
                </Stack>

                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                    sx={{
                      borderRadius: "8px",
                    }}
                  >
                    <MenuItem value="Cloud team">Cloud team</MenuItem>
                    <MenuItem value="Development team">
                      Development team
                    </MenuItem>
                    <MenuItem value="HR team">HR team</MenuItem>
                    <MenuItem value="All team">All team</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Job Position</InputLabel>
                  <Select
                    name="jobPosition"
                    value={formData.jobPosition}
                    onChange={handleChange}
                    required
                    sx={{
                      borderRadius: "8px",
                    }}
                  >
                    <MenuItem value="Associate Engineer">
                      Associate Engineer
                    </MenuItem>
                    <MenuItem value="Senior Engineer">Senior Engineer</MenuItem>
                    <MenuItem value="Manager">Manager</MenuItem>
                    <MenuItem value="Hr">HR</MenuItem>
                    <MenuItem value="All">For All</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                    },
                  }}
                />

                <Stack
                  direction={isMobile ? "column" : "row"}
                  spacing={2}
                  justifyContent={isMobile ? "stretch" : "flex-end"}
                  sx={{ mt: 4 }}
                >
                  <Button
                    onClick={() => setIsAddModalOpen(false)}
                    fullWidth={isMobile}
                    sx={{
                      border: "2px solid #1976d2",
                      color: "#1976d2",
                      "&:hover": {
                        border: "2px solid #64b5f6",
                        backgroundColor: "#e3f2fd",
                      },
                      borderRadius: "8px",
                      px: 4,
                      py: 1,
                      fontWeight: 600,
                      order: isMobile ? 1 : 0,
                      mt: isMobile ? 1 : 0,
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    fullWidth={isMobile}
                    sx={{
                      background: "linear-gradient(45deg, #1976d2, #64b5f6)",
                      color: "white",
                      "&:hover": {
                        background: "linear-gradient(45deg, #1565c0, #42a5f5)",
                      },
                      borderRadius: "8px",
                      px: 4,
                      py: 1,
                      fontWeight: 600,
                      order: isMobile ? 0 : 1,
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : isEditing ? (
                      "Update"
                    ) : (
                      "Create"
                    )}
                  </Button>
                </Stack>
              </Stack>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
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
            <DeleteIcon />
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
              Are you sure you want to delete this restricted leave?
            </Alert>
            {leaveToDelete && (
              <Box sx={{ mt: 2, p: 2, bgcolor: "#f8fafc", borderRadius: 2 }}>
                <Typography variant="body1" fontWeight={600} color="#2c3e50">
                  Restricted Leave: {leaveToDelete.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Start Date: {formatDate(leaveToDelete.startDate)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  End Date: {formatDate(leaveToDelete.endDate)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Department: {leaveToDelete.department}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Position: {leaveToDelete.jobPosition}
                </Typography>
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
      </Paper>
    </Container>
  );
}

export default RestrictLeaves;
