import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectUserRole, selectUser } from "../../../redux/authSlice";
import api, {getAssetUrl} from "../../../api/axiosInstance";
import {
  Container,
  Row,
  Col,
  Card,
  ListGroup,
  Form,
  Button,
  Tab,
  Nav,
  Table,
  Modal,
  Alert,
  Badge,
} from "react-bootstrap";
import { toast } from "react-toastify";
import WorkTypeAndShift from "./workTypeAndShift/WorkTypeAndShift";
import Attendance from "./attendance/Attendance";
import Leave from "./leave/Leave";
import Payroll from "./payroll/Payroll";
import AllowanceAndDeduction from "./allowanceAndDeduction/AllowanceAndDeduction";
import PenaltyAccount from "./penaltyAccount/PenaltyAccount";
import Assets from "./assets/Assets";
import Performance from "./performance/Performance";
import Documents from "./documents/Documents";
import BonusPoints from "./bonusPoints/BonusPoints";
import ScheduledInterview from "./scheduledInterview/ScheduledInterview";
import Resignation from "./resignation/Resignation";
import {
  updateContract,
  getContractsByEmployeeId,
  deleteContract,
} from "../../../services/contractServices";
import "./ProfilePage.css";

// Validation functions
const validatePFAccount = (pfNumber) => {
  if (!pfNumber) return { isValid: false, message: "PF Account Number is required" };
  
  // Remove spaces and slashes for length calculation
  const cleanNumber = pfNumber.replace(/[\s/]/g, '');
  
  // Check length constraints
  const hasSlashes = pfNumber.includes('/');
  const hasSpaces = pfNumber.includes(' ');
  
  if (hasSlashes || hasSpaces) {
    if (pfNumber.length > 26) {
      return { isValid: false, message: "PF Account Number with slashes/spaces cannot exceed 26 characters" };
    }
  } else {
    if (pfNumber.length > 22) {
      return { isValid: false, message: "PF Account Number without slashes/spaces cannot exceed 22 characters" };
    }
  }
  
  // Check for invalid characters (only alphanumeric, spaces, forward slashes allowed)
  if (!/^[A-Za-z0-9\s/]+$/.test(pfNumber)) {
    return { isValid: false, message: "PF Account Number can only contain letters, numbers, spaces, and forward slashes" };
  }
  
  // Extract alphabetic and numeric parts
  const alphabetic = pfNumber.replace(/[^A-Za-z]/g, '');
  const numeric = pfNumber.replace(/[^0-9]/g, '');
  
  // Check if first 5 characters are alphabets
  if (alphabetic.length < 5) {
    return { isValid: false, message: "PF Account Number must have at least 5 alphabetic characters" };
  }
  
  // Check if has 17 digits
  if (numeric.length !== 17) {
    return { isValid: false, message: "PF Account Number must have exactly 17 digits" };
  }
  
  // Check pattern: first 5 chars should be letters
  const firstFiveAlphabets = pfNumber.replace(/[^A-Za-z]/g, '').substring(0, 5);
  if (firstFiveAlphabets.length !== 5) {
    return { isValid: false, message: "First 5 characters must be alphabets" };
  }
  
  return { isValid: true, message: "Valid PF Account Number" };
};

const validateUAN = (uanNumber) => {
  if (!uanNumber) return { isValid: false, message: "UAN Number is required" };
  
  // Remove any non-numeric characters for validation
  const numericOnly = uanNumber.replace(/[^0-9]/g, '');
  
  if (numericOnly.length !== 12) {
    return { isValid: false, message: "UAN Number must be exactly 12 digits" };
  }
  
  return { isValid: true, message: "Valid UAN Number" };
};

const validateAccountNumber = (accountNumber) => {
  if (!accountNumber) return { isValid: false, message: "Account Number is required" };
  
  // Account number should be 9-18 digits
  const numericOnly = accountNumber.replace(/[^0-9]/g, '');
  
  if (numericOnly.length < 9 || numericOnly.length > 18) {
    return { isValid: false, message: "Account Number must be between 9-18 digits" };
  }
  
  return { isValid: true, message: "Valid Account Number" };
};

const validateIFSC = (ifscCode) => {
  if (!ifscCode) return { isValid: false, message: "IFSC Code is required" };
  
  // IFSC format: 4 letters + 0 + 6 digits (ABCD0123456)
  const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  
  if (!ifscPattern.test(ifscCode.toUpperCase())) {
    return { isValid: false, message: "IFSC Code format: ABCD0123456 (4 letters + 0 + 6 alphanumeric)" };
  }
  
  return { isValid: true, message: "Valid IFSC Code" };
};

// Auto-fetch bank details from IFSC
const fetchBankDetailsByIFSC = async (ifscCode) => {
  try {
    // Using a free IFSC API
    const response = await fetch(`https://ifsc.razorpay.com/${ifscCode}`);
    
    if (response.ok) {
      const bankData = await response.json();
      return {
        bankName: bankData.BANK || '',
        branchName: bankData.BRANCH || '',
        address: bankData.ADDRESS || '',
        city: bankData.CITY || '',
        state: bankData.STATE || ''
      };
    }
  } catch (error) {
    console.error('Error fetching bank details:', error);
  }
  return null;
};

const ProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Redux selectors for RBAC
  const userRole = useSelector(selectUserRole);
  const currentUser = useSelector(selectUser);

  const [editMode, setEditMode] = useState(false);
  const [tabKey, setTabKey] = useState("about");
  const [subTabKey, setSubTabKey] = useState("workInfo");
  const [loading, setLoading] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({});
  const [bankInfo, setBankInfo] = useState({});
  const [workInfo, setWorkInfo] = useState({});
  const [contracts, setContracts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [employeeId, setEmployeeId] = useState("");
  const [formData, setFormData] = useState({
    contractName: "",
    startDate: "",
    endDate: "",
    wageType: "",
    basicSalary: "",
    filingStatus: "",
    status: "",
  });

  const [editWorkInfoMode, setEditWorkInfoMode] = useState(false);
  
  // Validation states
  const [validationErrors, setValidationErrors] = useState({
    work: {},
    bank: {}
  });
  
  // State for user role from backend
  const [backendUserRole, setBackendUserRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);
  
  // State for employee-specific role access
  const [employeeRole, setEmployeeRole] = useState(null);
  const [employeeRoleLoading, setEmployeeRoleLoading] = useState(true);

  // RBAC helper functions - prioritize backend role over local storage
  const canEditProfile = () => {
    const role = backendUserRole || userRole || localStorage.getItem("userRole");
    return ["admin", "hr"].includes(role);
  };

  const canViewOnly = () => {
    const role = backendUserRole || userRole || localStorage.getItem("userRole");
    return ["manager", "employee"].includes(role);
  };

  const getUserRole = () => {
    return backendUserRole || userRole || localStorage.getItem("userRole") || "employee";
  };

  const showPermissionError = () => {
    toast.error(
      "You don't have permission to edit profile information. Contact HR or Admin for changes."
    );
  };

  // Fetch user role from backend
  const fetchUserRole = async () => {
    try {
      setRoleLoading(true);
      const userEmail = currentUser?.email || localStorage.getItem('userEmail');
      
      if (!userEmail) {
        console.log('No user email found, using fallback role');
        setRoleLoading(false);
        return;
      }
      
      console.log('Fetching user role for email:', userEmail);
      const response = await api.get(`auth/user-role/${encodeURIComponent(userEmail)}`);
      
      if (response.data.success) {
        const userData = response.data.data;
        setBackendUserRole(userData.role);
        console.log('Fetched user role from backend:', userData.role);
        
        // Update localStorage as backup
        localStorage.setItem('userRole', userData.role);
        
        // Also store permissions if needed
        if (userData.permissions) {
          localStorage.setItem('userPermissions', JSON.stringify(userData.permissions));
        }
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      // Fallback to local storage role
      const fallbackRole = userRole || localStorage.getItem("userRole") || "employee";
      setBackendUserRole(fallbackRole);
      console.log('Using fallback role:', fallbackRole);
    } finally {
      setRoleLoading(false);
    }
  };

  // Fetch employee-specific role access by employee ID
  const fetchEmployeeRole = async (empId) => {
    try {
      setEmployeeRoleLoading(true);
      console.log('🔍 Fetching role for employee ID:', empId);
      
      // Get employee profile to extract workemail and userId
      const employeeResponse = await api.get(`employees/profile/${empId}`);
      console.log('📄 Employee profile response:', employeeResponse.data);
      
      if (employeeResponse.data.success && employeeResponse.data.data) {
        const employeeData = employeeResponse.data.data;
        const workEmail = employeeData.personalInfo?.workemail;
        const userId = employeeData.userId;
        
        console.log('📧 Employee work email:', workEmail);
        console.log('👤 Employee userId:', userId);
        
        // Debug: Verify workemail with User.email field matching
        console.log('🔧 Debugging workemail to User.email matching...');
        
        if (workEmail) {
          // Match Employee.workemail with User.email field
          try {
            const roleResponse = await api.get(`auth/user-role/${encodeURIComponent(workEmail)}`);
            
            if (roleResponse.data.success && roleResponse.data.data) {
              setEmployeeRole(roleResponse.data.data);
              console.log('✅ Role found by workemail match:', roleResponse.data.data.role);
              console.log('🔗 Employee workemail:', workEmail, '-> User email:', roleResponse.data.data.email);
            } else {
              console.log('❌ No User found with email matching workemail:', workEmail);
              setEmployeeRole(null);
            }
          } catch (error) {
            console.log('❌ Error matching workemail to User.email:', error.response?.data || error.message);
            
            // Fallback: Try userId if workemail match failed
            if (userId) {
              try {
                console.log('🔄 Fallback: Trying userId match...');
                const userRoleResponse = await api.get(`auth/user-role-by-id/${userId}`);
                
                if (userRoleResponse.data.success && userRoleResponse.data.data) {
                  setEmployeeRole(userRoleResponse.data.data);
                  console.log('✅ Role found by userId match:', userRoleResponse.data.data.role);
                } else {
                  console.log('❌ No User found with matching userId:', userId);
                  setEmployeeRole(null);
                }
              } catch (userIdError) {
                console.log('❌ Error matching userId:', userIdError.response?.data || userIdError.message);
                setEmployeeRole(null);
              }
            } else {
              setEmployeeRole(null);
            }
          }
        } else {
          console.log('❌ No workemail found in employee profile');
          setEmployeeRole(null);
        }
      } else {
        console.log('❌ Failed to get employee profile');
        console.log('Employee response:', employeeResponse.data);
        setEmployeeRole(null);
      }
    } catch (error) {
      console.error('💥 Error fetching employee role:', error);
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
      }
      setEmployeeRole(null);
    } finally {
      setEmployeeRoleLoading(false);
    }
  };

  // Get user initials for fallback
  const getUserInitials = () => {
    if (personalInfo?.firstName || personalInfo?.lastName) {
      const firstInitial = personalInfo.firstName ? personalInfo.firstName.charAt(0).toUpperCase() : "";
      const lastInitial = personalInfo.lastName ? personalInfo.lastName.charAt(0).toUpperCase() : "";
      return firstInitial + lastInitial;
    }
    return employeeId ? employeeId.charAt(0).toUpperCase() : "U";
  };

  // Enhanced update functions with real-time sync
  const updatePersonalInfo = async () => {
    if (!canEditProfile()) {
      showPermissionError();
      setEditMode(false);
      return;
    }
  
    try {
      setLoading(true);
      
      console.log("Updating personal info for employee ID:", employeeId);
      console.log("Current personalInfo state:", personalInfo);
      console.log("Available personal info keys:", Object.keys(personalInfo));
      console.log("PersonalInfo values:", Object.values(personalInfo));
      console.log("PersonalInfo.name value:", personalInfo.name);
      console.log("PersonalInfo.email value:", personalInfo.email);
      console.log("PersonalInfo.phone value:", personalInfo.phone);
      
      // Prepare clean personal info data - map form fields to backend fields
      const nameParts = personalInfo.name ? personalInfo.name.trim().split(' ') : [];
      const derivedFirstName = nameParts[0] || "";
      const derivedLastName = nameParts.slice(1).join(' ') || "";
      
      const updateData = {
        personalInfo: {
          // Handle name field - split into firstName and lastName, ensure non-empty
          firstName: personalInfo.firstName || derivedFirstName || "Unknown",
          lastName: personalInfo.lastName || derivedLastName || "User",
          // Map other form fields to backend fields
          prefix: personalInfo.prefix,
          dob: personalInfo.dob,
          gender: personalInfo.gender,
          maritalStatus: personalInfo.maritalStatus,
          bloodGroup: personalInfo.bloodGroup,
          nationality: personalInfo.nationality,
          aadharNumber: personalInfo.aadharNumber,
          panNumber: personalInfo.panNumber,
          mobileNumber: personalInfo.phone || personalInfo.mobileNumber,  // Form uses "phone"
          email: personalInfo.email,
          workemail: personalInfo.workemail
        }
      };
      
      console.log("Raw updateData before cleaning:", updateData);
      
      // Only include other sections if they exist and are properly structured
      if (personalInfo.addressDetails && 
          typeof personalInfo.addressDetails === 'object' &&
          (personalInfo.addressDetails.presentAddress || personalInfo.addressDetails.permanentAddress)) {
        updateData.addressDetails = personalInfo.addressDetails;
      }
      
      if (personalInfo.joiningDetails && 
          typeof personalInfo.joiningDetails === 'object' &&
          Object.keys(personalInfo.joiningDetails).length > 0) {
        updateData.joiningDetails = personalInfo.joiningDetails;
      }
      
      // Only include educationDetails if it has valid structure
      if (personalInfo.educationDetails && 
          typeof personalInfo.educationDetails === 'object') {
        const validEducationDetails = {
          basic: [],
          professional: []
        };
        
        // Validate basic education entries
        if (Array.isArray(personalInfo.educationDetails.basic)) {
          validEducationDetails.basic = personalInfo.educationDetails.basic.filter(item => 
            item && 
            item.education && 
            ['10th', '12th'].includes(item.education)
          );
        }
        
        // Validate professional education entries
        if (Array.isArray(personalInfo.educationDetails.professional)) {
          validEducationDetails.professional = personalInfo.educationDetails.professional.filter(item => 
            item && 
            item.education && 
            ['UG', 'PG', 'Doctorate'].includes(item.education)
          );
        }
        
        // Only include if there are valid entries
        if (validEducationDetails.basic.length > 0 || validEducationDetails.professional.length > 0) {
          updateData.educationDetails = validEducationDetails;
        }
      }
      
      // Include trainingStatus if valid
      if (personalInfo.trainingStatus && ['yes', 'no'].includes(personalInfo.trainingStatus)) {
        updateData.trainingStatus = personalInfo.trainingStatus;
      }
      
      // Only include trainingDetails if valid
      if (personalInfo.trainingDetails && 
          typeof personalInfo.trainingDetails === 'object' &&
          Array.isArray(personalInfo.trainingDetails.trainingInIndia)) {
        const validTrainingDetails = {
          trainingInIndia: personalInfo.trainingDetails.trainingInIndia.filter(item =>
            item && 
            item.type && 
            item.topic && 
            item.institute
          )
        };
        
        if (validTrainingDetails.trainingInIndia.length > 0) {
          updateData.trainingDetails = validTrainingDetails;
        }
      }
      
      // Include arrays only if they exist and are valid
      if (Array.isArray(personalInfo.familyDetails) && personalInfo.familyDetails.length > 0) {
        updateData.familyDetails = personalInfo.familyDetails.filter(item => 
          item && item.name && item.relation
        );
      }
      
      if (Array.isArray(personalInfo.serviceHistory) && personalInfo.serviceHistory.length > 0) {
        updateData.serviceHistory = personalInfo.serviceHistory;
      }
      
      if (Array.isArray(personalInfo.nominationDetails) && personalInfo.nominationDetails.length > 0) {
        updateData.nominationDetails = personalInfo.nominationDetails;
      }
  
      console.log("Sending personal info update data:", updateData);
      console.log("PersonalInfo object being sent:", updateData.personalInfo);
  
      // Validate that we have at least some personal info to update
      if (!updateData.personalInfo || Object.keys(updateData.personalInfo).length === 0) {
        toast.warning("No personal information changes to save");
        setEditMode(false);
        return;
      }
      
      // Ensure we always have at least firstName and lastName for the update
      const cleanedPersonalInfo = {};
      
      // Always include firstName and lastName (required fields)
      cleanedPersonalInfo.firstName = updateData.personalInfo.firstName;
      cleanedPersonalInfo.lastName = updateData.personalInfo.lastName;
      
      // Add other fields only if they have meaningful values
      Object.keys(updateData.personalInfo).forEach(key => {
        if (key === 'firstName' || key === 'lastName') return; // Already handled above
        
        const value = updateData.personalInfo[key];
        console.log(`Frontend field ${key}: "${value}" (type: ${typeof value})`);
        
        // Include field if it has a meaningful value (not null, undefined, or empty string)
        if (value !== null && value !== undefined && value !== "") {
          cleanedPersonalInfo[key] = value;
          console.log(`Frontend added field ${key} to cleaned data`);
        } else {
          console.log(`Frontend filtered out field ${key} (empty/null/undefined)`);
        }
      });
      
      console.log("Cleaned personal info being sent:", cleanedPersonalInfo);
      console.log("Number of fields in cleaned data:", Object.keys(cleanedPersonalInfo).length);
      
      // Check if we have any data to send
      if (Object.keys(cleanedPersonalInfo).length === 0) {
        toast.warning("No valid personal information to update. Please fill in at least one field.");
        setLoading(false);
        return;
      }
      
      // Validate required fields before sending
      const requiredFields = ['firstName', 'lastName'];
      const missingFields = requiredFields.filter(field => !cleanedPersonalInfo[field]);
      
      if (missingFields.length > 0) {
        toast.error(`Missing required fields: ${missingFields.join(', ')}`);
        setLoading(false);
        return;
      }
      
      // Validate date format if present
      if (cleanedPersonalInfo.dob) {
        const dobDate = new Date(cleanedPersonalInfo.dob);
        if (isNaN(dobDate.getTime())) {
          toast.error("Invalid date of birth format");
          setLoading(false);
          return;
        }
      }
  
      // Use the correct personal-info update endpoint with clean data
      const response = await api.put(
        `employees/personal-info/${employeeId}`,
        cleanedPersonalInfo,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
  
      if (response.status === 200) {
        toast.success("Personal information updated successfully");
        
        // Refresh the complete profile data to ensure consistency
        if (id) {
          await fetchProfileData();
        } else {
          const userId = currentUser?.id || localStorage.getItem("userId");
          if (userId) {
            await fetchProfileByUserId(userId);
          }
        }
        
        setEditMode(false);
  
        // Broadcast update to other users
        broadcastProfileUpdate("personalInfo", response.data.data);
      } else {
        toast.error("Failed to update personal information");
      }
    } catch (error) {
      console.error("Error updating personal info:", error);
      
      if (error.response) {
        console.error("Server error details:", error.response.data);
        console.error("Full error response:", error.response);
        
        if (error.response.status === 400) {
          // Handle validation errors with detailed logging
          if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
            console.error("Validation errors array:", error.response.data.errors);
            const errorMessages = error.response.data.errors.map(err => {
              console.log("Processing error:", err);
              return typeof err === 'string' ? err : err.message || err.msg || JSON.stringify(err);
            }).join(', ');
            toast.error(`Validation failed: ${errorMessages}`);
          } else {
            console.error("Non-array validation error:", error.response.data);
            toast.error(`Validation failed: ${error.response.data.message || 'Invalid data format'}`);
          }
        } else if (error.response.status === 404) {
          toast.error("Employee not found. Please refresh the page and try again.");
        } else if (error.response.status === 401) {
          toast.error("You don't have permission to update this information.");
        } else {
          toast.error(
            "Error updating personal information: " +
              (error.response?.data?.message || "Unknown server error")
          );
        }
      } else if (error.request) {
        toast.error("Network error. Please check your connection and try again.");
      } else {
        toast.error("Error updating personal information: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };
  
  
  // Add this function to handle work info updates with RBAC

const updateBankInfo = async () => {
  if (!canEditProfile()) {
    showPermissionError();
    return;
  }

  try {
    setLoading(true);
    const response = await api.put(
      `employees/bank-info/${employeeId}`, // Make sure 'id' is the employee ID
      { bankInfo }, // Send bankInfo in the correct format
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 200) {
      toast.success("Bank information updated successfully");
      setBankInfo(response.data.data.bankInfo);

      // Broadcast update to other users
      broadcastProfileUpdate("bankInfo", response.data.data.bankInfo);
    } else {
      toast.error("Failed to update bank information");
    }
  } catch (error) {
    console.error("Error updating bank info:", error);
    toast.error(
      "Error updating bank information: " +
        (error.response?.data?.message || error.message)
    );
  } finally {
    setLoading(false);
  }
};

const updateWorkInfo = async () => {
  console.log("Updating work info for employee ID:", employeeId); // Use employeeId instead of id

  if (!canEditProfile()) {
    showPermissionError();
    setEditWorkInfoMode(false);
    return;
  }

  try {
    setLoading(true);
    if (editWorkInfoMode) {
      // Complete work info data with ALL joining details fields
      const workInfoData = {
        // Basic work info fields (from your existing code)
        shiftType: workInfo.shiftType,
        workType: workInfo.workType,
        uanNumber: workInfo.uanNumber,
        pfNumber: workInfo.pfNumber,
        department: workInfo.department,
        designation: workInfo.designation,
        employeeType: workInfo.employeeType,
        dateOfJoining: workInfo.dateOfJoining,
        dateOfAppointment: workInfo.dateOfAppointment,
        modeOfRecruitment: workInfo.modeOfRecruitment,
        
        // Additional fields that might be missing
        initialDesignation: workInfo.designation || workInfo.initialDesignation,
      };

      // Remove undefined values to avoid sending null data
      Object.keys(workInfoData).forEach(key => {
        if (workInfoData[key] === undefined || workInfoData[key] === null) {
          delete workInfoData[key];
        }
      });

      console.log("Sending work info data:", workInfoData);

      const response = await api.put(
        `employees/work-info/${employeeId}`, // Fixed: removed extra }
        workInfoData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        toast.success("Work information updated successfully");
        
        // Update workInfo state with response data
        setWorkInfo(prevWorkInfo => ({
          ...prevWorkInfo,
          ...response.data.data
        }));
        
        setEditWorkInfoMode(false);

        // Update the personalInfo state to reflect changes in joining details
        setPersonalInfo((prev) => ({
          ...prev,
          // Update display fields
          department: workInfoData.department || prev.department,
          designation: workInfoData.designation || prev.designation,
          // Update nested joiningDetails object
          joiningDetails: {
            ...prev.joiningDetails,
            ...workInfoData,
            initialDesignation: workInfoData.designation || workInfoData.initialDesignation,
          },
        }));

        // Broadcast update to other users
        broadcastProfileUpdate("workInfo", response.data.data);
        
        // Optional: Refresh complete profile data to ensure consistency
        // Uncomment if you want to fetch fresh data after update
        // setTimeout(() => {
        //   fetchProfileData();
        // }, 500);
        
      } else {
        toast.error("Failed to update work information");
      }
    }
  } catch (error) {
    console.error("Error updating work info:", error);

    if (error.response) {
      console.error("Server error details:", error.response.data);
      console.error("Status code:", error.response.status);
      
      // More specific error handling
      if (error.response.status === 404) {
        toast.error("Employee not found. Please refresh the page and try again.");
      } else if (error.response.status === 401) {
        toast.error("You don't have permission to update this information.");
      } else {
        toast.error(
          "Error updating work information: " +
            (error.response?.data?.message || "Unknown server error")
        );
      }
    } else if (error.request) {
      toast.error("Network error. Please check your connection and try again.");
    } else {
      toast.error("Error updating work information: " + error.message);
    }
  } finally {
    setLoading(false);
  }
};


  // Real-time update broadcasting function
  const broadcastProfileUpdate = (updateType, data) => {
    // Create a custom event for profile updates
    const updateEvent = new CustomEvent("profileUpdate", {
      detail: {
        employeeId: id,
        updateType,
        data,
        timestamp: new Date().toISOString(),
      },
    });

    // Dispatch the event
    window.dispatchEvent(updateEvent);

    // Also store in localStorage for cross-tab communication
    localStorage.setItem(
      "lastProfileUpdate",
      JSON.stringify({
        employeeId: id,
        updateType,
        data,
        timestamp: new Date().toISOString(),
      })
    );
  };

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = (event) => {
      const { employeeId: updatedEmployeeId, updateType, data } = event.detail;

      // Only update if it's the same employee being viewed
      if (updatedEmployeeId === id) {
        switch (updateType) {
          case "personalInfo":
            setPersonalInfo((prev) => ({ ...prev, ...data }));
            toast.info("Profile information has been updated by another user");
            break;
          case "bankInfo":
            setBankInfo(data);
            toast.info("Bank information has been updated by another user");
            break;
          case "workInfo":
            setWorkInfo(data);
            toast.info("Work information has been updated by another user");
            break;
          default:
            break;
        }
      }
    };

    // Listen for storage changes (cross-tab communication)
    const handleStorageChange = (event) => {
      if (event.key === "lastProfileUpdate") {
        const updateData = JSON.parse(event.newValue);
        if (updateData && updateData.employeeId === id) {
          handleProfileUpdate({ detail: updateData });
        }
      }
    };

    window.addEventListener("profileUpdate", handleProfileUpdate);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("profileUpdate", handleProfileUpdate);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [id]);

  const fetchProfileData = useCallback(async () => {
    if (!id) return;
  
    setLoading(true);
    try {
      const response = await api.get(`employees/get-employee/${id}`);
  
      if (response.data.success) {
        const employeeData = response.data.data;
  
        setEmployeeId(employeeData.Emp_ID);
  
        // Set personal info with ALL fields from the schema
        setPersonalInfo({
          // Basic identifiers
          employeeId: employeeData.Emp_ID,
          userId: employeeData.userId,
          
          // Personal Info fields from schema
          prefix: employeeData.personalInfo?.prefix || "",
          firstName: employeeData.personalInfo?.firstName || "",
          lastName: employeeData.personalInfo?.lastName || "",
          dob: employeeData.personalInfo?.dob || "",
          gender: employeeData.personalInfo?.gender || "",
          maritalStatus: employeeData.personalInfo?.maritalStatus || "",
          bloodGroup: employeeData.personalInfo?.bloodGroup || "",
          nationality: employeeData.personalInfo?.nationality || "",
          aadharNumber: employeeData.personalInfo?.aadharNumber || "",
          panNumber: employeeData.personalInfo?.panNumber || "",
          mobileNumber: employeeData.personalInfo?.mobileNumber || "",
          email: employeeData.personalInfo?.email || "",
          workemail: employeeData.personalInfo?.workemail || "",
          employeeImage: employeeData.personalInfo?.employeeImage || "",
          
          // Computed fields for display
          name: `${employeeData.personalInfo?.firstName || ""} ${employeeData.personalInfo?.lastName || ""}`,
          phone: employeeData.personalInfo?.mobileNumber || "",
          department: employeeData.joiningDetails?.department || "",
          designation: employeeData.joiningDetails?.initialDesignation || "",
          
          // Address Details (complete structure)
          addressDetails: {
            presentAddress: {
              address: employeeData.addressDetails?.presentAddress?.address || "",
              city: employeeData.addressDetails?.presentAddress?.city || "",
              district: employeeData.addressDetails?.presentAddress?.district || "",
              state: employeeData.addressDetails?.presentAddress?.state || "",
              pinCode: employeeData.addressDetails?.presentAddress?.pinCode || "",
              country: employeeData.addressDetails?.presentAddress?.country || ""
            },
            permanentAddress: {
              address: employeeData.addressDetails?.permanentAddress?.address || "",
              city: employeeData.addressDetails?.permanentAddress?.city || "",
              district: employeeData.addressDetails?.permanentAddress?.district || "",
              state: employeeData.addressDetails?.permanentAddress?.state || "",
              pinCode: employeeData.addressDetails?.permanentAddress?.pinCode || "",
              country: employeeData.addressDetails?.permanentAddress?.country || ""
            }
          },
          
          // Joining Details (complete structure)
          joiningDetails: {
            dateOfAppointment: employeeData.joiningDetails?.dateOfAppointment || "",
            dateOfJoining: employeeData.joiningDetails?.dateOfJoining || "",
            department: employeeData.joiningDetails?.department || "",
            initialDesignation: employeeData.joiningDetails?.initialDesignation || "",
            modeOfRecruitment: employeeData.joiningDetails?.modeOfRecruitment || "",
            employeeType: employeeData.joiningDetails?.employeeType || "",
            shiftType: employeeData.joiningDetails?.shiftType || "",
            workType: employeeData.joiningDetails?.workType || "",
            uanNumber: employeeData.joiningDetails?.uanNumber || "",
            pfNumber: employeeData.joiningDetails?.pfNumber || ""
          },
          
          // Education Details (complete structure)
          educationDetails: {
            basic: employeeData.educationDetails?.basic || [],
            professional: employeeData.educationDetails?.professional || []
          },
          
          // Training Details (complete structure)
          trainingStatus: employeeData.trainingStatus || "no",
          trainingDetails: {
            trainingInIndia: employeeData.trainingDetails?.trainingInIndia || []
          },
          
          // Family Details (array)
          familyDetails: employeeData.familyDetails || [],
          
          // Service History (array)
          serviceHistory: employeeData.serviceHistory || [],
          
          // Nomination Details (array)
          nominationDetails: employeeData.nominationDetails || [],
          
          // Registration status
          registrationComplete: employeeData.registrationComplete || false
        });
  
        // Set bank info with ALL fields from schema
        setBankInfo({
          accountNumber: employeeData.bankInfo?.accountNumber || "",
          ifscCode: employeeData.bankInfo?.ifscCode || "",
          bankName: employeeData.bankInfo?.bankName || "",
          branchName: employeeData.bankInfo?.branchName || "",
          accountType: employeeData.bankInfo?.accountType || ""
        });
  
        // Set work info with ALL joining details fields
        setWorkInfo({
          dateOfAppointment: employeeData.joiningDetails?.dateOfAppointment || "",
          dateOfJoining: employeeData.joiningDetails?.dateOfJoining || "",
          department: employeeData.joiningDetails?.department || "",
          designation: employeeData.joiningDetails?.initialDesignation || "",
          initialDesignation: employeeData.joiningDetails?.initialDesignation || "",
          modeOfRecruitment: employeeData.joiningDetails?.modeOfRecruitment || "",
          employeeType: employeeData.joiningDetails?.employeeType || "",
          shiftType: employeeData.joiningDetails?.shiftType || "",
          workType: employeeData.joiningDetails?.workType || "",
          uanNumber: employeeData.joiningDetails?.uanNumber || "",
          pfNumber: employeeData.joiningDetails?.pfNumber || ""
        });
  
        // Set profile image
        const imageUrl = employeeData.personalInfo?.employeeImage
          ? getAssetUrl(employeeData.personalInfo.employeeImage)
          : null;
        setProfileImage(imageUrl);
  
        console.log("Fetched complete employee data:", employeeData);
      } else {
        console.error("Failed to fetch employee data");
        toast.error("Failed to fetch employee data");
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
      toast.error("Error fetching profile data: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  }, [id]);
  
  const fetchProfileByUserId = async (userId) => {
    setLoading(true);
    try {
      const response = await api.get(`employees/by-user/${userId}`);
  
      if (response.data.success) {
        const employeeData = response.data.data;
  
        setEmployeeId(employeeData.Emp_ID);
  
        // Set personal info with ALL fields from the schema
        setPersonalInfo({
          // Basic identifiers
          employeeId: employeeData.Emp_ID,
          userId: employeeData.userId,
          
          // Personal Info fields from schema
          prefix: employeeData.personalInfo?.prefix || "",
          firstName: employeeData.personalInfo?.firstName || "",
          lastName: employeeData.personalInfo?.lastName || "",
          dob: employeeData.personalInfo?.dob || "",
          gender: employeeData.personalInfo?.gender || "",
          maritalStatus: employeeData.personalInfo?.maritalStatus || "",
          bloodGroup: employeeData.personalInfo?.bloodGroup || "",
          nationality: employeeData.personalInfo?.nationality || "",
          aadharNumber: employeeData.personalInfo?.aadharNumber || "",
          panNumber: employeeData.personalInfo?.panNumber || "",
          mobileNumber: employeeData.personalInfo?.mobileNumber || "",
          email: employeeData.personalInfo?.email || "",
          workemail: employeeData.personalInfo?.workemail || "",
          employeeImage: employeeData.personalInfo?.employeeImage || "",
          
          // Computed fields for display
          name: `${employeeData.personalInfo?.firstName || ""} ${employeeData.personalInfo?.lastName || ""}`,
          phone: employeeData.personalInfo?.mobileNumber || "",
          department: employeeData.joiningDetails?.department || "",
          designation: employeeData.joiningDetails?.initialDesignation || "",
          
          // Address Details (complete structure)
          addressDetails: {
            presentAddress: {
              address: employeeData.addressDetails?.presentAddress?.address || "",
              city: employeeData.addressDetails?.presentAddress?.city || "",
              district: employeeData.addressDetails?.presentAddress?.district || "",
              state: employeeData.addressDetails?.presentAddress?.state || "",
              pinCode: employeeData.addressDetails?.presentAddress?.pinCode || "",
              country: employeeData.addressDetails?.presentAddress?.country || ""
            },
            permanentAddress: {
              address: employeeData.addressDetails?.permanentAddress?.address || "",
              city: employeeData.addressDetails?.permanentAddress?.city || "",
              district: employeeData.addressDetails?.permanentAddress?.district || "",
              state: employeeData.addressDetails?.permanentAddress?.state || "",
              pinCode: employeeData.addressDetails?.permanentAddress?.pinCode || "",
              country: employeeData.addressDetails?.permanentAddress?.country || ""
            }
          },
          
          // Joining Details (complete structure)
          joiningDetails: {
            dateOfAppointment: employeeData.joiningDetails?.dateOfAppointment || "",
            dateOfJoining: employeeData.joiningDetails?.dateOfJoining || "",
            department: employeeData.joiningDetails?.department || "",
            initialDesignation: employeeData.joiningDetails?.initialDesignation || "",
            modeOfRecruitment: employeeData.joiningDetails?.modeOfRecruitment || "",
            employeeType: employeeData.joiningDetails?.employeeType || "",
            shiftType: employeeData.joiningDetails?.shiftType || "",
            workType: employeeData.joiningDetails?.workType || "",
            uanNumber: employeeData.joiningDetails?.uanNumber || "",
            pfNumber: employeeData.joiningDetails?.pfNumber || ""
          },
          
          // Education Details (complete structure)
          educationDetails: {
            basic: employeeData.educationDetails?.basic || [],
            professional: employeeData.educationDetails?.professional || []
          },
          
          // Training Details (complete structure)
          trainingStatus: employeeData.trainingStatus || "no",
          trainingDetails: {
            trainingInIndia: employeeData.trainingDetails?.trainingInIndia || []
          },
          
          // Family Details (array)
          familyDetails: employeeData.familyDetails || [],
          
          // Service History (array)
          serviceHistory: employeeData.serviceHistory || [],
          
          // Nomination Details (array)
          nominationDetails: employeeData.nominationDetails || [],
          
          // Registration status
          registrationComplete: employeeData.registrationComplete || false
        });
  
        // Set bank info with ALL fields from schema
        setBankInfo({
          accountNumber: employeeData.bankInfo?.accountNumber || "",
          ifscCode: employeeData.bankInfo?.ifscCode || "",
          bankName: employeeData.bankInfo?.bankName || "",
          branchName: employeeData.bankInfo?.branchName || "",
          accountType: employeeData.bankInfo?.accountType || ""
        });
  
        // Set work info with ALL joining details fields
        setWorkInfo({
          dateOfAppointment: employeeData.joiningDetails?.dateOfAppointment || "",
          dateOfJoining: employeeData.joiningDetails?.dateOfJoining || "",
          department: employeeData.joiningDetails?.department || "",
          designation: employeeData.joiningDetails?.initialDesignation || "",
          initialDesignation: employeeData.joiningDetails?.initialDesignation || "",
          modeOfRecruitment: employeeData.joiningDetails?.modeOfRecruitment || "",
          employeeType: employeeData.joiningDetails?.employeeType || "",
          shiftType: employeeData.joiningDetails?.shiftType || "",
          workType: employeeData.joiningDetails?.workType || "",
          uanNumber: employeeData.joiningDetails?.uanNumber || "",
          pfNumber: employeeData.joiningDetails?.pfNumber || ""
        });
  
        // Set profile image
        const imageUrl = employeeData.personalInfo?.employeeImage
          ? getAssetUrl(employeeData.personalInfo.employeeImage)
          : null;
        setProfileImage(imageUrl);
  
        console.log("Fetched complete employee data by userId:", employeeData);
      } else {
        console.error("Failed to fetch employee data by userId");
        toast.error("Failed to fetch employee data");
      }
    } catch (error) {
      console.error("Error fetching profile data by userId:", error);
      toast.error("Error fetching profile data: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch user role first, then profile data
    const loadData = async () => {
      // Fetch user role from backend
      await fetchUserRole();
      
      // Then fetch profile data
      if (id) {
        fetchProfileData();
      } else {
        // If no ID is provided, fetch the current user's profile
        const userId = currentUser?.id || localStorage.getItem("userId");
        if (userId) {
          fetchProfileByUserId(userId);
        }
      }
    };
    
    loadData();
  }, [id, fetchProfileData, currentUser]);

  // Fetch employee role when employeeId changes
  useEffect(() => {
    if (employeeId) {
      fetchEmployeeRole(employeeId);
    }
  }, [employeeId]);

  const handleInputChange = async (e, section) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // Input validation and formatting
    if (section === "work") {
      if (name === "uanNumber") {
        // UAN: Only allow 12 digits
        processedValue = value.replace(/[^0-9]/g, '').slice(0, 12);
        const validation = validateUAN(processedValue);
        setValidationErrors(prev => ({
          ...prev,
          work: { ...prev.work, uanNumber: validation.isValid ? null : validation.message }
        }));
      } else if (name === "pfNumber") {
        // PF: Allow alphanumeric, spaces, forward slashes
        processedValue = value.replace(/[^A-Za-z0-9\s/]/g, '');
        const validation = validatePFAccount(processedValue);
        setValidationErrors(prev => ({
          ...prev,
          work: { ...prev.work, pfNumber: validation.isValid ? null : validation.message }
        }));
      }
      setWorkInfo((prev) => ({ ...prev, [name]: processedValue }));
    } else if (section === "bank") {
      if (name === "accountNumber") {
        // Account number: Only digits
        processedValue = value.replace(/[^0-9]/g, '');
        const validation = validateAccountNumber(processedValue);
        setValidationErrors(prev => ({
          ...prev,
          bank: { ...prev.bank, accountNumber: validation.isValid ? null : validation.message }
        }));
      } else if (name === "ifscCode") {
        // IFSC: Alphanumeric, uppercase
        processedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
        const validation = validateIFSC(processedValue);
        setValidationErrors(prev => ({
          ...prev,
          bank: { ...prev.bank, ifscCode: validation.isValid ? null : validation.message }
        }));
        
        // Auto-fetch bank details if IFSC is valid
        if (validation.isValid && processedValue.length === 11) {
          try {
            const bankDetails = await fetchBankDetailsByIFSC(processedValue);
            if (bankDetails) {
              setBankInfo(prev => ({
                ...prev,
                ifscCode: processedValue,
                bankName: bankDetails.bankName,
                branchName: bankDetails.branchName
              }));
              toast.success(`Auto-filled: ${bankDetails.bankName} - ${bankDetails.branchName}`);
              return; // Exit early since we're setting multiple values
            }
          } catch (error) {
            console.error('Error auto-fetching bank details:', error);
          }
        }
      } else if (name === "bankName" || name === "branchName") {
        // Bank and branch names: Only alphabets and spaces
        processedValue = value.replace(/[^A-Za-z\s]/g, '');
        processedValue = processedValue
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      }
      setBankInfo((prev) => ({ ...prev, [name]: processedValue }));
    } else if (section === "personal") {
      setPersonalInfo((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleNestedInputChange = (e, section, nestedSection) => {
    const { name, value } = e.target;
    if (section === "personal") {
      setPersonalInfo((prev) => ({
        ...prev,
        [nestedSection]: {
          ...prev[nestedSection],
          [name]: value,
        },
      }));
    }
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="profile-page">
      <Row>
        {/* Enhanced Profile Sidebar with Full Email Display */}
        <Col lg={4} className="mb-4">
          <Card className="profile-sidebar">
            <Card.Body className="text-center">
              <div className="profile-image-container mb-3">
                {profileImage ? (
                  <>
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="profile-image rounded-circle"
                      style={{
                        width: "120px",
                        height: "120px",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                    <div
                      className="profile-placeholder rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: "120px",
                        height: "120px",
                        margin: "0 auto",
                        backgroundColor: "#6366f1",
                        color: "white",
                        fontSize: "48px",
                        fontWeight: "bold",
                        display: "none",
                      }}
                    >
                      {getUserInitials()}
                    </div>
                  </>
                ) : (
                  <div
                    className="profile-placeholder rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                      width: "120px",
                      height: "120px",
                      margin: "0 auto",
                      backgroundColor: "#6366f1",
                      color: "white",
                      fontSize: "48px",
                      fontWeight: "bold",
                    }}
                  >
                    {getUserInitials()}
                  </div>
                )}
              </div>

              <h5 className="mb-1">{personalInfo.name || "N/A"}</h5>
              <p className="text-muted mb-2">
                {personalInfo.designation || "N/A"}
              </p>
              <p className="text-muted small mb-3">
                {personalInfo.department || "N/A"}
              </p>

              {canViewOnly() && (
                <Alert variant="warning" className="small mb-3">
                  <i className="fas fa-lock me-1"></i>
                  Read-Only Access
                </Alert>
              )}

              <ListGroup variant="flush">
                <ListGroup.Item className="border-0 px-0 py-2">
                  <div className="row align-items-center">
                    <div className="col-5 text-start">
                      <small className="text-muted">Employee ID</small>
                    </div>
                    <div className="col-7 text-end">
                      <small className="fw-bold">
                        {personalInfo.employeeId || "N/A"}
                      </small>
                    </div>
                  </div>
                </ListGroup.Item>

                {/* Enhanced Email Display */}
                <ListGroup.Item className="border-0 px-0 py-2">
                  <div className="row align-items-start">
                    <div className="col-5 text-start">
                      <small className="text-muted">Email</small>
                    </div>
                    <div className="col-7 text-end">
                      <small
                        className="text-break d-block"
                        style={{
                          fontSize: "0.75rem",
                          wordWrap: "break-word",
                          lineHeight: "1.2",
                        }}
                        title={personalInfo.email || "N/A"}
                      >
                        {personalInfo.email || "N/A"}
                      </small>
                    </div>
                  </div>
                </ListGroup.Item>

                {/* Enhanced Work Email Display */}
                <ListGroup.Item className="border-0 px-0 py-2">
                  <div className="row align-items-start">
                    <div className="col-5 text-start">
                      <small className="text-muted">Work Email</small>
                    </div>
                    <div className="col-7 text-end">
                      <small
                        className="text-break d-block"
                        style={{
                          fontSize: "0.75rem",
                          wordWrap: "break-word",
                          lineHeight: "1.2",
                        }}
                        title={personalInfo.workemail || "N/A"}
                      >
                        {personalInfo.workemail || "N/A"}
                      </small>
                    </div>
                  </div>
                </ListGroup.Item>

                <ListGroup.Item className="border-0 px-0 py-2">
                  <div className="row align-items-center">
                    <div className="col-5 text-start">
                      <small className="text-muted">Phone</small>
                    </div>
                    <div className="col-7 text-end">
                      <small>{personalInfo.phone || "N/A"}</small>
                    </div>
                  </div>
                </ListGroup.Item>

                <ListGroup.Item className="border-0 px-0 py-2">
                  <div className="row align-items-center">
                    <div className="col-5 text-start">
                      <small className="text-muted">Role Access</small>
                    </div>
                    <div className="col-7 text-end">
                      {employeeRoleLoading ? (
                        <small className="text-muted">
                          <span className="spinner-border spinner-border-sm me-1" style={{width: '12px', height: '12px'}} />
                          Loading...
                        </small>
                      ) : employeeRole ? (
                        <small
                          className="fw-bold text-primary"
                          title={`Employee role: ${employeeRole.role} | User ID: ${employeeRole.userId} | Employee ID: ${employeeId}`}
                        >
                          {employeeRole.role.toUpperCase()}
                          <small className="text-success ms-1">
                            ✓
                          </small>
                          <br />
                          <span className="text-muted" style={{fontSize: '10px'}}>
                            EMP: {employeeId} | USER: {employeeRole.userId}
                          </span>
                        </small>
                      ) : (
                        <small className="text-warning">
                          No role found
                          <br />
                          <span className="text-muted" style={{fontSize: '10px'}}>
                            EMP: {employeeId}
                          </span>
                          <br />
                          <button 
                            className="btn btn-xs btn-outline-primary mt-1"
                            style={{fontSize: '9px', padding: '2px 6px'}}
                            onClick={() => {
                              console.log('🔍 Manual role fetch triggered');
                              fetchEmployeeRole(employeeId);
                            }}
                          >
                            Retry
                          </button>
                        </small>
                      )}
                    </div>
                  </div>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        {/* Main Content */}
        <Col lg={8}>
          <Card>
            <Card.Body>
              <Tab.Container activeKey={tabKey} onSelect={(k) => setTabKey(k)}>
                <Nav variant="tabs" className="mb-4">
                  <Nav.Item>
                    <Nav.Link eventKey="about">About</Nav.Link>
                  </Nav.Item>
                </Nav>

                <Tab.Content>
                  <Tab.Pane eventKey="about">
                    <Tab.Container
                      activeKey={subTabKey}
                      onSelect={(k) => setSubTabKey(k)}
                    >
                      <Nav variant="pills" className="mb-3">
                        <Nav.Item>
                          <Nav.Link eventKey="workInfo">Work Info</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                          <Nav.Link eventKey="personalInfo">
                            Personal Info
                          </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                          <Nav.Link eventKey="bankInfo">Bank Info</Nav.Link>
                        </Nav.Item>
                      </Nav>

                      <Tab.Content>
                        {/* Work Info Tab */}
                        <Tab.Pane eventKey="workInfo">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5>Work Information</h5>
                            {canEditProfile() && (
                              <Button
                                variant={
                                  editWorkInfoMode
                                    ? "success"
                                    : "outline-primary"
                                }
                                size="sm"
                                onClick={() => {
                                  if (editWorkInfoMode) {
                                    updateWorkInfo();
                                  } else {
                                    setEditWorkInfoMode(true);
                                  }
                                }}
                                disabled={loading}
                              >
                                {loading ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-1" />
                                    Updating...
                                  </>
                                ) : editWorkInfoMode ? (
                                  <>
                                    <i className="fas fa-save me-1"></i>
                                    Save Changes
                                  </>
                                ) : (
                                  <>
                                    <i className="fas fa-edit me-1"></i>
                                    Edit
                                  </>
                                )}
                              </Button>
                            )}
                          </div>

                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Department</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="department"
                                  value={workInfo.department || ""}
                                  onChange={(e) => handleInputChange(e, "work")}
                                  disabled={
                                    !editWorkInfoMode || !canEditProfile()
                                  }
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Designation</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="designation"
                                  value={workInfo.designation || ""}
                                  onChange={(e) => handleInputChange(e, "work")}
                                  disabled={
                                    !editWorkInfoMode || !canEditProfile()
                                  }
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Employee Type</Form.Label>
                                <Form.Select
                                  name="employeeType"
                                  value={workInfo.employeeType || ""}
                                  onChange={(e) => handleInputChange(e, "work")}
                                  disabled={
                                    !editWorkInfoMode || !canEditProfile()
                                  }
                                >
                                  <option value="">Select Employee Type</option>
                                  <option value="Permanent">Permanent</option>
                                  <option value="Contract">Contract</option>
                                  <option value="Part Time">Part Time</option>
                                  
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Date of Joining</Form.Label>
                                <Form.Control
                                  type="date"
                                  name="dateOfJoining"
                                  value={
                                    workInfo.dateOfJoining
                                      ? new Date(workInfo.dateOfJoining)
                                          .toISOString()
                                          .split("T")[0]
                                      : ""
                                  }
                                  onChange={(e) => handleInputChange(e, "work")}
                                  disabled={
                                    !editWorkInfoMode || !canEditProfile()
                                  }
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Date of Appointment</Form.Label>
                                <Form.Control
                                  type="date"
                                  name="dateOfAppointment"
                                  value={
                                    workInfo.dateOfAppointment
                                      ? new Date(workInfo.dateOfAppointment)
                                          .toISOString()
                                          .split("T")[0]
                                      : ""
                                  }
                                  onChange={(e) => handleInputChange(e, "work")}
                                  disabled={
                                    !editWorkInfoMode || !canEditProfile()
                                  }
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Mode of Recruitment</Form.Label>
                                <Form.Select
                                  name="modeOfRecruitment"
                                  value={workInfo.modeOfRecruitment || ""}
                                  onChange={(e) => handleInputChange(e, "work")}
                                  disabled={
                                    !editWorkInfoMode || !canEditProfile()
                                  }
                                >
                                  <option value="">Select Mode</option>
                                  <option value="Direct">Online</option>
                                  <option value="Campus">Offline</option>
                                  
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Shift Type</Form.Label>
                                <Form.Select
                                  name="shiftType"
                                  value={workInfo.shiftType || ""}
                                  onChange={(e) => handleInputChange(e, "work")}
                                  disabled={
                                    !editWorkInfoMode || !canEditProfile()
                                  }
                                >
                                  <option value="">Select Shift</option>
                                  <option value="General Shift">
                                    General Shift
                                  </option>
                                  <option value="Morning Shift">
                                    Morning Shift
                                  </option>
                                  <option value="Evening Shift">Evening Shift</option>
                                  <option value="Night Shift">
                                    Night Shift
                                  </option>
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Work Type</Form.Label>
                                <Form.Select
                                  name="workType"
                                  value={workInfo.workType || ""}
                                  onChange={(e) => handleInputChange(e, "work")}
                                  disabled={
                                    !editWorkInfoMode || !canEditProfile()
                                  }
                                >
                                  <option value="">Select Work Type</option>
                                  <option value="Full Time">Full Time</option>
                                  <option value="Part Time">Part Time</option>
                                  <option value="Contract">Contract</option>
                                  <option value="Freelance">Freelance</option>
                                  <option value="Remote">Remote</option>
                                  <option value="Hybrid">
                                    Hybrid
                                  </option>
                                  <option value="On-site">
                                    On-site
                                  </option>
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>UAN Number (12 digits)</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="uanNumber"
                                  value={workInfo.uanNumber || ""}
                                  onChange={(e) => handleInputChange(e, "work")}
                                  disabled={
                                    !editWorkInfoMode || !canEditProfile()
                                  }
                                  isInvalid={validationErrors.work?.uanNumber}
                                  placeholder="Enter 12-digit UAN number"
                                />
                                <Form.Control.Feedback type="invalid">
                                  {validationErrors.work?.uanNumber}
                                </Form.Control.Feedback>
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>PF Number (Provident Fund)</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="pfNumber"
                                  value={workInfo.pfNumber || ""}
                                  onChange={(e) => handleInputChange(e, "work")}
                                  disabled={
                                    !editWorkInfoMode || !canEditProfile()
                                  }
                                  isInvalid={validationErrors.work?.pfNumber}
                                  placeholder="Enter PF Account Number"
                                />
                                <Form.Control.Feedback type="invalid">
                                  {validationErrors.work?.pfNumber}
                                </Form.Control.Feedback>
                                <Form.Text className="text-muted">
                                  Format: 5 letters + 17 digits (max 22-26 chars with spaces/slashes)
                                </Form.Text>
                              </Form.Group>
                            </Col>
                          </Row>

                          {editWorkInfoMode && canEditProfile() && (
                            <div className="mt-3">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="me-2"
                                onClick={() => {
                                  setEditWorkInfoMode(false);
                                  // Reset work info to original values
                                  fetchProfileData();
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          )}
                        </Tab.Pane>

                        {/* Personal Info Tab */}
                        <Tab.Pane eventKey="personalInfo">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5>Personal Information</h5>
                            {canEditProfile() && (
                              <Button
                                variant={
                                  editMode ? "success" : "outline-primary"
                                }
                                size="sm"
                                onClick={() => {
                                  if (editMode) {
                                    updatePersonalInfo();
                                  } else {
                                    setEditMode(true);
                                  }
                                }}
                                disabled={loading}
                              >
                                {loading ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-1" />
                                    Updating...
                                  </>
                                ) : editMode ? (
                                  <>
                                    <i className="fas fa-save me-1"></i>
                                    Save Changes
                                  </>
                                ) : (
                                  <>
                                    <i className="fas fa-edit me-1"></i>
                                    Edit
                                  </>
                                )}
                              </Button>
                            )}
                          </div>

                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Full Name</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="name"
                                  value={personalInfo.name || ""}
                                  onChange={(e) =>
                                    handleInputChange(e, "personal")
                                  }
                                  disabled={!editMode || !canEditProfile()}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Email</Form.Label>
                                <Form.Control
                                  type="email"
                                  name="email"
                                  value={personalInfo.email || ""}
                                  onChange={(e) =>
                                    handleInputChange(e, "personal")
                                  }
                                  disabled={!editMode || !canEditProfile()}
                                  className="text-break"
                                  style={{ fontSize: "0.9rem" }}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Work Email</Form.Label>
                                <Form.Control
                                  type="email"
                                  name="workemail"
                                  value={personalInfo.workemail || ""}
                                  onChange={(e) =>
                                    handleInputChange(e, "personal")
                                  }
                                  disabled={!editMode || !canEditProfile()}
                                  className="text-break"
                                  style={{ fontSize: "0.9rem" }}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Phone</Form.Label>
                                <Form.Control
                                  type="tel"
                                  name="phone"
                                  value={personalInfo.phone || ""}
                                  onChange={(e) =>
                                    handleInputChange(e, "personal")
                                  }
                                  disabled={!editMode || !canEditProfile()}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Date of Birth</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="dob"
                                  value={personalInfo.dob || ""}
                                  onChange={(e) =>
                                    handleInputChange(e, "personal")
                                  }
                                  disabled={!editMode || !canEditProfile()}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Gender</Form.Label>
                                <Form.Select
                                  name="gender"
                                  value={personalInfo.gender || ""}
                                  onChange={(e) =>
                                    handleInputChange(e, "personal")
                                  }
                                  disabled={!editMode || !canEditProfile()}
                                >
                                  <option value="">Select Gender</option>
                                  <option value="Male">Male</option>
                                  <option value="Female">Female</option>
                                  <option value="Other">Other</option>
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Blood Group</Form.Label>
                                <Form.Select
                                  name="bloodGroup"
                                  value={personalInfo.bloodGroup || ""}
                                  onChange={(e) =>
                                    handleInputChange(e, "personal")
                                  }
                                  disabled={!editMode || !canEditProfile()}
                                >
                                  <option value="">Select Blood Group</option>
                                  <option value="A+">A+</option>
                                  <option value="A-">A-</option>
                                  <option value="B+">B+</option>
                                  <option value="B-">B-</option>
                                  <option value="AB+">AB+</option>
                                  <option value="AB-">AB-</option>
                                  <option value="O+">O+</option>
                                  <option value="O-">O-</option>
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Marital Status</Form.Label>
                                <Form.Select
                                  name="maritalStatus"
                                  value={personalInfo.maritalStatus || ""}
                                  onChange={(e) =>
                                    handleInputChange(e, "personal")
                                  }
                                  disabled={!editMode || !canEditProfile()}
                                >
                                  <option value="">Select Status</option>
                                  <option value="Single">Single</option>
                                  <option value="Married">Married</option>
                                  <option value="Divorced">Divorced</option>
                                  <option value="Widowed">Widowed</option>
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Nationality</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="nationality"
                                  value={personalInfo.nationality || ""}
                                  onChange={(e) =>
                                    handleInputChange(e, "personal")
                                  }
                                  disabled={!editMode || !canEditProfile()}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Aadhar Number</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="aadharNumber"
                                  value={personalInfo.aadharNumber || ""}
                                  onChange={(e) =>
                                    handleInputChange(e, "personal")
                                  }
                                  disabled={!editMode || !canEditProfile()}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>PAN Number</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="panNumber"
                                  value={personalInfo.panNumber || ""}
                                  onChange={(e) =>
                                    handleInputChange(e, "personal")
                                  }
                                  disabled={!editMode || !canEditProfile()}
                                />
                              </Form.Group>
                            </Col>
                          </Row>

                          {/* Address Information */}
                          <h6 className="mt-4 mb-3">Address Information</h6>
                          <Row>
                            <Col md={12}>
                              <h6 className="text-muted">Present Address</h6>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Address</Form.Label>
                                <Form.Control
                                  as="textarea"
                                  rows={2}
                                  name="address"
                                  value={
                                    personalInfo.addressDetails?.presentAddress
                                      ?.address || ""
                                  }
                                  onChange={(e) =>
                                    handleNestedInputChange(
                                      e,
                                      "personal",
                                      "addressDetails.presentAddress"
                                    )
                                  }
                                  disabled={!editMode || !canEditProfile()}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>City</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="city"
                                  value={
                                    personalInfo.addressDetails?.presentAddress
                                      ?.city || ""
                                  }
                                  onChange={(e) =>
                                    handleNestedInputChange(
                                      e,
                                      "personal",
                                      "addressDetails.presentAddress"
                                    )
                                  }
                                  disabled={!editMode || !canEditProfile()}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>State</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="state"
                                  value={
                                    personalInfo.addressDetails?.presentAddress
                                      ?.state || ""
                                  }
                                  onChange={(e) =>
                                    handleNestedInputChange(
                                      e,
                                      "personal",
                                      "addressDetails.presentAddress"
                                    )
                                  }
                                  disabled={!editMode || !canEditProfile()}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Pin Code</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="pinCode"
                                  value={
                                    personalInfo.addressDetails?.presentAddress
                                      ?.pinCode || ""
                                  }
                                  onChange={(e) =>
                                    handleNestedInputChange(
                                      e,
                                      "personal",
                                      "addressDetails.presentAddress"
                                    )
                                  }
                                  disabled={!editMode || !canEditProfile()}
                                />
                              </Form.Group>
                            </Col>
                          </Row>

                          {editMode && canEditProfile() && (
                            <div className="mt-3">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="me-2"
                                onClick={() => {
                                  setEditMode(false);
                                  // Reset personal info to original values
                                  fetchProfileData();
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          )}
                        </Tab.Pane>

                        {/* Bank Info Tab */}
                        <Tab.Pane eventKey="bankInfo">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5>Bank Information</h5>
                            {canEditProfile() && (
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={updateBankInfo}
                                disabled={loading}
                              >
                                {loading ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-1" />
                                    Updating...
                                  </>
                                ) : (
                                  <>
                                    <i className="fas fa-save me-1"></i>
                                    Update Bank Info
                                  </>
                                )}
                              </Button>
                            )}
                          </div>

                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Account Number</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="accountNumber"
                                  value={bankInfo.accountNumber || ""}
                                  onChange={(e) => handleInputChange(e, "bank")}
                                  disabled={!canEditProfile()}
                                  isInvalid={validationErrors.bank?.accountNumber}
                                  placeholder="Enter 9-18 digit account number"
                                />
                                <Form.Control.Feedback type="invalid">
                                  {validationErrors.bank?.accountNumber}
                                </Form.Control.Feedback>
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>IFSC Code</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="ifscCode"
                                  value={bankInfo.ifscCode || ""}
                                  onChange={(e) => handleInputChange(e, "bank")}
                                  disabled={!canEditProfile()}
                                  isInvalid={validationErrors.bank?.ifscCode}
                                  placeholder="Enter IFSC Code (e.g., SBIN0001234)"
                                />
                                <Form.Control.Feedback type="invalid">
                                  {validationErrors.bank?.ifscCode}
                                </Form.Control.Feedback>
                                <Form.Text className="text-success">
                                  {bankInfo.ifscCode && validationErrors.bank?.ifscCode === null && "✓ Valid IFSC - Bank details will auto-fill"}
                                </Form.Text>
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Bank Name</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="bankName"
                                  value={bankInfo.bankName || ""}
                                  onChange={(e) => handleInputChange(e, "bank")}
                                  disabled={!canEditProfile()}
                                  placeholder="Bank name (auto-filled from IFSC)"
                                />
                                <Form.Text className="text-muted">
                                  Auto-filled when valid IFSC code is entered
                                </Form.Text>
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Branch Name</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="branchName"
                                  value={bankInfo.branchName || ""}
                                  onChange={(e) => handleInputChange(e, "bank")}
                                  disabled={!canEditProfile()}
                                  placeholder="Branch name (auto-filled from IFSC)"
                                />
                                <Form.Text className="text-muted">
                                  Auto-filled when valid IFSC code is entered
                                </Form.Text>
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Account Type</Form.Label>
                                <Form.Select
                                  name="accountType"
                                  value={bankInfo.accountType || ""}
                                  onChange={(e) => handleInputChange(e, "bank")}
                                  disabled={!canEditProfile()}
                                >
                                  <option value="">Select Account Type</option>
                                  <option value="Savings">Savings</option>
                                  <option value="Current">Current</option>
                                  <option value="Salary">Salary</option>
                                </Form.Select>
                              </Form.Group>
                            </Col>
                          </Row>
                        </Tab.Pane>
                      </Tab.Content>
                    </Tab.Container>
                  </Tab.Pane> 

                  {/* Other Tab Panes */}
                  <Tab.Pane eventKey="workTypeAndShift">
                    <WorkTypeAndShift employeeId={employeeId} />
                  </Tab.Pane>

                  <Tab.Pane eventKey="attendance">
                    <Attendance employeeId={employeeId} />
                  </Tab.Pane>

                  <Tab.Pane eventKey="leave">
                    <Leave employeeId={employeeId} />
                  </Tab.Pane>

                  <Tab.Pane eventKey="payroll">
                    <Payroll employeeId={employeeId} />
                  </Tab.Pane>

                  <Tab.Pane eventKey="allowanceAndDeduction">
                    <AllowanceAndDeduction employeeId={employeeId} />
                  </Tab.Pane>

                  <Tab.Pane eventKey="penaltyAccount">
                    <PenaltyAccount employeeId={employeeId} />
                  </Tab.Pane>

                  <Tab.Pane eventKey="assets">
                    <Assets employeeId={employeeId} />
                  </Tab.Pane>

                  <Tab.Pane eventKey="performance">
                    <Performance employeeId={employeeId} />
                  </Tab.Pane>

                  <Tab.Pane eventKey="documents">
                    <Documents employeeId={employeeId} />
                  </Tab.Pane>

                  <Tab.Pane eventKey="bonusPoints">
                    <BonusPoints employeeId={employeeId} profileImage={profileImage} />
                  </Tab.Pane>

                  <Tab.Pane eventKey="scheduledInterview">
                    <ScheduledInterview employeeId={employeeId} />
                  </Tab.Pane>

                  <Tab.Pane eventKey="resignation">
                    <Resignation employeeId={employeeId} />
                  </Tab.Pane>
                </Tab.Content>
              </Tab.Container>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container> 
  );
};

export default ProfilePage;

