import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import pincodeSearch from "india-pincode-search";

import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Grid,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  IconButton,
  styled,
  ThemeProvider,
  createTheme,
  useMediaQuery,
} from "@mui/material";
import { motion } from "framer-motion";
import { FaEye, FaEyeSlash, FaUpload, FaImage } from "react-icons/fa";

import authService from "../../../screens/api/auth";
import PaymentGateway from "../../../components/PaymentGateway";

// pincodeSearch is imported directly, no need to instantiate

// Create theme with custom breakpoints
const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  palette: {
    primary: {
      main: "#3f51b5",
    },
    secondary: {
      main: "#f50057",
    },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
  },
});

// Enhanced styled components with perfect centering and white background
const RegisterWrapper = styled("div")(({ theme }) => ({
  minHeight: "100vh",
  width: "100vw",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  overflow: "auto",
  padding: "20px",
  backgroundColor: "#ffffff",
  [theme.breakpoints.down("sm")]: {
    padding: "10px",
    alignItems: "flex-start",
    paddingTop: "20px",
  },
  [theme.breakpoints.between("sm", "md")]: {
    padding: "15px",
  },
}));

const RegisterContent = styled(motion.div)(({ theme }) => ({
  width: "100%",
  maxWidth: "900px",
  position: "relative",
  zIndex: 1,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  margin: "0 auto",
  [theme.breakpoints.down("sm")]: {
    maxWidth: "100%",
    width: "100%",
    minHeight: "auto",
  },
  [theme.breakpoints.between("sm", "md")]: {
    maxWidth: "750px",
  },
  [theme.breakpoints.up("lg")]: {
    maxWidth: "950px",
  },
}));

// Updated RegisterPaper with clean white background
const RegisterPaper = styled(Paper)(({ theme }) => ({
  padding: "32px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  width: "100%",
  maxWidth: "900px",
  maxHeight: "calc(100vh - 40px)",
  overflowY: "auto",
  borderRadius: "20px",
  boxShadow: "0 4px 20px 0 rgba(0, 0, 0, 0.1)",
  backgroundColor: "#ffffff",
  border: "1px solid #e0e0e0",
  transition: "all 0.3s ease-in-out",
  transform: "translateZ(0)", // Force hardware acceleration

  // Custom scrollbar styling
  "&::-webkit-scrollbar": {
    width: "8px",
  },
  "&::-webkit-scrollbar-track": {
    background: "rgba(0, 0, 0, 0.1)",
    borderRadius: "4px",
  },
  "&::-webkit-scrollbar-thumb": {
    background: "rgba(0, 0, 0, 0.3)",
    borderRadius: "4px",
    "&:hover": {
      background: "rgba(0, 0, 0, 0.5)",
    },
  },

  [theme.breakpoints.down("sm")]: {
    padding: "20px",
    borderRadius: "15px",
    maxHeight: "calc(100vh - 20px)",
    margin: "10px 0",
  },
  [theme.breakpoints.between("sm", "md")]: {
    padding: "28px",
    borderRadius: "18px",
    maxHeight: "calc(100vh - 30px)",
  },
  [theme.breakpoints.up("lg")]: {
    padding: "40px",
    borderRadius: "25px",
    maxWidth: "950px",
  },
}));

// Enhanced logo upload components
const LogoUploadContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  marginBottom: "20px",
  [theme.breakpoints.down("sm")]: {
    marginBottom: "16px",
  },
  [theme.breakpoints.up("lg")]: {
    marginBottom: "24px",
  },
}));

const LogoPreviewContainer = styled(Box)(({ theme }) => ({
  width: "120px",
  height: "120px",
  border: "2px dashed #d0d0d0",
  borderRadius: "15px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  marginBottom: "10px",
  overflow: "hidden",
  position: "relative",
  backgroundColor: "#f5f5f5",
  transition: "all 0.3s ease",
  "&:hover": {
    borderColor: "#b0b0b0",
    backgroundColor: "#f0f0f0",
  },
  [theme.breakpoints.down("sm")]: {
    width: "100px",
    height: "100px",
    borderRadius: "12px",
  },
  [theme.breakpoints.up("lg")]: {
    width: "140px",
    height: "140px",
    borderRadius: "18px",
  },
}));

const LogoPreviewImage = styled("img")({
  maxWidth: "100%",
  maxHeight: "100%",
  objectFit: "contain",
  borderRadius: "10px",
});

// Updated StyledTextField with dark text and white background
const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#ffffff",
    borderRadius: "10px",
    transition: "all 0.3s ease",
    "& fieldset": {
      borderColor: "#d0d0d0",
      transition: "border-color 0.3s ease",
    },
    "&:hover fieldset": {
      borderColor: "#b0b0b0",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#4a90e2",
      borderWidth: "2px",
    },
    "& input": {
      color: "#333333",
      "&::placeholder": {
        color: "#888888",
        opacity: 1,
      },
      "&:-webkit-autofill": {
        WebkitBoxShadow: "0 0 0 1000px #ffffff inset",
        WebkitTextFillColor: "#333333",
        caretColor: "#333333",
        transition: "background-color 5000s ease-in-out 0s",
      },
    },
  },
  "& .MuiInputLabel-root": {
    color: "#666666",
    "&.Mui-focused": {
      color: "#4a90e2",
    },
  },
  "& .MuiFormHelperText-root": {
    fontSize: "0.75rem",
    marginLeft: "14px",
    marginTop: "4px",
    color: "#666666",
    "&.Mui-error": {
      color: "#f44336",
    },
  },
  marginBottom: "16px",
  [theme.breakpoints.down("sm")]: {
    marginBottom: "12px",
    "& .MuiOutlinedInput-root": {
      borderRadius: "8px",
    },
  },
  [theme.breakpoints.up("lg")]: {
    marginBottom: "18px",
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px",
    },
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#4a90e2",
  color: "white",
  fontWeight: 600,
  borderRadius: "10px",
  textTransform: "none",
  boxShadow: "0 4px 10px rgba(74, 144, 226, 0.3)",
  transition: "all 0.3s ease",
  position: "relative",
  overflow: "hidden",
  "&:hover": {
    backgroundColor: "#357abd",
    boxShadow: "0 6px 15px rgba(74, 144, 226, 0.4)",
    transform: "translateY(-2px)",
  },
  "&:active": {
    transform: "translateY(0)",
  },
  "&:disabled": {
    backgroundColor: "#4a90e2",
    opacity: 0.7,
    transform: "none",
  },
  [theme.breakpoints.down("sm")]: {
    borderRadius: "8px",
    fontSize: "0.9rem",
  },
  [theme.breakpoints.up("lg")]: {
    borderRadius: "12px",
    fontSize: "1.05rem",
  },
}));

const CenteredContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "100vh",
  width: "100%",
  position: "relative",
  [theme.breakpoints.down("sm")]: {
    alignItems: "flex-start",
    paddingTop: "20px",
    minHeight: "calc(100vh - 40px)",
  },
}));

// Steps for registration
const steps = [
  "Company Information",
  "Admin Account",
  "Email Verification",
  "Payment",
];

const RegisterCompanyPage = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [logoPreview, setLogoPreview] = useState("");
  const [registrationData, setRegistrationData] = useState(null);
  const [adminOtp, setAdminOtp] = useState(["", "", "", "", "", ""]);
  const [contactOtp, setContactOtp] = useState(["", "", "", "", "", ""]);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  // Create refs for OTP inputs
  const adminInputRefs = useRef([]);
  const contactInputRefs = useRef([]);

  // Media queries for responsive design
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isLargeDesktop = useMediaQuery(theme.breakpoints.up("lg"));

  // Company form data
  const [companyData, setCompanyData] = useState({
    name: "",
    companyCode: "",
    industry: "",
    contactEmail: "",
    contactPhone: "",
    logo: null,
    address: {
      street: "",
      city: "",
      state: "",
      country: "",
      zipCode: "",
    },
  });

  // Form validation errors
  const [validationErrors, setValidationErrors] = useState({
    name: "",
    companyCode: "",
    industry: "",
    contactEmail: "",
    contactPhone: "",
    logo: "",
    address: {
      street: "",
      city: "",
      state: "",
      country: "",
      zipCode: "",
    },
  });

  // Admin form data
  const [adminData, setAdminData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Admin validation errors
  const [adminValidationErrors, setAdminValidationErrors] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const navigate = useNavigate();

  // Initialize refs
  useEffect(() => {
    adminInputRefs.current = adminInputRefs.current.slice(0, 6);
    contactInputRefs.current = contactInputRefs.current.slice(0, 6);
  }, []);

  // Timer for resend button
  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timerId);
    } else if (timeLeft === 0) {
      setResendDisabled(false);
    }
  }, [timeLeft]);

  // Helper function to capitalize first letter of each word (sentence case)
  const toSentenceCase = (str) => {
    if (!str) return "";
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Handle logo upload
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/svg+xml",
    ];
    if (!validTypes.includes(file.type)) {
      setValidationErrors({
        ...validationErrors,
        logo: "Please upload a valid image file (JPEG, PNG, GIF, SVG)",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setValidationErrors({
        ...validationErrors,
        logo: "Image size should not exceed 2MB",
      });
      return;
    }

    // Create a preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Store the file in state
    setCompanyData({
      ...companyData,
      logo: file,
    });

    // Clear any previous error
    setValidationErrors({
      ...validationErrors,
      logo: "",
    });
  };

  // Validate city-state-pincode correlation
  const validateAddressCorrelation = (address, changedField) => {
    const errors = { ...validationErrors.address };
    let updatedAddress = { ...address };

    // Only validate for Indian addresses
    if (!address.country || address.country.toLowerCase() === "india") {
      // If pincode is 6 digits, validate against city and state
      if (address.zipCode && address.zipCode.length === 6) {
        const results = pincodeSearch.search(address.zipCode);

        if (results && results.length > 0) {
          const pincodeInfo = results[0];
          const expectedCity = toSentenceCase(pincodeInfo.district);
          // The API returns 'state' field, not 'stateName'
          const expectedState = toSentenceCase(pincodeInfo.state || "");

          // Auto-fill city and state when pincode is entered
          if (changedField === "zipCode") {
            updatedAddress.city = expectedCity;
            updatedAddress.state = expectedState;
            updatedAddress.country = "India";
            errors.zipCode = "";
            errors.city = "";
            errors.state = "";
            errors.country = "";

            // Log successful auto-fill for debugging with more detail
            console.log(
              `✓ Auto-filled from pincode ${address.zipCode}: ${expectedCity}, ${expectedState}, India`
            );
            console.log("Pincode API response:", pincodeInfo);
          } else {
            // Validate manually entered city against pincode
            if (
              changedField === "city" &&
              address.city &&
              address.city.toLowerCase().trim() !==
                expectedCity.toLowerCase().trim()
            ) {
              errors.city = `City "${address.city}" doesn't match pincode ${address.zipCode}. Expected: ${expectedCity}`;
            } else if (changedField === "city") {
              errors.city = "";
            }

            // Validate manually entered state against pincode
            if (
              changedField === "state" &&
              address.state &&
              expectedState &&
              address.state.toLowerCase().trim() !==
                expectedState.toLowerCase().trim()
            ) {
              errors.state = `State "${address.state}" doesn't match pincode ${address.zipCode}. Expected: ${expectedState}`;
            } else if (changedField === "state") {
              errors.state = "";
            }
          }
        } else {
          // Invalid pincode
          if (changedField === "zipCode") {
            errors.zipCode =
              "Invalid Indian pincode. Please check the pincode.";
          }
        }
      } else if (
        address.zipCode &&
        address.zipCode.length > 0 &&
        address.zipCode.length < 6
      ) {
        // Incomplete pincode
        if (changedField === "zipCode") {
          errors.zipCode = "Pincode must be exactly 6 digits";
        }
      } else {
        // No pincode entered, clear pincode-related errors
        if (changedField === "zipCode") {
          errors.zipCode = "";
        }
      }

      // Validate if city and state are from India when country is India
      if (
        changedField === "country" &&
        address.country &&
        address.country.toLowerCase() === "india"
      ) {
        if (!address.zipCode || address.zipCode.length !== 6) {
          errors.zipCode = "Please enter a valid 6-digit Indian pincode";
        }
      }
    } else {
      // For non-Indian countries, clear all Indian-specific validations
      if (changedField === "country") {
        errors.zipCode = "";
        errors.city = "";
        errors.state = "";
      }
    }

    // Update validation errors
    setValidationErrors((prev) => ({
      ...prev,
      address: errors,
    }));

    return updatedAddress;
  };

  // Handle company form change
  const handleCompanyChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    let newErrors = { ...validationErrors };

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      let updatedAddress = { ...companyData.address };

      if (["city", "state", "country"].includes(child)) {
        newValue = toSentenceCase(value);
      }

      if (child === "zipCode") {
        newValue = value.replace(/\D/g, "").slice(0, 6);
      }

      updatedAddress[child] = newValue;

      // Always run address correlation validation for all address fields
      updatedAddress = validateAddressCorrelation(updatedAddress, child);

      setCompanyData({
        ...companyData,
        address: updatedAddress,
      });
    } else {
      // Direct fields
      if (name === "industry") {
        newValue = toSentenceCase(value);
      } else if (name === "companyCode") {
        newValue = value.toUpperCase();
      } else if (name === "contactEmail") {
        newValue = value.toLowerCase();
      } else if (name === "contactPhone") {
        newValue = value.replace(/\D/g, "").slice(0, 10);
      }

      // Validation
      if (name === "contactEmail") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        newErrors.contactEmail =
          newValue && !emailRegex.test(newValue)
            ? "Please enter a valid email address"
            : "";
      }

      if (name === "contactPhone") {
        newErrors.contactPhone =
          newValue && newValue.length !== 10
            ? "Phone number must be exactly 10 digits"
            : "";
      }

      if (name === "companyCode") {
        if (newValue && newValue.length < 2) {
          newErrors.companyCode = "Company code must be at least 2 characters";
        } else if (!/^[A-Z0-9]+$/.test(newValue)) {
          newErrors.companyCode =
            "Company code should contain only letters and numbers";
        } else {
          newErrors.companyCode = "";
        }
      }

      setCompanyData({
        ...companyData,
        [name]: newValue,
      });
    }

    // Don't manually update address errors here since validateAddressCorrelation handles them
    // Only update non-address validation errors
    if (!name.includes(".")) {
      setValidationErrors(newErrors);
    }
    if (error) setError("");
  };

  useEffect(() => {
    setCompanyData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        country: "India",
      },
    }));
  }, []);

  useEffect(() => {
    if (companyData.companyCode.length > 2) {
      const timer = setTimeout(async () => {
        try {
          const res = await authService.checkCompanyCode(
            companyData.companyCode
          );
          if (!res.data.available) {
            setValidationErrors((prev) => ({
              ...prev,
              companyCode: "Code already in use",
            }));
          }
        } catch (e) {
          // Handle server check error
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [companyData.companyCode]);

  // Handle admin form change
  const handleAdminChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    let newErrors = { ...adminValidationErrors };

    // Apply sentence case for name fields and restrict to alphabets only
    if (["firstName", "lastName", "middleName"].includes(name)) {
      // Only allow letters and spaces, remove numbers and special characters
      newValue = value.replace(/[^a-zA-Z\s]/g, "");
      newValue = toSentenceCase(newValue);
    } else if (name === "email") {
      newValue = value.toLowerCase();
    }

    // Validation for admin fields
    if (["firstName", "lastName", "middleName"].includes(name)) {
      if (newValue && !/^[a-zA-Z\s]*$/.test(newValue)) {
        newErrors[name] = "Only letters and spaces are allowed";
      } else if (
        newValue &&
        newValue.trim().length < 2 &&
        name !== "middleName"
      ) {
        newErrors[name] = `${
          name === "firstName" ? "First" : "Last"
        } name must be at least 2 characters`;
      } else {
        newErrors[name] = "";
      }
    } else if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (newValue && !emailRegex.test(newValue)) {
        newErrors.email = "Please enter a valid email address";
      } else {
        newErrors.email = "";
      }
    }

    if (name === "password") {
      if (newValue && newValue.length < 8) {
        newErrors.password = "Password must be at least 8 characters long";
      } else if (newValue && !/(?=.*[a-z])/.test(newValue)) {
        newErrors.password =
          "Password must include at least one lowercase letter";
      } else if (newValue && !/(?=.*[A-Z])/.test(newValue)) {
        newErrors.password =
          "Password must include at least one uppercase letter";
      } else if (newValue && !/(?=.*\d)/.test(newValue)) {
        newErrors.password = "Password must include at least one number";
      } else if (newValue && !/(?=.*[@$!%*?&])/.test(newValue)) {
        newErrors.password =
          "Password must include at least one special character";
      } else {
        newErrors.password = "";
      }

      // Check confirm password if it exists
      if (adminData.confirmPassword && newValue !== adminData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      } else if (adminData.confirmPassword) {
        newErrors.confirmPassword = "";
      }
    }

    if (name === "confirmPassword") {
      if (newValue !== adminData.password) {
        newErrors.confirmPassword = "Passwords do not match";
      } else {
        newErrors.confirmPassword = "";
      }
    }

    setAdminData({
      ...adminData,
      [name]: newValue,
    });

    setAdminValidationErrors(newErrors);
    if (error) setError("");
  };

  // Validate company step
  const validateCompanyStep = () => {
    const errors = {
      name: "",
      companyCode: "",
      industry: "",
      contactEmail: "",
      contactPhone: "",
      logo: "",
      address: {
        street: "",
        city: "",
        state: "",
        country: "",
        zipCode: "",
      },
    };

    let isValid = true;

    // ✅ Logo required
    if (!companyData.logo) {
      errors.logo = "Company logo is required";
      isValid = false;
    }

    // ✅ Company name (min 2 characters)
    if (!companyData.name.trim()) {
      errors.name = "Company name is required";
      isValid = false;
    } else if (companyData.name.trim().length < 2) {
      errors.name = "Company name must be at least 2 characters";
      isValid = false;
    }

    // ✅ Company code (exactly 2 uppercase letters)
    if (!companyData.companyCode.trim()) {
      errors.companyCode = "Company code is required";
      isValid = false;
    } else if (companyData.companyCode.trim().length < 2) {
      errors.companyCode = "Company code must be at least 2 characters";
      isValid = false;
    } else if (!/^[A-Z0-9]+$/.test(companyData.companyCode.trim())) {
      errors.companyCode =
        "Company code should contain only uppercase letters and numbers";
      isValid = false;
    }

    if (!companyData.industry.trim()) {
      errors.industry = "Industry is required";
      isValid = false;
    }

    if (!companyData.contactEmail.trim()) {
      errors.contactEmail = "Contact email is required";
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(companyData.contactEmail)) {
        errors.contactEmail = "Please enter a valid email address";
        isValid = false;
      }
    }

    if (!companyData.contactPhone.trim()) {
      errors.contactPhone = "Contact phone is required";
      isValid = false;
    } else if (companyData.contactPhone.length !== 10) {
      errors.contactPhone = "Phone number must be exactly 10 digits";
      isValid = false;
    }

    if (!companyData.address.street.trim()) {
      errors.address.street = "Street address is required";
      isValid = false;
    }

    if (!companyData.address.city.trim()) {
      errors.address.city = "City is required";
      isValid = false;
    }

    if (!companyData.address.state.trim()) {
      errors.address.state = "State is required";
      isValid = false;
    }

    if (!companyData.address.country.trim()) {
      errors.address.country = "Country is required";
      isValid = false;
    }

    if (!companyData.address.zipCode.trim()) {
      errors.address.zipCode = "Zip code is required";
      isValid = false;
    } else if (companyData.address.zipCode.length !== 6) {
      errors.address.zipCode = "Zip code must be exactly 6 digits";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  // Validate admin step
  const validateAdminStep = () => {
    const errors = {
      firstName: "",
      lastName: "",
      middleName: "",
      email: "",
      password: "",
      confirmPassword: "",
    };

    let isValid = true;

    if (!adminData.firstName.trim()) {
      errors.firstName = "First name is required";
      isValid = false;
    } else if (!/^[a-zA-Z\s]*$/.test(adminData.firstName)) {
      errors.firstName = "First name should only contain letters";
      isValid = false;
    } else if (adminData.firstName.trim().length < 2) {
      errors.firstName = "First name must be at least 2 characters";
      isValid = false;
    }

    if (!adminData.lastName.trim()) {
      errors.lastName = "Last name is required";
      isValid = false;
    } else if (!/^[a-zA-Z\s]*$/.test(adminData.lastName)) {
      errors.lastName = "Last name should only contain letters";
      isValid = false;
    } else if (adminData.lastName.trim().length < 2) {
      errors.lastName = "Last name must be at least 2 characters";
      isValid = false;
    }

    // Validate middle name if provided
    if (adminData.middleName && !/^[a-zA-Z\s]*$/.test(adminData.middleName)) {
      errors.middleName = "Middle name should only contain letters";
      isValid = false;
    }

    if (!adminData.email.trim()) {
      errors.email = "Email is required";
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(adminData.email)) {
        errors.email = "Please enter a valid email address";
        isValid = false;
      }
    }

    if (!adminData.password) {
      errors.password = "Password is required";
      isValid = false;
    } else if (adminData.password.length < 8) {
      errors.password = "Password must be at least 8 characters long";
      isValid = false;
    } else if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(adminData.password)
    ) {
      errors.password =
        "Password must include uppercase, lowercase, number and special character";
      isValid = false;
    }

    if (!adminData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
      isValid = false;
    } else if (adminData.password !== adminData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setAdminValidationErrors(errors);
    return isValid;
  };

  // Handle next step
  const handleNext = async () => {
    if (activeStep === 0) {
      if (validateCompanyStep()) {
        setActiveStep(1);
      }
    } else if (activeStep === 1) {
      if (validateAdminStep()) {
        // Register company and move to OTP step
        await handleCompanyRegistration();
      }
    }
  };

  // Handle back step
  const handleBack = () => {
    if (activeStep === 3) {
      setActiveStep(2);
    } else if (activeStep === 2) {
      setActiveStep(1);
    } else if (activeStep === 1) {
      setActiveStep(0);
    }
  };

  // Handle company registration and move to OTP step
  const handleCompanyRegistration = async () => {
    if (!validateAdminStep()) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Create FormData for file upload
      const formData = new FormData();

      // Create company object
      const companyObject = {
        name: companyData.name,
        companyCode: companyData.companyCode,
        industry: companyData.industry,
        contactEmail: companyData.contactEmail,
        contactPhone: companyData.contactPhone,
        address: {
          street: companyData.address.street,
          city: companyData.address.city,
          state: companyData.address.state,
          country: companyData.address.country,
          zipCode: companyData.address.zipCode,
        },
      };

      // Create admin object
      const adminObject = {
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        middleName: adminData.middleName || "",
        email: adminData.email,
        password: adminData.password,
      };

      // Debug the objects before sending
      console.log("=== FRONTEND DEBUG ===");
      console.log("Company Object:", companyObject);
      console.log("Admin Object:", adminObject);
      console.log("Admin Email:", adminData.email);
      console.log("Logo file:", companyData.logo);

      // Add JSON strings to FormData
      formData.append("company", JSON.stringify(companyObject));
      formData.append("admin", JSON.stringify(adminObject));

      // Add logo if uploaded
      if (companyData.logo) {
        formData.append("logo", companyData.logo);
      }

      // Debug FormData contents
      console.log("=== FORMDATA DEBUG ===");
      for (let [key, value] of formData.entries()) {
        if (key === "logo") {
          console.log(
            key,
            "File:",
            value.name,
            "Size:",
            value.size,
            "Type:",
            value.type
          );
        } else {
          console.log(key, ":", value);
          try {
            const parsed = JSON.parse(value);
            console.log(`${key} parsed:`, parsed);
          } catch (e) {
            console.error(`Error parsing ${key}:`, e);
          }
        }
      }

      const response = await authService.registerCompany(formData);

      if (response.data.success) {
        // Store registration data and move to OTP verification step
        setRegistrationData({
          adminEmail: response.data.adminEmail,
          contactEmail: response.data.contactEmail,
          companyCode: response.data.companyCode,
          requiresContactEmailVerification:
            response.data.requiresContactEmailVerification,
          message: response.data.requiresContactEmailVerification
            ? "Company registered successfully! Please check both email addresses for OTP verification codes."
            : "Company registered successfully! Please check your email for the OTP verification code.",
        });
        setActiveStep(2); // Move to OTP verification step
        setTimeLeft(60); // Start countdown for resend
        setResendDisabled(true);
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Admin OTP input change
  const handleAdminOtpChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    // Update OTP state
    const newOtp = [...adminOtp];
    newOtp[index] = value;
    setAdminOtp(newOtp);

    // Clear error when user types
    if (error) setError("");

    // Auto-focus next input
    if (value && index < 5) {
      adminInputRefs.current[index + 1].focus();
    }
  };

  // Handle Contact OTP input change
  const handleContactOtpChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    // Update OTP state
    const newOtp = [...contactOtp];
    newOtp[index] = value;
    setContactOtp(newOtp);

    // Clear error when user types
    if (error) setError("");

    // Auto-focus next input
    if (value && index < 5) {
      contactInputRefs.current[index + 1].focus();
    }
  };

  // Handle key press in Admin OTP input
  const handleAdminKeyDown = (index, e) => {
    // Move to previous input on backspace if current input is empty
    if (e.key === "Backspace" && !adminOtp[index] && index > 0) {
      adminInputRefs.current[index - 1].focus();
    }
  };

  // Handle key press in Contact OTP input
  const handleContactKeyDown = (index, e) => {
    // Move to previous input on backspace if current input is empty
    if (e.key === "Backspace" && !contactOtp[index] && index > 0) {
      contactInputRefs.current[index - 1].focus();
    }
  };

  // Handle paste event for Admin OTP inputs
  const handleAdminOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");

    // Only process if pasted data is exactly 6 digits
    if (!/^\d{6}$/.test(pastedData)) {
      return;
    }

    // Split the 6-digit code into individual digits
    const digits = pastedData.split("");
    const newOtp = [...adminOtp];

    // Fill the OTP inputs with the pasted digits
    digits.forEach((digit, index) => {
      if (index < 6) {
        newOtp[index] = digit;
      }
    });

    setAdminOtp(newOtp);

    // Clear any existing errors
    if (error) setError("");

    // Focus on the last input
    if (adminInputRefs.current[5]) {
      adminInputRefs.current[5].focus();
    }
  };

  // Handle paste event for Contact OTP inputs
  const handleContactOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");

    // Only process if pasted data is exactly 6 digits
    if (!/^\d{6}$/.test(pastedData)) {
      return;
    }

    // Split the 6-digit code into individual digits
    const digits = pastedData.split("");
    const newOtp = [...contactOtp];

    // Fill the OTP inputs with the pasted digits
    digits.forEach((digit, index) => {
      if (index < 6) {
        newOtp[index] = digit;
      }
    });

    setContactOtp(newOtp);

    // Clear any existing errors
    if (error) setError("");

    // Focus on the last input
    if (contactInputRefs.current[5]) {
      contactInputRefs.current[5].focus();
    }
  };

  // Handle OTP verification
  const handleVerifyOtp = async () => {
    const adminOtpValue = adminOtp.join("");
    const contactOtpValue = contactOtp.join("");

    // Validate admin OTP
    if (adminOtpValue.length !== 6) {
      setError("Please enter a valid 6-digit admin OTP");
      return;
    }

    // Validate contact OTP if required
    if (
      registrationData.requiresContactEmailVerification &&
      contactOtpValue.length !== 6
    ) {
      setError("Please enter a valid 6-digit contact email OTP");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await authService.verifyDualOtp(
        registrationData.adminEmail,
        adminOtpValue,
        registrationData.contactEmail,
        registrationData.requiresContactEmailVerification
          ? contactOtpValue
          : null,
        registrationData.companyCode
      );

      if (response.success) {
        // Move to payment step
        setActiveStep(3);
        // Don't auto-open payment gateway, let user click button
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      setError(
        err.response?.data?.message ||
          "OTP verification failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOtp = async () => {
    if (!registrationData?.adminEmail) {
      setError("Admin email is required for resending OTP");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await authService.resendOtp(registrationData.adminEmail);

      // Start countdown
      setTimeLeft(60);
      setResendDisabled(true);

      // Clear OTP inputs
      setAdminOtp(["", "", "", "", "", ""]);
      setContactOtp(["", "", "", "", "", ""]);
    } catch (err) {
      console.error("Resend OTP error:", err);
      setError(
        err.response?.data?.message || "Failed to resend OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = (paymentDetails) => {
    setPaymentCompleted(true);
    setShowPaymentGateway(false);
    setLoading(false);

    // Navigate to success page or dashboard
    navigate("/login", {
      state: {
        message: `Registration completed successfully! Payment of ₹${paymentDetails.amount} received. Please login to continue.`,
        type: "success",
        paymentId: paymentDetails.paymentId,
      },
    });
  };

  // Handle payment failure
  const handlePaymentFailure = (error) => {
    console.log("Payment failure handled, staying on payment page:", error);

    // Keep the payment gateway open so user can retry
    // setShowPaymentGateway(false); // Don't close the gateway

    // Show error message but don't redirect
    const errorMessage =
      error?.response?.data?.message ||
      error?.message ||
      "Payment failed. Please try again.";

    setError(`Payment failed: ${errorMessage}`);
    setLoading(false);

    // Prevent any auto-redirects by explicitly staying on current page
    if (window.history && window.history.pushState) {
      window.history.pushState(null, "", window.location.pathname);
    }
  };

  // Handle payment gateway close
  const handlePaymentClose = () => {
    setShowPaymentGateway(false);
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    if (field === "password") {
      setShowPassword(!showPassword);
    } else if (field === "confirmPassword") {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  // Get responsive icon size
  const getIconSize = () => {
    if (isMobile) return 16;
    if (isTablet) return 18;
    if (isLargeDesktop) return 22;
    return 20;
  };

  return (
    <ThemeProvider theme={theme}>
      <RegisterWrapper>
        {/* Centered Content Container */}
        <CenteredContainer>
          <Container
            maxWidth={false}
            sx={{
              padding: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              maxWidth: isMobile
                ? "100%"
                : isTablet
                ? "750px"
                : isLargeDesktop
                ? "900px"
                : "850px",
            }}
          >
            <RegisterContent
              initial={{
                opacity: 0,
                y: isMobile ? 10 : 20,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              transition={{
                duration: isMobile ? 0.4 : 0.6,
                ease: "easeOut",
                type: "spring",
                stiffness: 100,
                damping: 15,
              }}
            >
              <RegisterPaper elevation={3}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  style={{
                    width: "100%",
                    textAlign: "center",
                    marginBottom: isMobile ? "20px" : "30px",
                  }}
                >
                  <Typography
                    variant={isMobile ? "h5" : isTablet ? "h4" : "h3"}
                    component="h1"
                    sx={{
                      mb: 1,
                      color: "#2c3e50",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: isMobile ? "1px" : "2px",
                      fontSize: {
                        xs: "1.5rem",
                        sm: "1.75rem",
                        md: "2rem",
                        lg: "2.25rem",
                      },
                    }}
                  >
                    Register Company
                  </Typography>

                  <Typography
                    variant="body1"
                    sx={{
                      color: "rgba(0, 0, 0, 0.7)",
                      fontSize: {
                        xs: "0.85rem",
                        sm: "0.9rem",
                        md: "1rem",
                        lg: "1.1rem",
                      },
                      fontWeight: 400,
                      lineHeight: 1.4,
                      maxWidth: isMobile ? "100%" : "80%",
                      mx: "auto",
                    }}
                  >
                    Create your company account and start managing your
                    workforce
                  </Typography>
                </motion.div>

                {/* Enhanced Stepper */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  style={{
                    width: "100%",
                    marginBottom: isMobile ? "25px" : "35px",
                  }}
                >
                  <Stepper
                    activeStep={activeStep}
                    alternativeLabel={!isMobile}
                    orientation={isMobile ? "vertical" : "horizontal"}
                    sx={{
                      "& .MuiStepLabel-root .Mui-completed": {
                        color: "#4caf50",
                      },
                      "& .MuiStepLabel-root .Mui-active": {
                        color: "#4a90e2",
                      },
                      "& .MuiStepLabel-label": {
                        fontSize: {
                          xs: "0.75rem",
                          sm: "0.875rem",
                          md: "1rem",
                        },
                        fontWeight: 500,
                        color: "rgba(0, 0, 0, 0.6)",
                        "&.Mui-active": {
                          color: "#4a90e2",
                          fontWeight: 600,
                        },
                        "&.Mui-completed": {
                          color: "#4caf50",
                          fontWeight: 600,
                        },
                      },
                      "& .MuiStepIcon-root": {
                        fontSize: {
                          xs: "1.5rem",
                          sm: "1.75rem",
                          md: "2rem",
                        },
                        color: "rgba(0, 0, 0, 0.3)",
                        "&.Mui-active": {
                          color: "#4a90e2",
                        },
                        "&.Mui-completed": {
                          color: "#4caf50",
                        },
                      },
                      "& .MuiStepConnector-line": {
                        borderColor: "rgba(0, 0, 0, 0.3)",
                      },
                    }}
                  >
                    {steps.map((label, index) => (
                      <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                </motion.div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    style={{ width: "100%", marginBottom: "20px" }}
                  >
                    <Alert
                      severity="error"
                      sx={{
                        borderRadius: isMobile ? "8px" : "10px",
                        fontSize: {
                          xs: "0.8rem",
                          sm: "0.85rem",
                          md: "0.9rem",
                        },
                        backgroundColor: "rgba(244, 67, 54, 0.1)",
                        border: "1px solid rgba(244, 67, 54, 0.3)",
                        "& .MuiAlert-message": {
                          color: "#f44336",
                          fontWeight: 500,
                        },
                      }}
                    >
                      {error}
                    </Alert>
                  </motion.div>
                )}

                <Box
                  component="form"
                  onSubmit={(e) => e.preventDefault()}
                  sx={{ width: "100%" }}
                >
                  {activeStep === 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                    >
                      {/* Company Information Step */}
                      <Typography
                        variant="h6"
                        sx={{
                          mb: isMobile ? 2 : 3,
                          color: "#333333",
                          fontWeight: 600,
                          fontSize: {
                            xs: "1.1rem",
                            sm: "1.25rem",
                            md: "1.5rem",
                          },
                          textAlign: "center",
                        }}
                      >
                        Company Information
                      </Typography>

                      {/* Logo Upload Section */}
                      <LogoUploadContainer>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            mb: 2,
                            color: "#333333",
                            fontSize: {
                              xs: "0.9rem",
                              sm: "1rem",
                              md: "1.1rem",
                            },
                            fontWeight: 500,
                          }}
                        >
                          Company Logo *
                        </Typography>

                        <LogoPreviewContainer>
                          {logoPreview ? (
                            <LogoPreviewImage
                              src={logoPreview}
                              alt="Logo Preview"
                            />
                          ) : (
                            <Box sx={{ textAlign: "center", color: "#888888" }}>
                              <FaImage
                                size={isMobile ? 30 : isTablet ? 35 : 40}
                              />
                              <Typography
                                variant="body2"
                                sx={{
                                  mt: 1,
                                  fontSize: {
                                    xs: "0.75rem",
                                    sm: "0.8rem",
                                    md: "0.85rem",
                                  },
                                  color: "#888888",
                                }}
                              >
                                Upload Logo
                              </Typography>
                            </Box>
                          )}
                        </LogoPreviewContainer>

                        <input
                          accept="image/*"
                          style={{ display: "none" }}
                          id="logo-upload"
                          type="file"
                          onChange={handleLogoUpload}
                        />
                        <label htmlFor="logo-upload">
                          <Button
                            variant="outlined"
                            component="span"
                            startIcon={<FaUpload size={getIconSize()} />}
                            sx={{
                              borderRadius: isMobile ? "6px" : "8px",
                              textTransform: "none",
                              fontSize: {
                                xs: "0.8rem",
                                sm: "0.85rem",
                                md: "0.9rem",
                              },
                              borderColor: "#d0d0d0",
                              color: "#333333",
                              "&:hover": {
                                borderColor: "#4a90e2",
                                backgroundColor: "rgba(74, 144, 226, 0.08)",
                              },
                            }}
                          >
                            Choose File
                          </Button>
                        </label>

                        {validationErrors.logo && (
                          <Typography
                            color="error"
                            variant="caption"
                            sx={{
                              mt: 1,
                              fontSize: {
                                xs: "0.7rem",
                                sm: "0.75rem",
                              },
                              display: "block",
                              textAlign: "center",
                            }}
                          >
                            {validationErrors.logo}
                          </Typography>
                        )}
                      </LogoUploadContainer>

                      <Grid container spacing={isMobile ? 2 : 3}>
                        <Grid item xs={12} md={6}>
                          <StyledTextField
                            required
                            fullWidth
                            id="name"
                            label="Company Name"
                            name="name"
                            value={companyData.name}
                            onChange={handleCompanyChange}
                            error={!!validationErrors.name}
                            helperText={validationErrors.name}
                            disabled={loading}
                            size={isMobile ? "small" : "medium"}
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <StyledTextField
                            required
                            fullWidth
                            id="companyCode"
                            label="Company Code"
                            name="companyCode"
                            value={companyData.companyCode}
                            onChange={handleCompanyChange}
                            error={!!validationErrors.companyCode}
                            helperText={
                              validationErrors.companyCode ||
                              "Unique identifier for your company"
                            }
                            disabled={loading}
                            size={isMobile ? "small" : "medium"}
                            inputProps={{
                              style: { textTransform: "uppercase" },
                            }}
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <StyledTextField
                            required
                            fullWidth
                            id="industry"
                            label="Industry"
                            name="industry"
                            value={companyData.industry}
                            onChange={handleCompanyChange}
                            error={!!validationErrors.industry}
                            helperText={validationErrors.industry}
                            disabled={loading}
                            size={isMobile ? "small" : "medium"}
                            placeholder="e.g., Information Technology, Healthcare, Finance"
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <StyledTextField
                            required
                            fullWidth
                            id="contactEmail"
                            label="Contact Email"
                            name="contactEmail"
                            type="email"
                            value={companyData.contactEmail}
                            onChange={handleCompanyChange}
                            error={!!validationErrors.contactEmail}
                            helperText={validationErrors.contactEmail}
                            disabled={loading}
                            size={isMobile ? "small" : "medium"}
                            inputProps={{
                              style: { textTransform: "lowercase" },
                            }}
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <StyledTextField
                            required
                            fullWidth
                            id="contactPhone"
                            label="Contact Phone"
                            name="contactPhone"
                            value={companyData.contactPhone}
                            onChange={handleCompanyChange}
                            error={!!validationErrors.contactPhone}
                            helperText={
                              validationErrors.contactPhone ||
                              "10-digit phone number"
                            }
                            disabled={loading}
                            size={isMobile ? "small" : "medium"}
                            inputProps={{
                              maxLength: 10,
                              pattern: "[0-9]*",
                            }}
                          />
                        </Grid>

                        {/* Address Section */}
                        <Grid item xs={12}>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              mt: isMobile ? 1 : 2,
                              mb: isMobile ? 1 : 2,
                              color: "white",
                              fontWeight: 600,
                              fontSize: {
                                xs: "1rem",
                                sm: "1.1rem",
                                md: "1.2rem",
                              },
                              textAlign: "center",
                            }}
                          >
                            Company Address
                          </Typography>
                        </Grid>

                        <Grid item xs={12}>
                          <StyledTextField
                            required
                            fullWidth
                            id="street"
                            label="Street Address"
                            name="address.street"
                            value={companyData.address.street}
                            onChange={handleCompanyChange}
                            error={!!validationErrors.address.street}
                            helperText={validationErrors.address.street}
                            disabled={loading}
                            size={isMobile ? "small" : "medium"}
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <StyledTextField
                            required
                            fullWidth
                            id="city"
                            label="City"
                            name="address.city"
                            value={companyData.address.city}
                            onChange={handleCompanyChange}
                            error={!!validationErrors.address.city}
                            helperText={
                              validationErrors.address.city ||
                              (companyData.address.zipCode &&
                              companyData.address.zipCode.length === 6 &&
                              companyData.address.city
                                ? "✓ City auto-filled from pincode"
                                : "Enter 6-digit pincode first for auto-fill")
                            }
                            disabled={loading}
                            size={isMobile ? "small" : "medium"}
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <StyledTextField
                            required
                            fullWidth
                            id="state"
                            label="State"
                            name="address.state"
                            value={companyData.address.state}
                            onChange={handleCompanyChange}
                            error={!!validationErrors.address.state}
                            helperText={
                              validationErrors.address.state ||
                              (companyData.address.zipCode &&
                              companyData.address.zipCode.length === 6 &&
                              companyData.address.state
                                ? "✓ State auto-filled from pincode"
                                : "Enter 6-digit pincode first for auto-fill")
                            }
                            disabled={loading}
                            size={isMobile ? "small" : "medium"}
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <StyledTextField
                            required
                            fullWidth
                            id="country"
                            label="Country"
                            name="address.country"
                            value={companyData.address.country}
                            onChange={handleCompanyChange}
                            error={!!validationErrors.address.country}
                            helperText={
                              validationErrors.address.country ||
                              (companyData.address.country === "India"
                                ? "✓ Auto-set to India based on pincode"
                                : "Country (India auto-detected from pincode)")
                            }
                            disabled={loading}
                            size={isMobile ? "small" : "medium"}
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <StyledTextField
                            required
                            fullWidth
                            id="zipCode"
                            label="Zip Code / PIN Code"
                            name="address.zipCode"
                            value={companyData.address.zipCode}
                            onChange={handleCompanyChange}
                            error={!!validationErrors.address.zipCode}
                            helperText={
                              validationErrors.address.zipCode ||
                              "6-digit Indian PIN code (auto-fills city & state)"
                            }
                            disabled={loading}
                            size={isMobile ? "small" : "medium"}
                            inputProps={{
                              maxLength: 6,
                              pattern: "[0-9]*",
                              placeholder: "e.g., 110001",
                            }}
                          />
                        </Grid>
                      </Grid>
                    </motion.div>
                  )}

                  {activeStep === 1 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                    >
                      {/* Admin Account Step */}
                      <Typography
                        variant="h6"
                        sx={{
                          mb: isMobile ? 2 : 3,
                          color: "#333333",
                          fontWeight: 600,
                          fontSize: {
                            xs: "1.1rem",
                            sm: "1.25rem",
                            md: "1.5rem",
                          },
                          textAlign: "center",
                        }}
                      >
                        Admin Account Details
                      </Typography>

                      <Grid container spacing={isMobile ? 2 : 3}>
                        <Grid item xs={12} md={6}>
                          <StyledTextField
                            required
                            fullWidth
                            id="firstName"
                            label="First Name"
                            name="firstName"
                            value={adminData.firstName}
                            onChange={handleAdminChange}
                            error={!!adminValidationErrors.firstName}
                            helperText={
                              adminValidationErrors.firstName ||
                              "Only letters and spaces allowed"
                            }
                            disabled={loading}
                            size={isMobile ? "small" : "medium"}
                            inputProps={{
                              pattern: "[a-zA-Z\\s]*",
                              title: "Only letters and spaces are allowed",
                            }}
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <StyledTextField
                            fullWidth
                            id="middleName"
                            label="Middle Name (Optional)"
                            name="middleName"
                            value={adminData.middleName}
                            onChange={handleAdminChange}
                            error={!!adminValidationErrors.middleName}
                            helperText={
                              adminValidationErrors.middleName ||
                              "Only letters and spaces allowed"
                            }
                            disabled={loading}
                            size={isMobile ? "small" : "medium"}
                            inputProps={{
                              pattern: "[a-zA-Z\\s]*",
                              title: "Only letters and spaces are allowed",
                            }}
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <StyledTextField
                            required
                            fullWidth
                            id="lastName"
                            label="Last Name"
                            name="lastName"
                            value={adminData.lastName}
                            onChange={handleAdminChange}
                            error={!!adminValidationErrors.lastName}
                            helperText={
                              adminValidationErrors.lastName ||
                              "Only letters and spaces allowed"
                            }
                            disabled={loading}
                            size={isMobile ? "small" : "medium"}
                            inputProps={{
                              pattern: "[a-zA-Z\\s]*",
                              title: "Only letters and spaces are allowed",
                            }}
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <StyledTextField
                            required
                            fullWidth
                            id="email"
                            label="Email Address"
                            name="email"
                            type="email"
                            value={adminData.email}
                            onChange={handleAdminChange}
                            error={!!adminValidationErrors.email}
                            helperText={adminValidationErrors.email}
                            disabled={loading}
                            size={isMobile ? "small" : "medium"}
                            inputProps={{
                              style: { textTransform: "lowercase" },
                            }}
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <StyledTextField
                            required
                            fullWidth
                            id="password"
                            label="Password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            value={adminData.password}
                            onChange={handleAdminChange}
                            error={!!adminValidationErrors.password}
                            helperText={
                              adminValidationErrors.password ||
                              "Min 8 chars with uppercase, lowercase, number & special char"
                            }
                            disabled={loading}
                            size={isMobile ? "small" : "medium"}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    onClick={() =>
                                      togglePasswordVisibility("password")
                                    }
                                    edge="end"
                                    aria-label="toggle password visibility"
                                    sx={{
                                      color: "#666666",
                                      "&:hover": {
                                        color: "#333333",
                                        backgroundColor:
                                          "rgba(255, 255, 255, 0.08)",
                                      },
                                    }}
                                    size={isMobile ? "small" : "medium"}
                                    disabled={loading}
                                    type="button"
                                  >
                                    {showPassword ? (
                                      <FaEyeSlash size={getIconSize()} />
                                    ) : (
                                      <FaEye size={getIconSize()} />
                                    )}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <StyledTextField
                            required
                            fullWidth
                            id="confirmPassword"
                            label="Confirm Password"
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={adminData.confirmPassword}
                            onChange={handleAdminChange}
                            error={!!adminValidationErrors.confirmPassword}
                            helperText={adminValidationErrors.confirmPassword}
                            disabled={loading}
                            size={isMobile ? "small" : "medium"}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    onClick={() =>
                                      togglePasswordVisibility(
                                        "confirmPassword"
                                      )
                                    }
                                    edge="end"
                                    aria-label="toggle confirm password visibility"
                                    sx={{
                                      color: "#666666",
                                      "&:hover": {
                                        color: "#333333",
                                        backgroundColor:
                                          "rgba(255, 255, 255, 0.08)",
                                      },
                                    }}
                                    size={isMobile ? "small" : "medium"}
                                    disabled={loading}
                                    type="button"
                                  >
                                    {showConfirmPassword ? (
                                      <FaEyeSlash size={getIconSize()} />
                                    ) : (
                                      <FaEye size={getIconSize()} />
                                    )}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>
                      </Grid>

                      {/* Password Requirements Info */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                      >
                        <Box
                          sx={{
                            mt: isMobile ? 2 : 3,
                            p: isMobile ? 1.5 : 2,
                            backgroundColor: "rgba(74, 144, 226, 0.1)",
                            borderRadius: isMobile ? "8px" : "10px",
                            border: "1px solid rgba(74, 144, 226, 0.2)",
                            transition: "all 0.3s ease",
                            "&:hover": {
                              backgroundColor: "rgba(74, 144, 226, 0.15)",
                              borderColor: "rgba(74, 144, 226, 0.3)",
                            },
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#333333",
                              fontSize: {
                                xs: "0.7rem",
                                sm: "0.75rem",
                                md: "0.8rem",
                              },
                              display: "block",
                              textAlign: "center",
                              lineHeight: 1.4,
                              fontWeight: 500,
                            }}
                          >
                            🔒 <strong>Password Requirements:</strong> Your
                            password must contain at least 8 characters
                            including uppercase letters, lowercase letters,
                            numbers, and special characters (@$!%*?&).
                          </Typography>
                        </Box>
                      </motion.div>
                    </motion.div>
                  )}

                  {activeStep === 2 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                    >
                      {/* Email Verification Step */}
                      <Typography
                        variant="h6"
                        sx={{
                          mb: isMobile ? 2 : 3,
                          color: "#333333",
                          fontWeight: 600,
                          fontSize: {
                            xs: "1.1rem",
                            sm: "1.25rem",
                            md: "1.5rem",
                          },
                          textAlign: "center",
                        }}
                      >
                        Verify Your Email
                      </Typography>

                      {registrationData && (
                        <Typography
                          variant="body1"
                          sx={{
                            mb: 3,
                            color: "#333333",
                            fontSize: isMobile ? "0.9rem" : "1rem",
                            textAlign: "center",
                            maxWidth: "90%",
                            mx: "auto",
                          }}
                        >
                          {registrationData.message}
                        </Typography>
                      )}

                      {/* Admin Email OTP Section */}
                      <Box sx={{ mb: 4 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            mb: 2,
                            color: "#333333",
                            fontSize: isMobile ? "0.9rem" : "1rem",
                            textAlign: "center",
                            fontWeight: 600,
                          }}
                        >
                          Admin Email OTP:{" "}
                          <strong>{registrationData?.adminEmail}</strong>
                        </Typography>

                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            gap: isMobile ? "6px" : "8px",
                            mb: 2,
                          }}
                        >
                          {adminOtp.map((digit, index) => (
                            <TextField
                              key={index}
                              inputRef={(el) =>
                                (adminInputRefs.current[index] = el)
                              }
                              variant="outlined"
                              value={digit}
                              onChange={(e) =>
                                handleAdminOtpChange(index, e.target.value)
                              }
                              onKeyDown={(e) => handleAdminKeyDown(index, e)}
                              onPaste={handleAdminOtpPaste}
                              inputProps={{
                                maxLength: 1,
                                inputMode: "numeric",
                                pattern: "[0-9]*",
                                style: {
                                  textAlign: "center",
                                  fontSize: isMobile ? "1.2rem" : "1.5rem",
                                  padding: isMobile ? "8px 0" : "12px 0",
                                  color: "#333333",
                                },
                              }}
                              disabled={loading}
                              autoFocus={index === 0}
                              size={isMobile ? "small" : "medium"}
                              sx={{
                                width: isMobile ? "40px" : "50px",
                                "& .MuiOutlinedInput-root": {
                                  backgroundColor: "#ffffff",
                                  borderRadius: "8px",
                                  "& fieldset": {
                                    borderColor: "#cccccc",
                                  },
                                  "&:hover fieldset": {
                                    borderColor: "#999999",
                                  },
                                  "&.Mui-focused fieldset": {
                                    borderColor: "#4a90e2",
                                    borderWidth: "2px",
                                  },
                                },
                              }}
                            />
                          ))}
                        </Box>
                      </Box>

                      {/* Contact Email OTP Section - Only show if different from admin email */}
                      {registrationData?.requiresContactEmailVerification && (
                        <Box sx={{ mb: 4 }}>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              mb: 2,
                              color: "#333333",
                              fontSize: isMobile ? "0.9rem" : "1rem",
                              textAlign: "center",
                              fontWeight: 600,
                            }}
                          >
                            Contact Email OTP:{" "}
                            <strong>{registrationData?.contactEmail}</strong>
                          </Typography>

                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "center",
                              gap: isMobile ? "6px" : "8px",
                              mb: 2,
                            }}
                          >
                            {contactOtp.map((digit, index) => (
                              <TextField
                                key={index}
                                inputRef={(el) =>
                                  (contactInputRefs.current[index] = el)
                                }
                                variant="outlined"
                                value={digit}
                                onChange={(e) =>
                                  handleContactOtpChange(index, e.target.value)
                                }
                                onKeyDown={(e) =>
                                  handleContactKeyDown(index, e)
                                }
                                onPaste={handleContactOtpPaste}
                                inputProps={{
                                  maxLength: 1,
                                  inputMode: "numeric",
                                  pattern: "[0-9]*",
                                  style: {
                                    textAlign: "center",
                                    fontSize: isMobile ? "1.2rem" : "1.5rem",
                                    padding: isMobile ? "8px 0" : "12px 0",
                                    color: "white",
                                  },
                                }}
                                disabled={loading}
                                size={isMobile ? "small" : "medium"}
                                sx={{
                                  width: isMobile ? "40px" : "50px",
                                  "& .MuiOutlinedInput-root": {
                                    backgroundColor: "#ffffff",
                                    borderRadius: "8px",
                                    "& fieldset": {
                                      borderColor: "#cccccc",
                                    },
                                    "&:hover fieldset": {
                                      borderColor: "#999999",
                                    },
                                    "&.Mui-focused fieldset": {
                                      borderColor: "#4a90e2",
                                      borderWidth: "2px",
                                    },
                                  },
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                      )}

                      {/* Verify Button */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 2,
                        }}
                      >
                        <StyledButton
                          onClick={handleVerifyOtp}
                          disabled={
                            loading ||
                            adminOtp.join("").length !== 6 ||
                            (registrationData?.requiresContactEmailVerification &&
                              contactOtp.join("").length !== 6)
                          }
                          sx={{
                            width: "100%",
                            maxWidth: "300px",
                            py: isMobile ? 1.2 : 1.5,
                            fontSize: isMobile ? "0.9rem" : "1rem",
                            position: "relative",
                          }}
                        >
                          {loading ? (
                            <>
                              <CircularProgress
                                size={24}
                                sx={{
                                  color: "#4a90e2",
                                  position: "absolute",
                                  left: "calc(50% - 12px)",
                                  top: "calc(50% - 12px)",
                                }}
                              />
                              <span style={{ visibility: "hidden" }}>
                                Verify Email
                              </span>
                            </>
                          ) : (
                            "Verify Email"
                          )}
                        </StyledButton>

                        {/* Resend OTP */}
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              mb: 1,
                              color: "#666666",
                              fontSize: isMobile ? "0.85rem" : "0.9rem",
                            }}
                          >
                            Didn't receive the code?
                          </Typography>

                          <Button
                            variant="text"
                            onClick={handleResendOtp}
                            disabled={loading || resendDisabled}
                            sx={{
                              textTransform: "none",
                              fontSize: isMobile ? "0.85rem" : "0.9rem",
                              fontWeight: 500,
                              color: "#4a90e2",
                              "&:hover": {
                                backgroundColor: "rgba(74, 144, 226, 0.08)",
                              },
                            }}
                          >
                            {resendDisabled
                              ? `Resend code in ${timeLeft} seconds`
                              : "Resend verification code"}
                          </Button>
                        </Box>
                      </Box>
                    </motion.div>
                  )}

                  {activeStep === 3 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                    >
                      {/* Payment Step */}
                      <Typography
                        variant="h6"
                        sx={{
                          mb: isMobile ? 2 : 3,
                          color: "white",
                          fontWeight: 600,
                          fontSize: {
                            xs: "1.1rem",
                            sm: "1.25rem",
                            md: "1.5rem",
                          },
                          textAlign: "center",
                        }}
                      >
                        Complete Payment
                      </Typography>

                      <Typography
                        variant="body1"
                        sx={{
                          mb: 3,
                          color: "rgba(255, 255, 255, 0.9)",
                          fontSize: isMobile ? "0.9rem" : "1rem",
                          textAlign: "center",
                          maxWidth: "90%",
                          mx: "auto",
                        }}
                      >
                        Complete your registration by paying the one-time setup
                        fee of ₹20,000
                      </Typography>

                      {/* Payment Gateway will be shown in modal */}
                      <Box sx={{ textAlign: "center", mt: 4 }}>
                        {!paymentCompleted ? (
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#555555",
                              fontSize: isMobile ? "0.8rem" : "0.9rem",
                            }}
                          >
                            Click the "Proceed to Payment" button to complete
                            your registration
                          </Typography>
                        ) : (
                          <Box
                            sx={{
                              p: 3,
                              backgroundColor: "rgba(76, 175, 80, 0.2)",
                              borderRadius: "12px",
                              border: "1px solid rgba(76, 175, 80, 0.3)",
                            }}
                          >
                            <Typography
                              variant="h6"
                              sx={{
                                color: "#4caf50",
                                mb: 1,
                                fontWeight: 600,
                              }}
                            >
                              ✅ Payment Successful!
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "#333333",
                              }}
                            >
                              Your registration is complete. You will be
                              redirected to the login page.
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </motion.div>
                  )}

                  {/* Navigation Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: isMobile ? "column" : "row",
                        justifyContent: "space-between",
                        alignItems: isMobile ? "stretch" : "center",
                        mt: isMobile ? 3 : 4,
                        gap: isMobile ? 2 : 0,
                      }}
                    >
                      {activeStep !== 0 && (
                        <motion.div
                          whileHover={{
                            scale: loading ? 1 : isMobile ? 1.02 : 1.05,
                          }}
                          whileTap={{
                            scale: loading ? 1 : isMobile ? 0.98 : 0.95,
                          }}
                          style={{
                            width: isMobile ? "100%" : "auto",
                            order: isMobile ? 2 : 1,
                          }}
                        >
                          <Button
                            onClick={handleBack}
                            disabled={loading}
                            variant="outlined"
                            sx={{
                              borderRadius: isMobile ? "8px" : "10px",
                              textTransform: "none",
                              fontWeight: 600,
                              fontSize: {
                                xs: "0.85rem",
                                sm: "0.9rem",
                                md: "1rem",
                              },
                              padding: {
                                xs: "10px 20px",
                                sm: "12px 24px",
                                md: "14px 28px",
                              },
                              borderColor: "#cccccc",
                              color: "#333333",
                              "&:hover": {
                                backgroundColor: "rgba(74, 144, 226, 0.08)",
                                borderColor: "#999999",
                              },
                              width: isMobile ? "100%" : "auto",
                              minWidth: isMobile ? "auto" : "120px",
                            }}
                          >
                            Back
                          </Button>
                        </motion.div>
                      )}

                      <motion.div
                        whileHover={{
                          scale: loading ? 1 : isMobile ? 1.02 : 1.05,
                        }}
                        whileTap={{
                          scale: loading ? 1 : isMobile ? 0.98 : 0.95,
                        }}
                        style={{
                          width: isMobile ? "100%" : "auto",
                          order: isMobile ? 1 : 2,
                        }}
                      >
                        {activeStep === 2 ? (
                          // On the OTP step, show Verify Email button
                          <StyledButton
                            onClick={handleVerifyOtp}
                            variant="contained"
                            disabled={loading}
                            sx={{
                              fontSize: {
                                xs: "0.85rem",
                                sm: "0.9rem",
                                md: "1rem",
                              },
                              padding: {
                                xs: "12px 24px",
                                sm: "14px 28px",
                                md: "16px 32px",
                              },
                              width: isMobile ? "100%" : "auto",
                              minWidth: isMobile ? "auto" : "120px",
                            }}
                          >
                            {loading ? (
                              <CircularProgress size={20} color="inherit" />
                            ) : (
                              "Verify Email"
                            )}
                          </StyledButton>
                        ) : activeStep === 3 ? (
                          // On the payment step, show Proceed to Payment button
                          !paymentCompleted ? (
                            <StyledButton
                              onClick={() => setShowPaymentGateway(true)}
                              variant="contained"
                              disabled={loading}
                              sx={{
                                fontSize: {
                                  xs: "0.85rem",
                                  sm: "0.9rem",
                                  md: "1rem",
                                },
                                padding: {
                                  xs: "12px 24px",
                                  sm: "14px 28px",
                                  md: "16px 32px",
                                },
                                width: isMobile ? "100%" : "auto",
                                minWidth: isMobile ? "auto" : "140px",
                              }}
                            >
                              Proceed to Payment
                            </StyledButton>
                          ) : null
                        ) : (
                          // For other steps, show Next button
                          <StyledButton
                            onClick={handleNext}
                            variant="contained"
                            disabled={loading}
                            sx={{
                              fontSize: {
                                xs: "0.85rem",
                                sm: "0.9rem",
                                md: "1rem",
                              },
                              padding: {
                                xs: "12px 24px",
                                sm: "14px 28px",
                                md: "16px 32px",
                              },
                              width: isMobile ? "100%" : "auto",
                              minWidth: isMobile ? "auto" : "120px",
                            }}
                          >
                            {activeStep === 1 ? "Register Company" : "Next"}
                          </StyledButton>
                        )}
                      </motion.div>
                    </Box>
                  </motion.div>

                  {/* Additional Information */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                  >
                    <Box
                      sx={{
                        mt: isMobile ? 3 : 4,
                        textAlign: "center",
                        px: isMobile ? 1 : 0,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: "rgba(255, 255, 255, 0.7)",
                          fontSize: {
                            xs: "0.75rem",
                            sm: "0.8rem",
                            md: "0.85rem",
                          },
                          lineHeight: {
                            xs: 1.3,
                            sm: 1.4,
                            md: 1.5,
                          },
                          maxWidth: isMobile
                            ? "100%"
                            : isTablet
                            ? "90%"
                            : "85%",
                          mx: "auto",
                        }}
                      >
                        By registering your company, you agree to our Terms of
                        Service and Privacy Policy.
                        {!isMobile && <br />}
                        {isMobile ? " " : ""}A verification email will be sent
                        to the admin email address.
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          mt: isMobile ? 1.5 : 2,
                          color: "#888888",
                          fontSize: {
                            xs: "0.7rem",
                            sm: "0.75rem",
                            md: "0.8rem",
                          },
                          "& a": {
                            color: "#4a90e2",
                            textDecoration: "none",
                            fontWeight: 500,
                            "&:hover": {
                              textDecoration: "underline",
                            },
                          },
                        }}
                      >
                        Already have an account?{" "}
                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          style={{ display: "inline-block" }}
                        >
                          <Button
                            variant="text"
                            onClick={() => navigate("/login")}
                            sx={{
                              color: "#4a90e2",
                              textTransform: "none",
                              fontSize: "inherit",
                              fontWeight: 500,
                              padding: "2px 4px",
                              minWidth: "auto",
                              "&:hover": {
                                backgroundColor: "rgba(74, 144, 226, 0.08)",
                              },
                            }}
                          >
                            Sign in here
                          </Button>
                        </motion.span>
                      </Typography>
                    </Box>
                  </motion.div>

                  {/* Security and Trust Indicators for larger screens */}
                  {(isTablet || isDesktop) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9, duration: 0.5 }}
                    >
                      <Box
                        sx={{
                          mt: 4,
                          p: 2.5,
                          backgroundColor: "rgba(76, 175, 80, 0.1)",
                          borderRadius: "12px",
                          border: "1px solid rgba(76, 175, 80, 0.2)",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            backgroundColor: "rgba(76, 175, 80, 0.15)",
                            borderColor: "rgba(76, 175, 80, 0.3)",
                          },
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#333333",
                            fontSize: {
                              sm: "0.75rem",
                              md: "0.8rem",
                              lg: "0.85rem",
                            },
                            display: "block",
                            textAlign: "center",
                            lineHeight: 1.4,
                            fontWeight: 500,
                          }}
                        >
                          🛡️ <strong>Secure Registration:</strong> Your data is
                          encrypted and protected. We follow industry-standard
                          security practices to keep your company information
                          safe.
                        </Typography>
                      </Box>
                    </motion.div>
                  )}
                </Box>
              </RegisterPaper>
            </RegisterContent>
          </Container>
        </CenteredContainer>

        {/* Payment Gateway Modal */}
        <PaymentGateway
          open={showPaymentGateway}
          onClose={handlePaymentClose}
          companyCode={registrationData?.companyCode}
          adminEmail={registrationData?.adminEmail}
          companyName={companyData?.name}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentFailure={handlePaymentFailure}
        />
      </RegisterWrapper>
    </ThemeProvider>
  );
};

export default RegisterCompanyPage;
