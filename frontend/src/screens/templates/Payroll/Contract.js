import React, { useState, useEffect, useRef, useCallback } from "react";
import { styled } from "@mui/material/styles";
import api from "../../../api/axiosInstance";
import {
  FaSortUp,
  FaSortDown,
  FaInfoCircle,
  FaEdit,
  FaTrash,
  FaSave,
  FaClipboardCheck,
  FaExclamationTriangle,
  FaFileExport,
  FaFileExcel,
  FaFilePdf,
  FaChartBar,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaRedo,
  FaPlus,
  FaSearch,
  FaFileContract,
  FaEye,
} from "react-icons/fa";
import { CSVLink } from "react-csv";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Contract.css";

import {
  Divider,
  Dialog,
  useTheme,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Button,
  Grid,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  CircularProgress,
  Stack,
  Paper,
  Card,
  CardContent,
  Chip,
  alpha,
  Fade,
  Alert,
} from "@mui/material";
import {
  Close,
  Save as SaveIcon,
  Cancel as CancelIcon,
  AttachMoney as AttachMoneyIcon,
} from "@mui/icons-material";

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(1),
  boxShadow: "0 3px 5px 2px rgba(0, 0, 0, .1)",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
  },
}));

const Contract = () => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [contracts, setContracts] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "" });
  const [editingId, setEditingId] = useState(null);

  const [showCreatePage, setShowCreatePage] = useState(false);
  const [formData, setFormData] = useState({
    contractStatus: "Active",
    contractTitle: "",
    employee: "",
    startDate: "",
    endDate: "",
    wageType: "",
    payFrequency: "",
    basicSalary: "",
    filingStatus: "",
    department: "",
    position: "",
    role: "",
    shift: "",
    workType: "",
    noticePeriod: "",
    contractDocument: null,
    deductFromBasicPay: false,
    calculateDailyLeave: false,
    note: "",
  });
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [filterData, setFilterData] = useState({
    employeeName: "",
    contractStatus: "",
    startDate: "",
    endDate: "",
    contract: "",
    wageType: "",
    department: "",
    minSalary: "",
    maxSalary: "",
    filingStatus: "",
  });
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [selectedContracts, setSelectedContracts] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [dashboardOrientation, setDashboardOrientation] = useState("landscape");
  const [dashboardStats, setDashboardStats] = useState(null);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewalData, setRenewalData] = useState({
    id: null,
    startDate: "",
    endDate: "",
    basicSalary: "",
    renewalReason: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [bulkAction, setBulkAction] = useState("");
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [bulkUpdateData, setBulkUpdateData] = useState({});

  // Add a new state for the preview modal and selected contract
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewContract, setPreviewContract] = useState(null);

  // New state variables for employee selection feature
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");

  const handlePreview = (contract) => {
    setPreviewContract(contract);
    setShowPreviewModal(true);
  };
  const filterRef = useRef(null);
  const csvLink = useRef(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState(null);

  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [contractsToDelete, setContractsToDelete] = useState([]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if clicking on a select or menu item
      if (
        event.target.closest(".MuiSelect-select") ||
        event.target.closest(".MuiMenuItem-root") ||
        event.target.closest(".MuiList-root") ||
        event.target.closest(".MuiBackdrop-root")
      ) {
        return;
      }

      // Only close if clicking outside the filter popup
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilterPopup(false);
      }
    };

    // Only add the listener when the popup is shown
    if (showFilterPopup) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilterPopup]);

  //Filtered contracts when contracts change
  useEffect(() => {
    if (contracts.length > 0) {
      setFilteredContracts(contracts);
      const totalPages = Math.ceil(contracts.length / itemsPerPage);
      setTotalPages(totalPages);
    }
  }, [contracts, itemsPerPage]);

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get("/payroll-contracts");

      if (response.data.success) {
        setContracts(response.data.data);
        setFilteredContracts(response.data.data);
        // Calculate total pages directly here
        const totalPages = Math.ceil(response.data.data.length / itemsPerPage);
        setTotalPages(totalPages);
      } else {
        toast.error("Failed to fetch contracts");
      }
    } catch (error) {
      console.error("Error fetching contracts:", error);
      toast.error("Failed to fetch contracts");
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage]);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoadingEmployees(true);
      const response = await api.get(
        "/employees/registered"
      );
      if (response.data) {
        setEmployees(response.data);
      }
      setLoadingEmployees(false);
    } catch (error) {
      // Error handling remains the same
      setLoadingEmployees(false);
    }
  }, []);

  useEffect(() => {
    fetchContracts();
    fetchEmployees(); // Fetch employees when component mounts
  }, [fetchContracts, fetchEmployees]);

  const handleDeleteClick = (contract) => {
    setContractToDelete(contract);
    setDeleteDialogOpen(true);
  };

  const handleEmployeeSelect = async (employeeId) => {
    setSelectedEmployee(employeeId);
    if (!employeeId) return;

    try {
      setLoading(true);

      const response = await api.get(`/employees/get-employee/${employeeId}`);
      console.log("Employee details response:", response.data); // Debug log

      if (response.data) {
        const employee = response.data;

        // Extract employee name with fallbacks for different data structures
        let employeeName = "";

        // Try different possible structures for employee name
        if (
          employee.personalInfo?.firstName &&
          employee.personalInfo?.lastName
        ) {
          employeeName = `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`;
        } else if (employee.firstName && employee.lastName) {
          employeeName = `${employee.firstName} ${employee.lastName}`;
        } else if (employee.name) {
          employeeName = employee.name;
        } else if (employee.fullName) {
          employeeName = employee.fullName;
        } else if (employee.employeeName) {
          employeeName = employee.employeeName;
        } else {
          // If no name found, use employee ID as fallback
          employeeName = `Employee ${employeeId}`;
          console.warn(
            "Could not find employee name in response data:",
            employee
          );
        }

        console.log("Setting employee name to:", employeeName); // Debug log

        // Populate form data with employee details
        setFormData((prevData) => ({
          ...prevData,
          employee: employeeName,
          department:
            employee.jobDetails?.department || employee.department || "",
          position: employee.jobDetails?.position || employee.position || "",
          role: employee.jobDetails?.role || employee.role || "",
          shift: employee.jobDetails?.shift || employee.shift || "",
          workType: employee.jobDetails?.workType || employee.workType || "",
        }));

        // Show success message
        toast.success(`Employee ${employeeName} selected`);
      } else {
        toast.warning("Employee data not found");
      }
    } catch (error) {
      console.error("Error fetching employee details:", error);
      toast.error("Failed to fetch employee details");
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      const response = await api.get("/payroll-contracts/dashboard");

      if (response.data && response.data.success) {
        setDashboardStats(response.data.data);
        toast.success("Dashboard data loaded successfully");
      } else {
        // If the API returns a non-success response
        console.error("Failed to fetch dashboard stats:", response.data);
        toast.error("Failed to load dashboard data");

        // Create some default stats to prevent UI issues
        setDashboardStats({
          totalContracts: contracts.length,
          byStatus: {
            active: contracts.filter((c) => c.contractStatus === "Active")
              .length,
            expired: contracts.filter((c) => c.contractStatus === "Expired")
              .length,
            draft: contracts.filter((c) => c.contractStatus === "Draft").length,
            terminated: contracts.filter(
              (c) => c.contractStatus === "Terminated"
            ).length,
          },
          expiringContracts: {
            count: 0,
            contracts: [],
          },
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      toast.error("Failed to load dashboard data");

      // Create some default stats to prevent UI issues
      setDashboardStats({
        totalContracts: contracts.length,
        byStatus: {
          active: contracts.filter((c) => c.contractStatus === "Active").length,
          expired: contracts.filter((c) => c.contractStatus === "Expired")
            .length,
          draft: contracts.filter((c) => c.contractStatus === "Draft").length,
          terminated: contracts.filter((c) => c.contractStatus === "Terminated")
            .length,
        },
        expiringContracts: {
          count: 0,
          contracts: [],
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCreate = async () => {
    try {
      setLoading(true);

      // Validate required fields
      if (
        !formData.contractTitle ||
        !formData.employee ||
        !formData.startDate ||
        !formData.wageType ||
        !formData.basicSalary
      ) {
        toast.error("Please fill all required fields");
        setLoading(false);
        return;
      }

      // Create FormData for file upload
      const formDataToSend = new FormData();

      // Append all form fields
      formDataToSend.append("contract", formData.contractTitle);
      formDataToSend.append("contractStatus", formData.contractStatus);
      formDataToSend.append("employee", formData.employee);
      formDataToSend.append("startDate", formData.startDate);
      formDataToSend.append("endDate", formData.endDate);
      formDataToSend.append("wageType", formData.wageType);
      formDataToSend.append("payFrequency", formData.payFrequency);
      formDataToSend.append("basicSalary", Number(formData.basicSalary));
      formDataToSend.append("filingStatus", formData.filingStatus);
      formDataToSend.append("department", formData.department);
      formDataToSend.append("position", formData.position);
      formDataToSend.append("role", formData.role);
      formDataToSend.append("shift", formData.shift);
      formDataToSend.append("workType", formData.workType);
      formDataToSend.append("noticePeriod", Number(formData.noticePeriod));
      formDataToSend.append("deductFromBasicPay", formData.deductFromBasicPay);
      formDataToSend.append(
        "calculateDailyLeave",
        formData.calculateDailyLeave
      );
      formDataToSend.append("note", formData.note);

      // Append file if present
      if (formData.contractDocument) {
        console.log("Appending file to FormData:", formData.contractDocument);
        formDataToSend.append("contractDocument", formData.contractDocument);
      }

      // Log FormData contents for debugging
      console.log("FormData contents:");
      for (let [key, value] of formDataToSend.entries()) {
        console.log(key, value);
      }

      let response;
      if (editingId) {
        response = await api.put(
          `/payroll-contracts/${editingId}`,
          formDataToSend,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      } else {
        response = await api.post("/payroll-contracts", formDataToSend, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      if (response.data.success) {
        toast.success(
          editingId
            ? "Contract updated successfully"
            : "Contract created successfully"
        );

        // Update the contracts list
        if (editingId) {
          setContracts(
            contracts.map((contract) =>
              contract._id === editingId ? response.data.data : contract
            )
          );
          setFilteredContracts(
            filteredContracts.map((contract) =>
              contract._id === editingId ? response.data.data : contract
            )
          );
        } else {
          setContracts([...contracts, response.data.data]);
          setFilteredContracts([...filteredContracts, response.data.data]);
        }

        // Reset form and close create/edit page
        setShowCreatePage(false);
        setEditingId(null);
        setSelectedEmployee("");
      } else {
        toast.error(response.data.error || "Failed to process contract");
      }
    } catch (error) {
      console.error("Contract operation error:", error);
      toast.error(error.response?.data?.error || "Failed to process contract");
    } finally {
      setLoading(false);
    }
  };

  // HandleSave function (for inline editing)
  const handleSave = async () => {
    try {
      setLoading(true);
    } catch (error) {
      // Error handling remains the same
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setLoading(true);

      const response = await api.delete(
        `/payroll-contracts/${contractToDelete._id}`
      );

      if (response.data.success) {
        toast.success("Contract deleted successfully");
        setContracts(
          contracts.filter((contract) => contract._id !== contractToDelete._id)
        );
        setFilteredContracts(
          filteredContracts.filter(
            (contract) => contract._id !== contractToDelete._id
          )
        );
        setSelectedContracts(
          selectedContracts.filter((id) => id !== contractToDelete._id)
        );
      } else {
        toast.error(response.data.error || "Failed to delete contract");
      }

      setDeleteDialogOpen(false);
      setContractToDelete(null);
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error(error.response?.data?.error || "Failed to delete contract");
    } finally {
      setLoading(false);
    }
  };

  const toggleDashboard = () => {
    if (filteredContracts.length === 0 && !showDashboard) {
      toast.warning("No data available to display in dashboard");
      return;
    }

    // If we're about to show the dashboard
    if (!showDashboard) {
      setDashboardOrientation("landscape");
      // Set a loading indicator
      setLoading(true);
      // Fetch dashboard stats
      fetchDashboardStats().catch((error) => {
        console.error("Error in toggleDashboard:", error);
        toast.error("Failed to load dashboard");
        setLoading(false);
      });
    }

    // Toggle the dashboard visibility
    setShowDashboard(!showDashboard);
  };

  // Handle create button click
  const handleCreateClick = () => {
    setFormData({
      contractStatus: "Active",
      contractTitle: "",
      employee: "",
      startDate: "",
      endDate: "",
      wageType: "",
      payFrequency: "",
      basicSalary: "",
      filingStatus: "",
      department: "",
      position: "",
      role: "",
      shift: "",
      workType: "",
      noticePeriod: "",
      contractDocument: null,
      deductFromBasicPay: false,
      calculateDailyLeave: false,
      note: "",
    });
    setSelectedEmployee(""); // Reset selected employee
    setShowCreatePage(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file") {
      const file = files[0];
      console.log("File selected:", file); // Debug log
      setFormData({
        ...formData,
        [name]: file,
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };

  // Handle sorting
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sortedContracts = [...filteredContracts].sort((a, b) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });
    setFilteredContracts(sortedContracts);
  };

  const handleEdit = (contract) => {
    // Define the available options for position and role
    const availablePositions = [
      "HR Manager",
      "Sales Representative",
      "Software Developer",
      "Marketing Specialist",
      "Accountant",
      "IT Support",
    ];

    const availableRoles = [
      "Intern",
      "Junior",
      "Senior",
      "Manager",
      "Director",
    ];

    // Check if the contract's position is in the available options
    const validPosition = availablePositions.includes(contract.position)
      ? contract.position
      : "";

    // Check if the contract's role is in the available options
    const validRole = availableRoles.includes(contract.role)
      ? contract.role
      : "";

    // Populate the form data with the selected contract's values
    setFormData({
      contractStatus: contract.contractStatus || "Active",
      contractTitle: contract.contract || "",
      employee: contract.employee || "",
      startDate: contract.startDate || "",
      endDate: contract.endDate || "",
      wageType: contract.wageType || "",
      payFrequency: contract.payFrequency || "",
      basicSalary: contract.basicSalary || "",
      filingStatus: contract.filingStatus || "",
      department: contract.department || "",
      position: validPosition, // Use validated position
      role: validRole, // Use validated role
      shift: contract.shift || "",
      workType: contract.workType || "",
      noticePeriod: contract.noticePeriod || "",
      contractDocument: null, // Can't pre-fill file inputs
      deductFromBasicPay: contract.deductFromBasicPay || false,
      calculateDailyLeave: contract.calculateDailyLeave || false,
      note: contract.note || "",
    });

    // Store the contract ID for updating
    setEditingId(contract._id);

    // Reset selected employee when editing
    setSelectedEmployee("");

    // Show the create page (which will now function as an edit page)
    setShowCreatePage(true);
  };

  // Handle search
  const handleSearchChange = (e) => {
    const searchValue = e.target.value.toLowerCase();
    setSearchTerm(searchValue);

    const searchResults = contracts.filter(
      (contract) =>
        (contract.employee &&
          contract.employee.toLowerCase().includes(searchValue)) ||
        (contract.contract &&
          contract.contract.toLowerCase().includes(searchValue)) ||
        (contract.wageType &&
          contract.wageType.toLowerCase().includes(searchValue)) ||
        (contract.filingStatus &&
          contract.filingStatus.toLowerCase().includes(searchValue))
    );

    setFilteredContracts(searchResults);
    setCurrentPage(1);
  };

  const handleSelectContract = (id) => {
    if (selectedContracts.includes(id)) {
      setSelectedContracts(
        selectedContracts.filter((contractId) => contractId !== id)
      );
    } else {
      setSelectedContracts([...selectedContracts, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedContracts([]);
    } else {
      const currentPageContracts = getCurrentPageItems();
      setSelectedContracts(
        currentPageContracts.map((contract) => contract._id)
      );
    }
    setSelectAll(!selectAll);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredContracts.length === 0) {
      toast.warning("No data available to export");
      return;
    }
    // CSV Link component will handle the actual export
    csvLink.current.link.click();
  };

  // Export to PDF
  const exportToPDF = () => {
    if (filteredContracts.length === 0) {
      toast.warning("No data available to export");
      return;
    }

    try {
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(18);
      doc.text("Contracts Report", 14, 22);

      // Add date
      doc.setFontSize(11);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

      // Define table columns
      const tableColumn = [
        "Contract",
        "Employee",
        "Start Date",
        "End Date",
        "Wage Type",
        "Basic Salary",
        "Status",
      ];

      // Define table rows
      const tableRows = [];

      // Add data to rows
      const contractsToExport =
        selectedContracts.length > 0
          ? filteredContracts.filter((contract) =>
              selectedContracts.includes(contract._id)
            )
          : filteredContracts;

      contractsToExport.forEach((contract) => {
        const contractData = [
          contract.contract,
          contract.employee,
          contract.startDate,
          contract.endDate || "N/A",
          contract.wageType,
          contract.basicSalary,
          contract.contractStatus || "Active",
        ];
        tableRows.push(contractData);
      });

      // Generate the table
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        styles: {
          fontSize: 10,
          cellPadding: 3,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
      });

      // Save the PDF
      doc.save("contracts_report.pdf");
      toast.success("PDF exported successfully");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF");
    }
  };

  // Handle bulk action change
  const handleBulkActionChange = (e) => {
    setBulkAction(e.target.value);
  };

  const handleBulkUpdate = async () => {
    try {
      console.log("=== FRONTEND BULK UPDATE START ===");
      console.log("Selected contracts:", selectedContracts);
      console.log("Bulk update data:", bulkUpdateData);

      setLoading(true);

      if (selectedContracts.length === 0) {
        toast.warning("No contracts selected for update");
        setLoading(false);
        return;
      }

      if (!bulkUpdateData.value) {
        toast.warning("Please select a status to update");
        setLoading(false);
        return;
      }

      // Prepare the updates object
      const updates = {
        contractStatus: bulkUpdateData.value,
      };

      // Add reason to notes if provided
      if (bulkUpdateData.reason) {
        updates.note = bulkUpdateData.reason;
      }

      console.log("Sending bulk update request with:", {
        contractIds: selectedContracts,
        updates: updates,
      });

      const response = await api.post("/payroll-contracts/bulk-update", {
        contractIds: selectedContracts,
        updates: updates,
      });

      console.log("Bulk update response:", response.data);

      if (response.data.success) {
        toast.success(
          response.data.message ||
            `Updated ${selectedContracts.length} contracts successfully`
        );

        // Refresh the contracts list
        await fetchContracts();

        // Clear selections and close modal
        setSelectedContracts([]);
        setSelectAll(false);
        setShowBulkUpdateModal(false);
        setBulkUpdateData({});
        setBulkAction("");

        console.log("✅ Bulk update completed successfully");
      } else {
        throw new Error(response.data.error || "Bulk update failed");
      }
    } catch (error) {
      console.error("❌ Bulk update error:", error);

      let errorMessage = "Failed to update contracts";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
      console.log("=== FRONTEND BULK UPDATE END ===");
    }
  };

  // Replace the existing handleBulkDelete function with this:
  const handleBulkDelete = async () => {
    try {
      console.log("=== FRONTEND BULK DELETE START ===");
      console.log("Selected contracts for deletion:", selectedContracts);

      setLoading(true);

      if (selectedContracts.length === 0) {
        toast.warning("No contracts selected for deletion");
        setLoading(false);
        return;
      }

      console.log("Sending bulk delete request with:", {
        contractIds: selectedContracts,
      });

      const response = await api.post("/payroll-contracts/bulk-delete", {
        contractIds: selectedContracts,
      });

      console.log("Bulk delete response:", response.data);

      if (response.data.success) {
        toast.success(
          response.data.message ||
            `Deleted ${selectedContracts.length} contracts successfully`
        );

        // Refresh the contracts list
        await fetchContracts();

        // Clear selections and close dialog
        setSelectedContracts([]);
        setSelectAll(false);
        setBulkAction("");
        setBulkDeleteDialogOpen(false);
        setContractsToDelete([]);

        console.log("✅ Bulk delete completed successfully");
      } else {
        throw new Error(response.data.error || "Bulk delete failed");
      }
    } catch (error) {
      console.error("❌ Bulk delete error:", error);

      let errorMessage = "Failed to delete contracts";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
      console.log("=== FRONTEND BULK DELETE END ===");
    }
  };

  // Add this function to show the bulk delete confirmation dialog
  const handleBulkDeleteClick = () => {
    if (selectedContracts.length === 0) {
      toast.warning("No contracts selected for deletion");
      return;
    }

    // Get the contract details for the selected contracts
    const contractsToDeleteDetails = contracts.filter((contract) =>
      selectedContracts.includes(contract._id)
    );

    setContractsToDelete(contractsToDeleteDetails);
    setBulkDeleteDialogOpen(true);
  };

  // Update the handleApplyBulkAction function:
  const handleApplyBulkAction = () => {
    if (!bulkAction || selectedContracts.length === 0) {
      toast.warning("Please select an action and at least one contract");
      return;
    }

    console.log("Applying bulk action:", bulkAction);
    console.log("Selected contracts:", selectedContracts);

    switch (bulkAction) {
      case "delete":
        handleBulkDeleteClick(); // Changed this line to show confirmation dialog
        break;
      case "export":
        if (selectedContracts.length === 0) {
          toast.warning("No contracts selected for export");
          return;
        }
        exportToPDF();
        break;
      case "status":
        if (selectedContracts.length === 0) {
          toast.warning("No contracts selected for status update");
          return;
        }
        setShowBulkUpdateModal(true);
        setBulkUpdateData({ field: "contractStatus", value: "Active" });
        break;
      default:
        toast.warning("Invalid action selected");
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // Get current page items
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredContracts.slice(startIndex, endIndex);
  };

  // Prepare CSV data
  const csvData =
    selectedContracts.length > 0
      ? filteredContracts.filter((contract) =>
          selectedContracts.includes(contract._id)
        )
      : filteredContracts;

  // Define CSV headers
  const csvHeaders = [
    { label: "Contract", key: "contract" },
    { label: "Employee", key: "employee" },
    { label: "Start Date", key: "startDate" },
    { label: "End Date", key: "endDate" },
    { label: "Wage Type", key: "wageType" },
    { label: "Basic Salary", key: "basicSalary" },
    { label: "Filing Status", key: "filingStatus" },
    { label: "Contract Status", key: "contractStatus" },
    { label: "Department", key: "department" },
  ];

  // Render create page

  if (showCreatePage) {
    return (
      <Dialog
        open={true}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            width: "90%",
            maxWidth: "900px",
            borderRadius: "12px",
            overflow: "hidden",
          },
        }}
      >
        {loading && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              zIndex: 9999,
            }}
          >
            <CircularProgress />
          </Box>
        )}

        <DialogTitle
          sx={{
            background: "linear-gradient(45deg, #1976d2, #64b5f6)",
            color: "white",
            fontSize: "1.5rem",
            fontWeight: 600,
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography
            variant="h6"
            component="div"
            sx={{ display: "flex", alignItems: "center" }}
          >
            <FaFileContract style={{ marginRight: "10px" }} />
            {editingId ? "Edit Contract" : "New Contract"}
          </Typography>
          <IconButton
            onClick={() => {
              setShowCreatePage(false);
              setEditingId(null);
              setSelectedEmployee("");
            }}
            sx={{ color: "white" }}
            size="small"
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ padding: "24px" }}>
          {/* Employee Selection Dropdown */}
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>Select Onboarded Employee</InputLabel>
              <Select
                value={selectedEmployee}
                onChange={(e) => handleEmployeeSelect(e.target.value)}
                label="Select Onboarded Employee"
                disabled={loadingEmployees || editingId}
                startAdornment={
                  loadingEmployees ? (
                    <InputAdornment position="start">
                      <CircularProgress size={20} />
                    </InputAdornment>
                  ) : null
                }
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                }}
              >
                <MenuItem value="" disabled>
                  <em>Select an employee</em>
                </MenuItem>
                <MenuItem>
                  <TextField
                    size="small"
                    autoFocus
                    placeholder="Search employees..."
                    fullWidth
                    value={employeeSearchTerm}
                    onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </MenuItem>
                {employees
                  .filter((emp) =>
                    `${emp.personalInfo?.firstName || ""} ${
                      emp.personalInfo?.lastName || ""
                    } ${emp.Emp_ID || ""}`
                      .toLowerCase()
                      .includes(employeeSearchTerm.toLowerCase())
                  )
                  .map((emp) => (
                    <MenuItem key={emp._id} value={emp.Emp_ID}>
                      {emp.personalInfo?.firstName} {emp.personalInfo?.lastName}{" "}
                      ({emp.Emp_ID})
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Box>

          <Box component="form" sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel>Contract Status</InputLabel>
                  <Select
                    name="contractStatus"
                    value={formData.contractStatus}
                    onChange={handleInputChange}
                    label="Contract Status"
                  >
                    <MenuItem value="Draft">Draft</MenuItem>
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Expired">Expired</MenuItem>
                    <MenuItem value="Terminated">Terminated</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Contract"
                  name="contractTitle"
                  value={formData.contractTitle}
                  onChange={handleInputChange}
                  placeholder="e.g., Contractor Name"
                  variant="outlined"
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <FaInfoCircle
                          style={{ color: "#1976d2", fontSize: "14px" }}
                        />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Employee"
                  name="employee"
                  value={formData.employee}
                  onChange={handleInputChange}
                  placeholder="Employee name"
                  variant="outlined"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Start Date"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel>Wage Type</InputLabel>
                  <Select
                    required
                    name="wageType"
                    value={formData.wageType}
                    onChange={handleInputChange}
                    label="Wage Type"
                  >
                    <MenuItem value="">Select Wage Type</MenuItem>
                    <MenuItem value="Daily">Daily</MenuItem>
                    <MenuItem value="Monthly">Monthly</MenuItem>
                    <MenuItem value="Hourly">Hourly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel>Pay Frequency</InputLabel>
                  <Select
                    required
                    name="payFrequency"
                    value={formData.payFrequency}
                    onChange={handleInputChange}
                    label="Pay Frequency"
                  >
                    <MenuItem value="">Select Frequency</MenuItem>
                    <MenuItem value="Weekly">Weekly</MenuItem>
                    <MenuItem value="Monthly">Monthly</MenuItem>
                    <MenuItem value="Semi-Monthly">Semi-Monthly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Basic Salary"
                  name="basicSalary"
                  type="number"
                  value={formData.basicSalary}
                  onChange={handleInputChange}
                  placeholder="Enter amount"
                  variant="outlined"
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoneyIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel>Filing Status</InputLabel>
                  <Select
                    name="filingStatus"
                    value={formData.filingStatus}
                    onChange={handleInputChange}
                    label="Filing Status"
                  >
                    <MenuItem value="">Select Filing Status</MenuItem>
                    <MenuItem value="Individual">Individual</MenuItem>
                    <MenuItem value="Head of Household (HOH)">
                      Head of Household (HOH)
                    </MenuItem>
                    <MenuItem value="Married Filing Jointly (MFJ)">
                      Married Filing Jointly (MFJ)
                    </MenuItem>
                    <MenuItem value="Married Filing Separately (MFS)">
                      Married Filing Separately (MFS)
                    </MenuItem>
                    <MenuItem value="Single Filer">Single Filer</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel>Department</InputLabel>
                  <Select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    label="Department"
                  >
                    <MenuItem value="">Select Department</MenuItem>
                    <MenuItem value="HR Dept">HR Dept</MenuItem>
                    <MenuItem value="Sales Dept">Sales Dept</MenuItem>
                    <MenuItem value="S/W Dept">S/W Dept</MenuItem>
                    <MenuItem value="Marketing Dept">Marketing Dept</MenuItem>
                    <MenuItem value="Finance Dept">Finance Dept</MenuItem>
                    <MenuItem value="IT Dept">IT Dept</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel>Job Position</InputLabel>
                  <Select
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    label="Job Position"
                  >
                    <MenuItem value="">Select Position</MenuItem>
                    <MenuItem value="HR Manager">HR Manager</MenuItem>
                    <MenuItem value="Sales Representative">
                      Sales Representative
                    </MenuItem>
                    <MenuItem value="Software Developer">
                      Software Developer
                    </MenuItem>
                    <MenuItem value="Marketing Specialist">
                      Marketing Specialist
                    </MenuItem>
                    <MenuItem value="Accountant">Accountant</MenuItem>
                    <MenuItem value="IT Support">IT Support</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel>Job Role</InputLabel>
                  <Select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    label="Job Role"
                  >
                    <MenuItem value="">Select Role</MenuItem>
                    <MenuItem value="Intern">Intern</MenuItem>
                    <MenuItem value="Junior">Junior</MenuItem>
                    <MenuItem value="Senior">Senior</MenuItem>
                    <MenuItem value="Manager">Manager</MenuItem>
                    <MenuItem value="Director">Director</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel>Shift</InputLabel>
                  <Select
                    name="shift"
                    value={formData.shift}
                    onChange={handleInputChange}
                    label="Shift"
                  >
                    <MenuItem value="">Select Shift</MenuItem>
                    <MenuItem value="General Shift">General Shift</MenuItem>
                    <MenuItem value="Regular">Regular</MenuItem>
                    <MenuItem value="Morning Shift">Morning Shift</MenuItem>
                    <MenuItem value="Evening Shift">Evening Shift</MenuItem>
                    <MenuItem value="Night Shift">Night Shift</MenuItem>
                    <MenuItem value="Second Shift">Second Shift</MenuItem>
                    <MenuItem value="Third Shift">Third Shift</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel>Work Type</InputLabel>
                  <Select
                    name="workType"
                    value={formData.workType}
                    onChange={handleInputChange}
                    label="Work Type"
                  >
                    <MenuItem value="">Select Work Type</MenuItem>
                    <MenuItem value="Hybrid">Hybrid</MenuItem>
                    <MenuItem value="Remote">Remote</MenuItem>
                    <MenuItem value="On-site">On-site</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Notice Period"
                  name="noticePeriod"
                  type="number"
                  value={formData.noticePeriod}
                  onChange={handleInputChange}
                  placeholder="Days"
                  variant="outlined"
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <FaInfoCircle
                          style={{ color: "#1976d2", fontSize: "14px" }}
                          title="Notice period in total days"
                        />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<FaFileContract />}
                    sx={{
                      mt: 1,
                      alignSelf: "flex-start",
                      borderColor: "#1976d2",
                      color: "#1976d2",
                      "&:hover": {
                        backgroundColor: "#e3f2fd",
                        borderColor: "#1976d2",
                      },
                    }}
                  >
                    Upload Contract Document
                    <input
                      type="file"
                      name="contractDocument"
                      onChange={handleInputChange}
                      accept=".pdf,.doc,.docx,.txt"
                      hidden
                    />
                  </Button>
                  {formData.contractDocument && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        p: 2,
                        backgroundColor: "#f0f8ff",
                        borderRadius: "8px",
                        border: "1px solid #e3f2fd",
                      }}
                    >
                      <FaFileContract
                        style={{ color: "#1976d2", fontSize: "16px" }}
                      />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Selected file: {formData.contractDocument.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Size:{" "}
                          {(formData.contractDocument.size / 1024).toFixed(2)}{" "}
                          KB
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        onClick={() => {
                          setFormData({ ...formData, contractDocument: null });
                        }}
                        sx={{ color: "#f44336", minWidth: "auto", p: 0.5 }}
                      >
                        <FaTrash />
                      </Button>
                    </Box>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Note"
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  placeholder="Additional notes about the contract"
                  variant="outlined"
                  size="small"
                />
              </Grid>
            </Grid>

            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                mt: 3,
                gap: 2,
              }}
            >
              <Button
                variant="outlined"
                onClick={() => {
                  setShowCreatePage(false);
                  setEditingId(null);
                  setSelectedEmployee("");
                }}
                startIcon={<CancelIcon />}
                sx={{
                  border: "2px solid #1976d2",
                  color: "#1976d2",
                  "&:hover": {
                    border: "2px solid #64b5f6",
                    backgroundColor: "#e3f2fd",
                  },
                  borderRadius: "8px",
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveCreate}
                startIcon={<SaveIcon />}
                sx={{
                  background: "linear-gradient(45deg, #1976d2, #64b5f6)",
                  color: "white",
                  "&:hover": {
                    background: "linear-gradient(45deg, #1565c0, #42a5f5)",
                  },
                  borderRadius: "8px",
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                }}
              >
                {editingId ? "Update Contract" : "Save Contract"}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="contract-page">
      {/* Hidden CSV Link for export */}
      {filteredContracts.length > 0 && (
        <CSVLink
          data={csvData}
          headers={csvHeaders}
          filename="contracts_export.csv"
          className="hidden"
          ref={csvLink}
        />
      )}

      {/* Toast notifications */}
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Loading overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}

      {/* Header */}

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
          <FaFileContract style={{ marginRight: "10px" }} />
          CONTRACT
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
            <TextField
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearchChange}
              size="small"
              sx={{
                width: { xs: "100%", sm: "300px" },
                marginRight: { xs: 0, sm: "auto" },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FaSearch />
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
                startIcon={<FaPlus />}
                onClick={handleCreateClick}
                sx={{
                  height: { xs: "auto", sm: 50 },
                  padding: { xs: "8px 16px", sm: "6px 16px" },
                  width: { xs: "100%", sm: "auto" },
                  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
                  color: "white",
                  "&:hover": {
                    background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
                  },
                  borderRadius: "8px",
                }}
              >
                Create
              </Button>
            </Box>
          </Box>
        </StyledPaper>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Export toolbar - Only show when data exists */}
      {filteredContracts.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            backgroundColor: "#f8fafc",
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "24px",
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 2,
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              color: "#475569",
              display: "flex",
              alignItems: "center",
            }}
          >
            <FaFileExport style={{ marginRight: "8px" }} />
            Export & Reports:
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            sx={{ "& button": { minWidth: "auto" } }}
          >
            <Button
              size="small"
              startIcon={<FaFileExcel />}
              onClick={handleExportCSV}
              sx={{ color: "#16a34a" }}
              disabled={filteredContracts.length === 0}
            >
              Excel
            </Button>
            <Button
              size="small"
              startIcon={<FaFilePdf />}
              onClick={exportToPDF}
              sx={{ color: "#ef4444" }}
              disabled={filteredContracts.length === 0}
            >
              PDF
            </Button>
            <Button
              size="small"
              startIcon={<FaChartBar />}
              onClick={toggleDashboard}
              sx={{ color: "#1976d2" }}
              disabled={filteredContracts.length === 0}
            >
              {showDashboard ? "Hide Dashboard" : "Show Dashboard"}
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Status Filter Buttons */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "end",
          flexDirection: { xs: "column", sm: "row" },
          gap: 1,
          mb: 2,
          mt: 2,
        }}
      >
        <Button
          sx={{
            color: "green",
            justifyContent: { xs: "flex-start", sm: "center" },
            width: { xs: "100%", sm: "auto" },
          }}
          onClick={() => {
            try {
              setLoading(true);

              // Filter for Active contracts
              const filtered = contracts.filter(
                (contract) => contract.contractStatus === "Active"
              );

              console.log("All contracts:", contracts);
              console.log("Filtered Active contracts:", filtered);

              setFilteredContracts(filtered);
              setFilterData({ ...filterData, contractStatus: "Active" });
              setCurrentPage(1);

              // Calculate total pages manually
              const newTotalPages = Math.ceil(filtered.length / itemsPerPage);
              setTotalPages(newTotalPages);

              toast.success(`Found ${filtered.length} Active contracts`);
            } catch (error) {
              console.error("Filter error:", error);
              toast.error("Failed to filter contracts");
            } finally {
              setLoading(false);
            }
          }}
        >
          ● Active
        </Button>

        <Button
          sx={{
            color: "red",
            justifyContent: { xs: "flex-start", sm: "center" },
            width: { xs: "100%", sm: "auto" },
          }}
          onClick={() => {
            try {
              setLoading(true);

              // Filter for Terminated contracts
              const filtered = contracts.filter(
                (contract) => contract.contractStatus === "Terminated"
              );

              console.log("All contracts:", contracts);
              console.log("Filtered Terminated contracts:", filtered);

              setFilteredContracts(filtered);
              setFilterData({ ...filterData, contractStatus: "Terminated" });
              setCurrentPage(1);

              // Calculate total pages manually
              const newTotalPages = Math.ceil(filtered.length / itemsPerPage);
              setTotalPages(newTotalPages);

              toast.success(`Found ${filtered.length} Terminated contracts`);
            } catch (error) {
              console.error("Filter error:", error);
              toast.error("Failed to filter contracts");
            } finally {
              setLoading(false);
            }
          }}
        >
          ● Terminated
        </Button>

        <Button
          sx={{
            color: "orange",
            justifyContent: { xs: "flex-start", sm: "center" },
            width: { xs: "100%", sm: "auto" },
          }}
          onClick={() => {
            try {
              setLoading(true);

              // Filter for Draft contracts
              const filtered = contracts.filter(
                (contract) => contract.contractStatus === "Draft"
              );

              console.log("All contracts:", contracts);
              console.log("Filtered Draft contracts:", filtered);

              setFilteredContracts(filtered);
              setFilterData({ ...filterData, contractStatus: "Draft" });
              setCurrentPage(1);

              // Calculate total pages manually
              const newTotalPages = Math.ceil(filtered.length / itemsPerPage);
              setTotalPages(newTotalPages);

              toast.success(`Found ${filtered.length} Draft contracts`);
            } catch (error) {
              console.error("Filter error:", error);
              toast.error("Failed to filter contracts");
            } finally {
              setLoading(false);
            }
          }}
        >
          ● Draft
        </Button>

        <Button
          sx={{
            color: "#9c27b0",
            justifyContent: { xs: "flex-start", sm: "center" },
            width: { xs: "100%", sm: "auto" },
          }}
          onClick={() => {
            try {
              setLoading(true);

              // Filter for Expired contracts
              const filtered = contracts.filter(
                (contract) => contract.contractStatus === "Expired"
              );

              console.log("All contracts:", contracts);
              console.log("Filtered Expired contracts:", filtered);

              setFilteredContracts(filtered);
              setFilterData({ ...filterData, contractStatus: "Expired" });
              setCurrentPage(1);

              // Calculate total pages manually
              const newTotalPages = Math.ceil(filtered.length / itemsPerPage);
              setTotalPages(newTotalPages);

              toast.success(`Found ${filtered.length} Expired contracts`);
            } catch (error) {
              console.error("Filter error:", error);
              toast.error("Failed to filter contracts");
            } finally {
              setLoading(false);
            }
          }}
        >
          ● Expired
        </Button>

        <Button
          sx={{
            color: "gray",
            justifyContent: { xs: "flex-start", sm: "center" },
            width: { xs: "100%", sm: "auto" },
          }}
          onClick={() => {
            try {
              setLoading(true);

              // Show all contracts
              console.log("All contracts:", contracts);

              setFilteredContracts(contracts);
              setFilterData({ ...filterData, contractStatus: "" });
              setCurrentPage(1);

              // Calculate total pages manually
              const newTotalPages = Math.ceil(contracts.length / itemsPerPage);
              setTotalPages(newTotalPages);

              toast.info("Showing all contracts");
            } catch (error) {
              console.error("Filter error:", error);
              toast.error("Failed to reset filter");
            } finally {
              setLoading(false);
            }
          }}
        >
          ● All
        </Button>
      </Box>

      {/* Dashboard */}
      {showDashboard && dashboardStats && (
        <Box
          sx={{
            mb: 4,
            p: { xs: 2, sm: 3 },
            backgroundColor: "#f8fafc",
            borderRadius: 2,
            boxShadow:
              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            overflow: "hidden",
          }}
        >
          {/* Dashboard Stats Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  height: "100%",
                  borderRadius: 2,
                  boxShadow:
                    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  background:
                    "linear-gradient(135deg, #1976d2 0%, #64b5f6 100%)",
                  color: "white",
                  transition: "transform 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow:
                      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                  },
                }}
              >
                <CardContent>
                  <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                    {dashboardStats.totalContracts || contracts.length}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
                    Total Contracts
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <FaFileContract
                      style={{ marginRight: "8px", opacity: 0.8 }}
                    />
                    <Typography variant="caption">All contracts</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  height: "100%",
                  borderRadius: 2,
                  boxShadow:
                    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  background:
                    "linear-gradient(135deg, #4caf50 0%, #81c784 100%)",
                  color: "white",
                  transition: "transform 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow:
                      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                  },
                }}
              >
                <CardContent>
                  <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                    {dashboardStats.byStatus?.active || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
                    Active Contracts
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <FaCheckCircle
                      style={{ marginRight: "8px", opacity: 0.8 }}
                    />
                    <Typography variant="caption">Currently active</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  height: "100%",
                  borderRadius: 2,
                  boxShadow:
                    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  background:
                    "linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)",
                  color: "white",
                  transition: "transform 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow:
                      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                  },
                }}
              >
                <CardContent>
                  <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                    {dashboardStats.expiringContracts?.count || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
                    Expiring Soon
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <FaCalendarAlt
                      style={{ marginRight: "8px", opacity: 0.8 }}
                    />
                    <Typography variant="caption">Next 30 days</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  height: "100%",
                  borderRadius: 2,
                  boxShadow:
                    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  background:
                    "linear-gradient(135deg, #f44336 0%, #e57373 100%)",
                  color: "white",
                  transition: "transform 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow:
                      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                  },
                }}
              >
                <CardContent>
                  <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                    {dashboardStats.byStatus?.expired || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
                    Expired Contracts
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <FaTimesCircle
                      style={{ marginRight: "8px", opacity: 0.8 }}
                    />
                    <Typography variant="caption">Need renewal</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Expiring contracts alert */}
          {dashboardStats.expiringContracts?.count > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 2,
                border: "1px solid",
                borderColor: "warning.light",
                backgroundColor: alpha(theme.palette.warning.light, 0.1),
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 2,
                  color: "warning.dark",
                  gap: 1,
                }}
              >
                <FaExclamationTriangle />
                <Typography variant="h6" fontWeight="bold">
                  Contracts Expiring Soon
                </Typography>
              </Box>

              <Grid container spacing={2}>
                {dashboardStats.expiringContracts.contracts.map(
                  (contract, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card
                        sx={{
                          borderRadius: 2,
                          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                            borderColor: theme.palette.warning.main,
                          },
                          border: "1px solid",
                          borderColor: alpha(theme.palette.warning.main, 0.3),
                        }}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              mb: 1,
                            }}
                          >
                            <Typography
                              variant="subtitle1"
                              fontWeight="bold"
                              noWrap
                              sx={{ maxWidth: "70%" }}
                            >
                              {contract.employee}
                            </Typography>
                            <Chip
                              label={contract.contract}
                              size="small"
                              sx={{
                                backgroundColor: alpha(
                                  theme.palette.primary.main,
                                  0.1
                                ),
                                color: theme.palette.primary.main,
                                fontWeight: 500,
                              }}
                            />
                          </Box>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1 }}
                          >
                            Expires on:{" "}
                            <b>
                              {new Date(contract.endDate).toLocaleDateString()}
                            </b>
                          </Typography>

                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "flex-end",
                              mt: 1,
                            }}
                          >
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning"
                              startIcon={<FaRedo />}
                              onClick={() => {
                                setRenewalData({
                                  id: contract._id,
                                  startDate: new Date(contract.endDate)
                                    .toISOString()
                                    .split("T")[0],
                                  endDate: "",
                                  basicSalary: contract.basicSalary,
                                  renewalReason: "",
                                });
                                setShowRenewModal(true);
                              }}
                              sx={{
                                borderRadius: "8px",
                                textTransform: "none",
                                fontWeight: 500,
                              }}
                            >
                              Renew Contract
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  )
                )}
              </Grid>
            </Paper>
          )}
        </Box>
      )}

      {/* Options bar for bulk actions */}
      {selectedContracts.length > 0 && filteredContracts.length > 0 && (
        <Paper
          elevation={1}
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
            p: { xs: 2, sm: 2 },
            mb: 3,
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.primary.light, 0.08),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          }}
        >
          <Box
            sx={{ display: "flex", alignItems: "center", mb: { xs: 2, sm: 0 } }}
          >
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                color: theme.palette.primary.main,
                display: "flex",
                alignItems: "center",
              }}
            >
              <FaClipboardCheck style={{ marginRight: "8px" }} />
              <strong>{selectedContracts.length}</strong> contracts selected
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
              width: { xs: "100%", sm: "auto" },
            }}
          >
            <FormControl
              size="small"
              sx={{
                minWidth: { xs: "100%", sm: 150 },
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  backgroundColor: "white",
                },
              }}
            >
              <Select
                value={bulkAction}
                onChange={handleBulkActionChange}
                displayEmpty
                inputProps={{ "aria-label": "Bulk Actions" }}
              >
                <MenuItem value="" disabled>
                  <Typography variant="body2" color="text.secondary">
                    Bulk Actions
                  </Typography>
                </MenuItem>
                <MenuItem value="delete">Delete Selected</MenuItem>
                <MenuItem value="export">Export Selected</MenuItem>
                <MenuItem value="status">Update Status</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              onClick={handleApplyBulkAction}
              disabled={!bulkAction}
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: "white",
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
                "&:hover": {
                  backgroundColor: theme.palette.primary.dark,
                },
                "&.Mui-disabled": {
                  backgroundColor: alpha(theme.palette.primary.main, 0.3),
                  color: "white",
                },
              }}
            >
              Apply
            </Button>

            <Button
              variant="outlined"
              onClick={() => {
                setSelectedContracts([]);
                setSelectAll(false);
              }}
              sx={{
                borderColor: alpha(theme.palette.primary.main, 0.5),
                color: theme.palette.primary.main,
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
                "&:hover": {
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  borderColor: theme.palette.primary.main,
                },
              }}
            >
              Clear Selection
            </Button>
          </Box>
        </Paper>
      )}

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: "95%", sm: "600px" },
            maxWidth: "600px",
            borderRadius: "20px",
            overflow: "hidden",
            margin: { xs: "8px", sm: "32px" },
          },
        }}
        TransitionComponent={Fade}
        TransitionProps={{
          timeout: 300,
        }}
        sx={{
          "& .MuiDialog-container": {
            justifyContent: "center",
            alignItems: "center",
            "& .MuiPaper-root": {
              margin: { xs: "16px", sm: "32px" },
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
            },
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
          <FaTrash />
          Confirm Bulk Deletion
        </DialogTitle>

        <DialogContent
          sx={{
            padding: { xs: "24px", sm: "32px" },
            backgroundColor: "#f8fafc",
            paddingTop: { xs: "24px", sm: "32px" },
            maxHeight: "60vh",
            overflow: "auto",
          }}
        >
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body1" fontWeight={600}>
              Are you sure you want to delete {contractsToDelete.length}{" "}
              selected contracts?
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              This action cannot be undone and will permanently remove all
              selected contracts from the system.
            </Typography>
          </Alert>

          <Typography
            variant="h6"
            fontWeight={600}
            sx={{ mb: 2, color: "#2c3e50" }}
          >
            Contracts to be deleted:
          </Typography>

          <Box sx={{ maxHeight: "300px", overflow: "auto" }}>
            <Grid container spacing={2}>
              {contractsToDelete.map((contract, index) => (
                <Grid item xs={12} key={contract._id}>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: "#fff",
                      borderRadius: 2,
                      border: "1px solid #ffcdd2",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        boxShadow: "0 2px 8px rgba(244, 67, 54, 0.1)",
                        borderColor: "#f44336",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 1,
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        fontWeight={600}
                        color="#2c3e50"
                      >
                        #{index + 1}. {contract.contract}
                      </Typography>
                      <Chip
                        label={contract.contractStatus || "Active"}
                        color={
                          contract.contractStatus === "Active"
                            ? "success"
                            : contract.contractStatus === "Expired"
                            ? "error"
                            : contract.contractStatus === "Draft"
                            ? "warning"
                            : "default"
                        }
                        size="small"
                      />
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      <strong>Employee:</strong> {contract.employee}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 1,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        <strong>Start:</strong> {contract.startDate}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>End:</strong> {contract.endDate || "N/A"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Wage:</strong> {contract.wageType}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Salary:</strong> ${contract.basicSalary}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box
            sx={{
              mt: 3,
              p: 2,
              bgcolor: "#ffebee",
              borderRadius: 2,
              border: "1px solid #ffcdd2",
            }}
          >
            <Typography variant="body2" color="#c62828" fontWeight={500}>
              ⚠️ Warning: This will permanently delete{" "}
              {contractsToDelete.length} contracts and all associated data.
            </Typography>
          </Box>
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
            onClick={() => {
              setBulkDeleteDialogOpen(false);
              setContractsToDelete([]);
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
            onClick={handleBulkDelete}
            variant="contained"
            color="error"
            disabled={loading}
            startIcon={
              loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <FaTrash />
              )
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
              "&.Mui-disabled": {
                background: "rgba(244, 67, 54, 0.3)",
                color: "white",
              },
            }}
          >
            {loading
              ? "Deleting..."
              : `Delete ${contractsToDelete.length} Contracts`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Table */}
      <div className="contract-table-container">
        <table className="contract-table">
          <thead>
            <tr>
              <th style={{ backgroundColor: "#1976d2", color: "white" }}>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                />
              </th>
              <th
                onClick={() => handleSort("contract")}
                style={{ backgroundColor: "#1976d2", color: "white" }}
              >
                Contractor Name{" "}
                {sortConfig.key === "contract" ? (
                  sortConfig.direction === "asc" ? (
                    <FaSortUp />
                  ) : (
                    <FaSortDown />
                  )
                ) : null}
              </th>
              <th
                onClick={() => handleSort("employee")}
                style={{ backgroundColor: "#1976d2", color: "white" }}
              >
                Employee{" "}
                {sortConfig.key === "employee" ? (
                  sortConfig.direction === "asc" ? (
                    <FaSortUp />
                  ) : (
                    <FaSortDown />
                  )
                ) : null}
              </th>
              <th
                onClick={() => handleSort("startDate")}
                style={{ backgroundColor: "#1976d2", color: "white" }}
              >
                Start Date{" "}
                {sortConfig.key === "startDate" ? (
                  sortConfig.direction === "asc" ? (
                    <FaSortUp />
                  ) : (
                    <FaSortDown />
                  )
                ) : null}
              </th>
              <th
                onClick={() => handleSort("endDate")}
                style={{ backgroundColor: "#1976d2", color: "white" }}
              >
                End Date{" "}
                {sortConfig.key === "endDate" ? (
                  sortConfig.direction === "asc" ? (
                    <FaSortUp />
                  ) : (
                    <FaSortDown />
                  )
                ) : null}
              </th>
              <th
                onClick={() => handleSort("wageType")}
                style={{ backgroundColor: "#1976d2", color: "white" }}
              >
                Wage Type{" "}
                {sortConfig.key === "wageType" ? (
                  sortConfig.direction === "asc" ? (
                    <FaSortUp />
                  ) : (
                    <FaSortDown />
                  )
                ) : null}
              </th>
              <th
                onClick={() => handleSort("basicSalary")}
                style={{ backgroundColor: "#1976d2", color: "white" }}
              >
                Basic Salary{" "}
                {sortConfig.key === "basicSalary" ? (
                  sortConfig.direction === "asc" ? (
                    <FaSortUp />
                  ) : (
                    <FaSortDown />
                  )
                ) : null}
              </th>
              <th
                onClick={() => handleSort("filingStatus")}
                style={{ backgroundColor: "#1976d2", color: "white" }}
              >
                Filing Status{" "}
                {sortConfig.key === "filingStatus" ? (
                  sortConfig.direction === "asc" ? (
                    <FaSortUp />
                  ) : (
                    <FaSortDown />
                  )
                ) : null}
              </th>
              <th
                onClick={() => handleSort("contractStatus")}
                style={{ backgroundColor: "#1976d2", color: "white" }}
              >
                Contract Status{" "}
                {sortConfig.key === "contractStatus" ? (
                  sortConfig.direction === "asc" ? (
                    <FaSortUp />
                  ) : (
                    <FaSortDown />
                  )
                ) : null}
              </th>
              <th style={{ backgroundColor: "#1976d2", color: "white" }}>
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {getCurrentPageItems().length > 0 ? (
              getCurrentPageItems().map((contract, index) => {

                return (
                  <tr key={contract._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedContracts.includes(contract._id)}
                        onChange={() => handleSelectContract(contract._id)}
                      />
                    </td>
                    <td>{contract.contract}</td>
                    <td>{contract.employee}</td>
                    <td>{contract.startDate}</td>
                    <td>{contract.endDate || "N/A"}</td>
                    <td>{contract.wageType}</td>
                    <td>{contract.basicSalary}</td>
                    <td>{contract.filingStatus || "N/A"}</td>
                    <td>
                      <span
                        className={`status-badge status-badge-${(
                          contract.contractStatus || "active"
                        ).toLowerCase()}`}
                      >
                        {contract.contractStatus || "Active"}
                      </span>
                    </td>
                    <td className="action-buttons-cell">
                      {editingId === contract._id ? (
                        <button
                          className="action-button save-button"
                          onClick={handleSave}
                          title="Save changes"
                        >
                          <FaSave />
                        </button>
                      ) : (
                        <>
                          <button
                            className="action-button view-button"
                            onClick={() => handlePreview(contract)}
                            title="Preview"
                          >
                            <FaEye />
                          </button>
                          <button
                            className="action-button edit-button"
                            onClick={() => handleEdit(contract)} // This calls the main edit function that opens the form
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="action-button delete-button"
                            onClick={() => handleDeleteClick(contract)}
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                          <button
                            className="action-button renew-button"
                            onClick={() => {
                              setRenewalData({
                                id: contract._id,
                                startDate:
                                  contract.endDate ||
                                  new Date().toISOString().split("T")[0],
                                endDate: "",
                                basicSalary: contract.basicSalary,
                                renewalReason: "",
                              });
                              setShowRenewModal(true);
                            }}
                            title="Renew"
                          >
                            <FaRedo />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="10" className="no-data">
                  No contracts found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Preview Contract Modal */}
      {showPreviewModal && previewContract && (
        <Dialog
          open={true}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              width: "90%",
              maxWidth: "900px",
              borderRadius: "12px",
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
              padding: "16px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography
              variant="h6"
              component="div"
              sx={{ display: "flex", alignItems: "center" }}
            >
              <FaFileContract style={{ marginRight: "10px" }} />
              Contract Details
            </Typography>
            <IconButton
              onClick={() => setShowPreviewModal(false)}
              sx={{ color: "white" }}
              size="small"
            >
              <Close />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ padding: "24px" }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper
                  sx={{ p: 2, borderRadius: "8px", backgroundColor: "#f8fafc" }}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    color="primary"
                  >
                    Contract Status
                  </Typography>
                  <Typography variant="body1">
                    {previewContract.contractStatus || "Active"}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, borderRadius: "8px" }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    color="textSecondary"
                  >
                    Contract Type
                  </Typography>
                  <Typography variant="body1">
                    {previewContract.contract}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, borderRadius: "8px" }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    color="textSecondary"
                  >
                    Employee
                  </Typography>
                  <Typography variant="body1">
                    {previewContract.employee}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, borderRadius: "8px" }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    color="textSecondary"
                  >
                    Start Date
                  </Typography>
                  <Typography variant="body1">
                    {previewContract.startDate}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, borderRadius: "8px" }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    color="textSecondary"
                  >
                    End Date
                  </Typography>
                  <Typography variant="body1">
                    {previewContract.endDate || "N/A"}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, borderRadius: "8px" }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    color="textSecondary"
                  >
                    Wage Type
                  </Typography>
                  <Typography variant="body1">
                    {previewContract.wageType}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, borderRadius: "8px" }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    color="textSecondary"
                  >
                    Basic Salary
                  </Typography>
                  <Typography variant="body1">
                    ${previewContract.basicSalary}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, borderRadius: "8px" }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    color="textSecondary"
                  >
                    Filing Status
                  </Typography>
                  <Typography variant="body1">
                    {previewContract.filingStatus || "N/A"}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, borderRadius: "8px" }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    color="textSecondary"
                  >
                    Department
                  </Typography>
                  <Typography variant="body1">
                    {previewContract.department || "N/A"}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, borderRadius: "8px" }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    color="textSecondary"
                  >
                    Position
                  </Typography>
                  <Typography variant="body1">
                    {previewContract.position || "N/A"}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, borderRadius: "8px" }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    color="textSecondary"
                  >
                    Role
                  </Typography>
                  <Typography variant="body1">
                    {previewContract.role || "N/A"}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, borderRadius: "8px" }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    color="textSecondary"
                  >
                    Shift
                  </Typography>
                  <Typography variant="body1">
                    {previewContract.shift || "N/A"}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, borderRadius: "8px" }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    color="textSecondary"
                  >
                    Work Type
                  </Typography>
                  <Typography variant="body1">
                    {previewContract.workType || "N/A"}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, borderRadius: "8px" }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    color="textSecondary"
                  >
                    Notice Period
                  </Typography>
                  <Typography variant="body1">
                    {previewContract.noticePeriod || "N/A"} days
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, borderRadius: "8px" }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    color="textSecondary"
                  >
                    Pay Frequency
                  </Typography>
                  <Typography variant="body1">
                    {previewContract.payFrequency || "N/A"}
                  </Typography>
                </Paper>
              </Grid>

              {/* Contract Document Section */}
              {previewContract.contractDocument && (
                <Grid item xs={12}>
                  <Paper
                    sx={{
                      p: 2,
                      borderRadius: "8px",
                      backgroundColor: "#f0f8ff",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      fontWeight="bold"
                      color="textSecondary"
                      sx={{ mb: 1 }}
                    >
                      Contract Document
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <FaFileContract
                        style={{ color: "#1976d2", fontSize: "20px" }}
                      />
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {previewContract.contractDocument.originalName ||
                            previewContract.contractDocument.filename ||
                            "Contract Document"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {previewContract.contractDocument.size
                            ? `Size: ${(
                                previewContract.contractDocument.size / 1024
                              ).toFixed(2)} KB`
                            : "Document available"}
                        </Typography>
                      </Box>

                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<FaFileExport />}
                        onClick={async () => {
                          try {
                            const contractDoc =
                              previewContract.contractDocument;

                            if (!contractDoc || !contractDoc.filename) {
                              toast.warning(
                                "No document available for download"
                              );
                              return;
                            }

                            console.log("=== FRONTEND DOWNLOAD START ===");
                            console.log("Contract document:", contractDoc);

                            // Show loading toast
                            toast.info("Preparing download...");

                            // Use the payroll contracts download route
                            const downloadUrl = `payroll-contracts/download/${contractDoc.filename}`;

                            console.log("Download URL:", downloadUrl);
                            console.log(
                              "Filename to download:",
                              contractDoc.filename
                            );

                            try {
                              // First, let's check what files are available (debug)
                              const debugResponse = await api.get(
                                "payroll-contracts/debug/files"
                              );
                              console.log(
                                "Available files:",
                                debugResponse.data
                              );

                              // Check if our file is in the list
                              const availableFiles =
                                debugResponse.data.files || [];
                              const fileExists = availableFiles.includes(
                                contractDoc.filename
                              );
                              console.log(
                                "File exists in directory:",
                                fileExists
                              );

                              if (!fileExists) {
                                console.log("Available files:", availableFiles);
                                toast.error(
                                  `File ${contractDoc.filename} not found in uploads directory`
                                );
                                return;
                              }

                              // Now try to download
                              const response = await api.get(downloadUrl, {
                                responseType: "blob",
                                headers: {
                                  Accept: "application/octet-stream",
                                },
                                timeout: 30000,
                              });

                              console.log(
                                "Download response received, size:",
                                response.data.size
                              );

                              // Create blob URL and trigger download
                              const blob = new Blob([response.data]);
                              const url = window.URL.createObjectURL(blob);

                              // Create temporary link and trigger download
                              const link = document.createElement("a");
                              link.href = url;
                              link.download =
                                contractDoc.originalName ||
                                contractDoc.filename;

                              // Add to DOM, click, and remove
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);

                              // Clean up the blob URL
                              window.URL.revokeObjectURL(url);

                              toast.success("Download completed successfully");
                              console.log("=== FRONTEND DOWNLOAD END ===");
                            } catch (downloadError) {
                              console.error(
                                "Download request failed:",
                                downloadError
                              );

                              if (downloadError.response) {
                                console.log(
                                  "Error response:",
                                  downloadError.response.data
                                );
                                console.log(
                                  "Error status:",
                                  downloadError.response.status
                                );
                              }

                              throw downloadError;
                            }
                          } catch (error) {
                            console.error("Download error:", error);

                            if (error.response?.status === 404) {
                              toast.error("Document file not found on server");
                            } else if (error.response?.status === 400) {
                              toast.error("Invalid file request");
                            } else if (error.code === "ECONNABORTED") {
                              toast.error(
                                "Download timeout - file may be too large"
                              );
                            } else {
                              toast.error(
                                `Failed to download document: ${error.message}`
                              );
                            }
                          }
                        }}
                        sx={{
                          borderColor: "#1976d2",
                          color: "#1976d2",
                          "&:hover": {
                            backgroundColor: "#e3f2fd",
                            borderColor: "#1976d2",
                          },
                        }}
                      >
                        View/Download
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              )}

              {previewContract.note && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, borderRadius: "8px" }}>
                    <Typography
                      variant="subtitle2"
                      fontWeight="bold"
                      color="textSecondary"
                    >
                      Notes
                    </Typography>
                    <Typography variant="body1">
                      {previewContract.note}
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
              <Button
                variant="contained"
                onClick={() => setShowPreviewModal(false)}
                sx={{
                  background: "linear-gradient(45deg, #1976d2, #64b5f6)",
                  color: "white",
                  "&:hover": {
                    background: "linear-gradient(45deg, #1565c0, #42a5f5)",
                  },
                  borderRadius: "8px",
                  px: 3,
                  py: 1,
                }}
              >
                Close
              </Button>
            </Box>
          </DialogContent>
        </Dialog>
      )}

      {/* Pagination */}
      {filteredContracts.length > 0 && (
        <div className="pagination-container">
          <div className="pagination">
            <button
              className={`pagination-button ${
                currentPage === 1 ? "disabled" : ""
              }`}
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              First
            </button>
            <button
              className={`pagination-button ${
                currentPage === 1 ? "disabled" : ""
              }`}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>

            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={i}
                  className={`pagination-button ${
                    currentPage === pageNum ? "active" : ""
                  }`}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              className={`pagination-button ${
                currentPage === totalPages ? "disabled" : ""
              }`}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
            <button
              className={`pagination-button ${
                currentPage === totalPages ? "disabled" : ""
              }`}
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              Last
            </button>
          </div>

          <div className="items-per-page-container">
            <span>Items per page:</span>
            <select
              className="items-per-page"
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      )}

      {/* Renew Contract Modal */}
      {showRenewModal && (
        <Dialog
          open={true}
          onClose={() => setShowRenewModal(false)}
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
              background: "linear-gradient(45deg, #ff9800, #ffb74d)",
              fontSize: { xs: "1.25rem", sm: "1.5rem" },
              fontWeight: 600,
              padding: { xs: "16px 24px", sm: "24px 32px" },
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <FaRedo />
            Renew Contract
          </DialogTitle>

          <DialogContent
            sx={{
              padding: { xs: "24px", sm: "32px" },
              backgroundColor: "#f8fafc",
              paddingTop: { xs: "24px", sm: "32px" },
            }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="New Start Date"
                  type="date"
                  value={renewalData.startDate}
                  onChange={(e) =>
                    setRenewalData({
                      ...renewalData,
                      startDate: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "white",
                      borderRadius: "12px",
                      "&:hover fieldset": {
                        borderColor: "#ff9800",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#ff9800",
                      },
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#ff9800",
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="New End Date"
                  type="date"
                  value={renewalData.endDate}
                  onChange={(e) =>
                    setRenewalData({ ...renewalData, endDate: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "white",
                      borderRadius: "12px",
                      "&:hover fieldset": {
                        borderColor: "#ff9800",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#ff9800",
                      },
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#ff9800",
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="New Basic Salary"
                  type="number"
                  value={renewalData.basicSalary}
                  onChange={(e) =>
                    setRenewalData({
                      ...renewalData,
                      basicSalary: e.target.value,
                    })
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoneyIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "white",
                      borderRadius: "12px",
                      "&:hover fieldset": {
                        borderColor: "#ff9800",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#ff9800",
                      },
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#ff9800",
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Renewal Reason"
                  multiline
                  rows={4}
                  value={renewalData.renewalReason}
                  onChange={(e) =>
                    setRenewalData({
                      ...renewalData,
                      renewalReason: e.target.value,
                    })
                  }
                  placeholder="Please provide a reason for contract renewal..."
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "white",
                      borderRadius: "12px",
                      "&:hover fieldset": {
                        borderColor: "#ff9800",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#ff9800",
                      },
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#ff9800",
                    },
                  }}
                />
              </Grid>
            </Grid>
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
              onClick={() => setShowRenewModal(false)}
              sx={{
                border: "2px solid #ff9800",
                color: "#ff9800",
                "&:hover": {
                  border: "2px solid #ffb74d",
                  backgroundColor: "#fff8e1",
                  color: "#ff9800",
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
              onClick={() => {
                // In a real app, you would make an API call to renew the contract
                // For now, we'll just update it locally
                const updatedContracts = contracts.map((contract) => {
                  if (contract._id === renewalData.id) {
                    return {
                      ...contract,
                      startDate: renewalData.startDate,
                      endDate: renewalData.endDate,
                      basicSalary: Number(renewalData.basicSalary),
                      contractStatus: "Active",
                      note: contract.note
                        ? `${contract.note}\nRenewal: ${renewalData.renewalReason}`
                        : `Renewal: ${renewalData.renewalReason}`,
                    };
                  }
                  return contract;
                });

                setContracts(updatedContracts);
                setFilteredContracts(updatedContracts);
                setShowRenewModal(false);
                toast.success("Contract renewed successfully");
              }}
              variant="contained"
              sx={{
                background: "linear-gradient(45deg, #ff9800, #ffb74d)",
                fontSize: "0.95rem",
                textTransform: "none",
                padding: "8px 32px",
                borderRadius: "10px",
                boxShadow: "0 4px 12px rgba(255, 152, 0, 0.2)",
                color: "white",
                "&:hover": {
                  background: "linear-gradient(45deg, #f57c00, #ff9800)",
                },
              }}
            >
              Renew Contract
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Bulk Update Modal */}
      {showBulkUpdateModal && (
        <Dialog
          open={true}
          onClose={() => setShowBulkUpdateModal(false)}
          PaperProps={{
            sx: {
              width: { xs: "95%", sm: "500px" },
              maxWidth: "500px",
              borderRadius: "20px",
              overflow: "hidden",
              margin: { xs: "8px", sm: "32px" },
            },
          }}
          TransitionComponent={Fade}
          TransitionProps={{
            timeout: 300,
          }}
        >
          <DialogTitle
            sx={{
              background: "linear-gradient(45deg, #1976d2, #64b5f6)",
              fontSize: { xs: "1.25rem", sm: "1.5rem" },
              fontWeight: 600,
              padding: { xs: "16px 24px", sm: "24px 32px" },
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <FaEdit />
            Update Multiple Contracts
          </DialogTitle>

          <DialogContent
            sx={{
              padding: { xs: "24px", sm: "32px" },
              backgroundColor: "#f8fafc",
              paddingTop: { xs: "24px", sm: "32px" },
            }}
          >
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                Set Contract Status
              </Typography>
              <FormControl
                fullWidth
                variant="outlined"
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: "12px",
                    "&:hover fieldset": {
                      borderColor: theme.palette.primary.main,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                }}
              >
                <Select
                  value={bulkUpdateData.value || "Active"}
                  onChange={(e) =>
                    setBulkUpdateData({
                      ...bulkUpdateData,
                      value: e.target.value,
                    })
                  }
                  displayEmpty
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Draft">Draft</MenuItem>
                  <MenuItem value="Expired">Expired</MenuItem>
                  <MenuItem value="Terminated">Terminated</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                Reason for Update
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Optional reason for this update"
                value={bulkUpdateData.reason || ""}
                onChange={(e) =>
                  setBulkUpdateData({
                    ...bulkUpdateData,
                    reason: e.target.value,
                  })
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: "12px",
                    "&:hover fieldset": {
                      borderColor: theme.palette.primary.main,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                }}
              />
            </Box>

            <Box sx={{ mt: 3 }}>
              <Alert severity="info" sx={{ borderRadius: "8px" }}>
                This action will update the status of {selectedContracts.length}{" "}
                selected contracts.
              </Alert>
            </Box>
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
              onClick={() => setShowBulkUpdateModal(false)}
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
              onClick={handleBulkUpdate}
              variant="contained"
              disabled={loading}
              startIcon={
                loading ? <CircularProgress size={20} color="inherit" /> : null
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
              {loading
                ? "Updating..."
                : `Update ${selectedContracts.length} Contracts`}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Individual Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: "95%", sm: "500px" },
            maxWidth: "500px",
            borderRadius: "20px",
            overflow: "hidden",
            margin: { xs: "8px", sm: "32px" },
          },
        }}
        TransitionComponent={Fade}
        TransitionProps={{
          timeout: 300,
        }}
        sx={{
          "& .MuiDialog-container": {
            justifyContent: "center",
            alignItems: "center",
            "& .MuiPaper-root": {
              margin: { xs: "16px", sm: "32px" },
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
            },
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
          <FaTrash />
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
            Are you sure you want to delete this contract? This action cannot be
            undone.
          </Alert>

          {contractToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: "#f8fafc", borderRadius: 2 }}>
              <Typography variant="body1" fontWeight={600} color="#2c3e50">
                Contract: {contractToDelete.contract}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Employee: {contractToDelete.employee}
              </Typography>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}
              >
                <Typography variant="body2" color="text.secondary">
                  Start Date: {contractToDelete.startDate}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  End Date: {contractToDelete.endDate || "N/A"}
                </Typography>
              </Box>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}
              >
                <Typography variant="body2" color="text.secondary">
                  Wage Type: {contractToDelete.wageType}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Basic Salary: ${contractToDelete.basicSalary}
                </Typography>
              </Box>
              <Box sx={{ mt: 1 }}>
                <Chip
                  label={contractToDelete.contractStatus || "Active"}
                  color={
                    contractToDelete.contractStatus === "Active"
                      ? "success"
                      : contractToDelete.contractStatus === "Expired"
                      ? "error"
                      : contractToDelete.contractStatus === "Draft"
                      ? "warning"
                      : "default"
                  }
                  size="small"
                  sx={{ mr: 1 }}
                />
              </Box>
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
            onClick={() => setDeleteDialogOpen(false)}
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
    </div>
  );
};

export default Contract;
