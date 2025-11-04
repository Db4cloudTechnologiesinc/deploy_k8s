import { useState, useEffect } from "react";
import {
  TextField,
  Paper,
  FormControl,
  Button,
  Typography,
  Grid,
  Select,
  MenuItem,
  InputLabel,
  FormHelperText,
  CircularProgress,
  Alert,
} from "@mui/material";

import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import api from "../api/axiosInstance";
import { toast } from "react-toastify";
import { toISODate, fromISODate, monthNames as monthNamesUtil } from '../utils/dateFormatter';

const getUserIdFromToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    const payload = JSON.parse(jsonPayload);
    return payload.userId;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

const PersonalInformationForm = ({
  nextStep,
  setEmployeeId,
  onSave,
  userEmail,
  userId,
  savedData,
}) => {
  const [userID, setUserId] = useState(userEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [userData, setUserData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: userEmail || "",
    workemail: "",
  });

  const [isFormLocked, setIsFormLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState("");

  const userIdentifier =
    userId || userID || getUserIdFromToken() || localStorage.getItem("userId");

  useEffect(() => {
    const fetchUserData = async () => {
      if (userEmail) {
        try {
          const userIdResponse = await api.post("auth/get-user-id", {
            email: userEmail,
          });

          if (userIdResponse.data.success) {
            setUserId(userIdResponse.data.userId);

            try {
              const existingEmployeeResponse = await api.get(
                `employees/by-user/${userIdResponse.data.userId}`
              );

              if (existingEmployeeResponse.data.success) {
                setIsFormLocked(true);
                setLockMessage(
                  "You have already completed the onboarding form. Each user can only fill the form once."
                );
                toast.warning(
                  "Onboarding form already completed for this account."
                );
                return;
              }
            } catch (employeeError) {
              if (employeeError.response?.status !== 404) {
                console.error(
                  "Error checking existing employee:",
                  employeeError
                );
              }
            }

            const userDetailsResponse = await api.get(
              `auth/user/${userIdResponse.data.userId}`
            );

            if (userDetailsResponse.data.success) {
              const user = userDetailsResponse.data.user;
              setUserData({
                firstName: user.firstName || "",
                middleName: user.middleName || "",
                lastName: user.lastName || "",
                email: user.email || userEmail,
                workemail: user.workemail || "",
              });
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          toast.error("Could not retrieve user information. Please try again.");
        }
      }
    };

    fetchUserData();
  }, [userEmail]);

  const validationSchema = Yup.object().shape({
    firstName: Yup.string()
      .matches(/^[A-Za-z\s]+$/, "First name should only contain alphabets")
      .required("First name is required"),
    middleName: Yup.string().matches(
      /^[A-Za-z\s]*$/,
      "Middle name should only contain alphabets"
    ),
    lastName: Yup.string()
      .matches(/^[A-Za-z\s]+$/, "Last name should only contain alphabets")
      .required("Last name is required"),
    dob: Yup.string()
      .required("Date of birth is required")
      .test('age-18', 'Employee must be at least 18 years old', function(value) {
        if (!value) return false;
        const [y, m, d] = value.split('-').map(Number);
        if (!y || !m || !d) return false;
        const eighteenthBirthday = Date.UTC(y + 18, m - 1, d);
        return Date.now() >= eighteenthBirthday;
      }),
    gender: Yup.string().required("Gender is required"),
    maritalStatus: Yup.string().required("Marital status is required"),
    bloodGroup: Yup.string().required("Blood group is required"),
    nationality: Yup.string()
      .matches(/^[A-Za-z\s]+$/, "Nationality should only contain alphabets")
      .required("Nationality is required"),
    aadharNumber: Yup.string()
      .matches(/^[0-9]{12}$/, "Aadhar number must be exactly 12 digits")
      .test(
        "unique-aadhar",
        "This Aadhar number is already registered",
        function (value) {
          return true;
        }
      )
      .required("Aadhar number is required"),
    panNumber: Yup.string()
      .matches(
        /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
        "PAN format: ABCDE1234F (5 letters, 4 numbers, 1 letter)"
      )
      .test(
        "unique-pan",
        "This PAN number is already registered",
        function (value) {
          return true;
        }
      )
      .required("PAN number is required"),
    mobileNumber: Yup.string()
      .matches(/^[0-9]{10}$/, "Mobile number must be exactly 10 digits")
      .test(
        "unique-mobile",
        "This mobile number is already registered",
        function (value) {
          return true;
        }
      )
      .required("Mobile number is required"),
    email: Yup.string()
      .email("Please enter a valid email address")
      .required("Personal email is required")
      .trim(),
    workemail: Yup.string()
      .email("Please enter a valid work email address")
      .required("Work email is required")
      .test(
        "different-from-personal",
        "Work email should be different from personal email",
        function (value) {
          return value !== this.parent.email;
        }
      )
      .trim(),
    prefix: Yup.string().required("Prefix is required"),
    employeeImage: Yup.mixed().required("Profile photo is required"),
    dobDay: Yup.number().required("Day is required"),
    dobMonth: Yup.string().required("Month is required"),
    dobYear: Yup.number().required("Year is required"),
  });

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const prefixOptions = [
    { value: "Mr.", gender: "Male" },
    { value: "Ms.", gender: "Female" },
    { value: "Dr.", gender: "Null" },
  ];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const [personalInfo, setPersonalInfo] = useState({
    prefix: "",
    firstName: "",
    lastName: "",
    dob: "",
    gender: "",
    maritalStatus: "",
    bloodGroup: "",
    nationality: "",
    aadharNumber: "",
    panNumber: "",
    mobileNumber: "",
    email: "",
    workemail: "",
  });

  const [imageFile, setImageFile] = useState(null);

  const genderOptions = {
    "Mr.": ["Male"],
    "Ms.": ["Female"],
    "Dr.": ["Male", "Female", "Other"],
  };

  const maritalStatusOptions = ["Single", "Married", "Divorced", "Widowed"];

  // Parse dob from savedData if available
  const parseDob = (dobString) => {
    if (!dobString) return { year: '', month: '', day: '' };
    const parsed = fromISODate(dobString);
    return parsed;
  };

  const savedDobParts = savedData?.dob ? parseDob(savedData.dob) : { year: '', month: '', day: '' };

  const initialValues = {
    prefix: savedData?.prefix || "",
    firstName: savedData?.firstName || userData.firstName || "",
    middleName: savedData?.middleName || userData.middleName || "",
    lastName: savedData?.lastName || userData.lastName || "",
    dob: savedData?.dob ? (typeof savedData.dob === 'string' ? savedData.dob.slice(0, 10) : '') : '',
    dobDay: savedData?.dobDay || savedDobParts.day || '',
    dobMonth: savedData?.dobMonth || savedDobParts.month || '',
    dobYear: savedData?.dobYear || savedDobParts.year || '',
    gender: savedData?.gender || "",
    maritalStatus: savedData?.maritalStatus || "",
    bloodGroup: savedData?.bloodGroup || "",
    nationality: savedData?.nationality || "",
    aadharNumber: savedData?.aadharNumber || "",
    panNumber: savedData?.panNumber || "",
    mobileNumber: savedData?.mobileNumber || "",
    email: savedData?.email || userData.email || userEmail || "",
    workemail: savedData?.workemail || userData.workemail || "",
    employeeImage: savedData?.employeeImage || null,
  };

  const handleSave = async (values, { setSubmitting, setErrors }) => {
    try {
      setIsSubmitting(true);
      setFormError("");

      const userIdentifier = userId || userID || localStorage.getItem("userId");

      if (!userIdentifier) {
        if (userEmail) {
          try {
            const response = await api.post("auth/get-user-id", {
              email: userEmail,
            });

            if (response.data.success) {
              const fetchedUserId = response.data.userId;
              localStorage.setItem("userId", fetchedUserId);
              await submitFormWithUserId(fetchedUserId, values, setErrors);
              return;
            }
          } catch (error) {
            console.error("Error fetching user ID:", error);
          }
        }

        setFormError("User ID not found. Please log in again.");
        toast.error("User ID not found. Please log in again.");
        setIsSubmitting(false);
        return;
      }

      await submitFormWithUserId(userIdentifier, values, setErrors);
    } catch (error) {
      console.error(
        "Error saving personal info:",
        error.response?.data || error.message
      );

      if (error.response?.data?.error?.includes("duplicate key error")) {
        if (error.response.data.error.includes("aadharNumber")) {
          setErrors({
            aadharNumber: "This Aadhar number is already registered",
          });
          toast.error("This Aadhar number is already registered");
        } else if (error.response.data.error.includes("panNumber")) {
          setErrors({ panNumber: "This PAN number is already registered" });
          toast.error("This PAN number is already registered");
        } else if (error.response.data.error.includes("email")) {
          setErrors({ email: "This email is already registered" });
          toast.error("This email is already registered");
        } else {
          setFormError(
            "A duplicate entry was detected. Please check your information."
          );
          toast.error(
            "A duplicate entry was detected. Please check your information."
          );
        }
      } else if (error.response?.data?.error?.includes("userId")) {
        setFormError("User ID is required. Please log in again.");
        toast.error("User ID is required. Please log in again.");
      } else {
        setFormError("Error saving personal information. Please try again.");
        toast.error("Error saving personal information. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
      setSubmitting(false);
    }
  };

  const submitFormWithUserId = async (userIdentifier, values, setErrors) => {
    const personalInfoData = {
      prefix: values.prefix,
      firstName: values.firstName,
      middleName: values.middleName,
      lastName: values.lastName,
      dob: values.dob,
      gender: values.gender,
      maritalStatus: values.maritalStatus,
      bloodGroup: values.bloodGroup,
      nationality: values.nationality,
      aadharNumber: values.aadharNumber || undefined,
      panNumber: values.panNumber || undefined,
      mobileNumber: values.mobileNumber,
      email: values.email || undefined,
      workemail: values.workemail || undefined,
    };

    const formData = new FormData();

    formData.append(
      "formData",
      JSON.stringify({
        userId: userIdentifier,
        personalInfo: personalInfoData,
      })
    );

    if (values.employeeImage) {
      formData.append("employeeImage", values.employeeImage);
    }

    const response = await api.post("employees/personal-info", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (response.data.success) {
      onSave(response.data.employeeId);
      nextStep();
      toast.success("Personal information saved successfully");
    }
  };

  const handleError = (error) => {
    if (error?.details) {
      error.details.forEach((detail) => {
        const fieldMatch = detail.match(/Path `(.+)` is required/);
        if (fieldMatch) {
          const field = fieldMatch[1];
          const fieldMessages = {
            "personalInfo.prefix": "Title/Prefix",
            "personalInfo.firstName": "First Name",
            "personalInfo.lastName": "Last Name",
            "personalInfo.dob": "Date of Birth",
            "personalInfo.gender": "Gender",
            "personalInfo.maritalStatus": "Marital Status",
            "personalInfo.bloodGroup": "Blood Group",
            "personalInfo.nationality": "Nationality",
            "personalInfo.aadharNumber": "Aadhar Number",
            "personalInfo.panNumber": "PAN Number",
            "personalInfo.mobileNumber": "Mobile Number",
            "personalInfo.email": "Email Address",
            "personalInfo.workemail": "Work Email Address",
            "personalInfo.employeeImage": "Profile Photo",
          };

          const fieldName = fieldMessages[field] || field;
          toast.error(`${fieldName} is required`);
        } else {
          toast.error(detail);
        }
      });
    } else if (error?.message) {
      switch (error.field) {
        case "email":
          toast.error("This email address is already registered");
          break;
        case "workemail":
          toast.error("This email address is already registered");
          break;
        case "aadharNumber":
          toast.error("This Aadhar number is already in use");
          break;
        case "panNumber":
          toast.error("This PAN number is already registered");
          break;
        case "mobileNumber":
          toast.error("This mobile number is already in use");
          break;
        default:
          toast.error(error.message);
      }
    } else {
      toast.error("Please fill in all required fields correctly");
    }
  };

  const SimpleTextField = ({ field, form, label, ...props }) => {
    const handleChange = (e) => {
      let value = e.target.value;

      // Handle specific field validations
      if (
        field.name === "firstName" ||
        field.name === "middleName" ||
        field.name === "lastName" ||
        field.name === "nationality"
      ) {
        // Only allow alphabets and spaces
        value = value.replace(/[^A-Za-z\s]/g, "");
        const sentenceCaseValue = value
          .split(" ")
          .map(
            (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          )
          .join(" ");
        form.setFieldValue(field.name, sentenceCaseValue);
        return;
      }

      if (field.name === "aadharNumber") {
        // Only allow numbers, max 12 digits
        value = value.replace(/[^0-9]/g, "").slice(0, 12);
        form.setFieldValue(field.name, value);
        return;
      }

      if (field.name === "mobileNumber") {
        // Only allow numbers, max 10 digits
        value = value.replace(/[^0-9]/g, "").slice(0, 10);
        form.setFieldValue(field.name, value);
        return;
      }

      if (field.name === "panNumber") {
        // PAN format validation
        value = value
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
          .slice(0, 10);
        form.setFieldValue(field.name, value);
        return;
      }

      if (field.name === "email" || field.name === "workemail") {
        // Convert email to lowercase
        const lowercaseEmail = value.toLowerCase();
        form.setFieldValue(field.name, lowercaseEmail);
        return;
      }

      // Default handling for other fields
      const sentenceCaseValue = value
        .split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");
      form.setFieldValue(field.name, sentenceCaseValue);
    };

    const hasError = form.errors[field.name] && (form.touched[field.name] || form.values[field.name]);

    return (
      <TextField
        {...field}
        {...props}
        label={label}
        onChange={handleChange}
        error={hasError}
        helperText={hasError ? form.errors[field.name] : ""}
        fullWidth
      />
    );
  };

  // Check if form is locked
  if (isFormLocked) {
    return (
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {lockMessage}
        </Alert>
        <Typography variant="h5" gutterBottom color="primary">
          Personal Information Form Locked
        </Typography>
      </Paper>
    );
  }

  return (
    <Formik
      initialValues={{
        ...initialValues,
        email: userEmail || initialValues.email,
      }}
      validationSchema={validationSchema}
      onSubmit={handleSave}
      enableReinitialize={true}
    >
      {({ errors, touched, setFieldValue, values, isValid, dirty }) => (
        <Form>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom color="primary">
              Personal Information
            </Typography>

            {formError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {formError}
              </Alert>
            )}

            <Grid container spacing={3}>
              {/* Name fields */}
              <Grid item container spacing={2}>
                <Grid item xs={12} sm={2}>
                  <FormControl
                    fullWidth
                    error={errors.prefix && (touched.prefix || values.prefix)}
                  >
                    <InputLabel>Title*</InputLabel>
                    <Field name="prefix">
                      {({ field, form }) => (
                        <Select
                          {...field}
                          label="Title"
                          onChange={(e) => {
                            const selectedPrefix = prefixOptions.find(
                              (p) => p.value === e.target.value
                            );
                            form.setFieldValue("prefix", e.target.value);
                            if (
                              selectedPrefix &&
                              selectedPrefix.gender !== "Null"
                            ) {
                              form.setFieldValue(
                                "gender",
                                selectedPrefix.gender
                              );
                            }
                          }}
                        >
                          <MenuItem value="">Select Title</MenuItem>
                          {prefixOptions.map((prefix) => (
                            <MenuItem key={prefix.value} value={prefix.value}>
                              {prefix.value}
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    </Field>
                    {errors.prefix && (touched.prefix || values.prefix) && (
                      <FormHelperText>{errors.prefix}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={3}>
                  <Field
                    name="firstName"
                    component={SimpleTextField}
                    label="First Name*"
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={3}>
                  <Field
                    name="middleName"
                    component={SimpleTextField}
                    label="Middle Name"
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Field
                    name="lastName"
                    component={SimpleTextField}
                    label="Last Name*"
                    required
                  />
                </Grid>
              </Grid>

              {/* Date of Birth */}
              <Grid item xs={12}>
                <Typography
                  variant="body1"
                  gutterBottom
                  sx={{ fontWeight: "600", color: "#333" }}
                >
                  Date of Birth*
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <FormControl
                      fullWidth
                      error={errors.dobDay && (touched.dobDay || values.dobDay)}
                    >
                      <InputLabel>Day*</InputLabel>
                      <Field name="dobDay">
                        {({ field, form }) => (
                          <Select
                            {...field}
                            label="Day"
                            sx={{
                              borderRadius: "8px",
                              backgroundColor: "#ffffff",
                              color: "#1a1a1a",
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderRadius: "8px",
                              },
                              "& .MuiSelect-select": {
                                color: "#1a1a1a !important",
                                fontWeight: "500",
                              },
                            }}
                            onChange={(e) => {
                              form.setFieldValue("dobDay", e.target.value);
                              const isoDate = toISODate(
                                form.values.dobYear,
                                form.values.dobMonth,
                                e.target.value
                              );
                              form.setFieldValue("dob", isoDate);
                            }}
                          >
                            <MenuItem value="">Select Day</MenuItem>
                            {days.map((day) => (
                              <MenuItem key={day} value={day}>
                                {day}
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      </Field>
                      {errors.dobDay && (touched.dobDay || values.dobDay) && (
                        <FormHelperText>{errors.dobDay}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <FormControl
                      fullWidth
                      error={errors.dobMonth && (touched.dobMonth || values.dobMonth)}
                    >
                      <InputLabel>Month*</InputLabel>
                      <Field name="dobMonth">
                        {({ field, form }) => (
                          <Select
                            {...field}
                            label="Month"
                            sx={{
                              borderRadius: "8px",
                              backgroundColor: "#ffffff",
                              color: "#1a1a1a",
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderRadius: "8px",
                              },
                              "& .MuiSelect-select": {
                                color: "#1a1a1a !important",
                                fontWeight: "500",
                              },
                            }}
                            onChange={(e) => {
                              form.setFieldValue("dobMonth", e.target.value);
                              const isoDate = toISODate(
                                form.values.dobYear,
                                e.target.value,
                                form.values.dobDay
                              );
                              form.setFieldValue("dob", isoDate);
                            }}
                          >
                            <MenuItem value="">Select Month</MenuItem>
                            {months.map((month) => (
                              <MenuItem key={month} value={month}>
                                {month}
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      </Field>
                      {errors.dobMonth && (touched.dobMonth || values.dobMonth) && (
                        <FormHelperText>{errors.dobMonth}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <FormControl
                      fullWidth
                      error={errors.dobYear && (touched.dobYear || values.dobYear)}
                    >
                      <InputLabel>Year*</InputLabel>
                      <Field name="dobYear">
                        {({ field, form }) => (
                          <Select
                            {...field}
                            label="Year"
                            sx={{
                              borderRadius: "8px",
                              backgroundColor: "#ffffff",
                              color: "#1a1a1a",
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderRadius: "8px",
                              },
                              "& .MuiSelect-select": {
                                color: "#1a1a1a !important",
                                fontWeight: "500",
                              },
                            }}
                            onChange={(e) => {
                              form.setFieldValue("dobYear", e.target.value);
                              const isoDate = toISODate(
                                e.target.value,
                                form.values.dobMonth,
                                form.values.dobDay
                              );
                              form.setFieldValue("dob", isoDate);
                            }}
                          >
                            <MenuItem value="">Select Year</MenuItem>
                            {years.map((year) => (
                              <MenuItem key={year} value={year}>
                                {year}
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      </Field>
                      {errors.dobYear && (touched.dobYear || values.dobYear) && (
                        <FormHelperText>{errors.dobYear}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>

              {/* Gender and Marital Status */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={errors.gender && (touched.gender || values.gender)}>
                  <InputLabel>Gender*</InputLabel>
                  <Field name="gender">
                    {({ field }) => (
                      <Select
                        {...field}
                        label="Gender"
                        sx={{
                          borderRadius: "8px",
                          backgroundColor: "#ffffff",
                          color: "#1a1a1a",
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderRadius: "8px",
                          },
                          "& .MuiSelect-select": {
                            color: "#1a1a1a !important",
                            fontWeight: "500",
                          },
                        }}
                      >
                        <MenuItem value="">Select Gender</MenuItem>
                        {genderOptions[values.prefix]?.map((gender) => (
                          <MenuItem key={gender} value={gender}>
                            {gender}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  </Field>
                  {errors.gender && (touched.gender || values.gender) && (
                    <FormHelperText>{errors.gender}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl
                  fullWidth
                  error={errors.maritalStatus && (touched.maritalStatus || values.maritalStatus)}
                >
                  <InputLabel>Marital Status*</InputLabel>
                  <Field name="maritalStatus">
                    {({ field }) => (
                      <Select
                        {...field}
                        label="Marital Status"
                        sx={{
                          borderRadius: "8px",
                          backgroundColor: "#ffffff",
                          color: "#1a1a1a",
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderRadius: "8px",
                          },
                          "& .MuiSelect-select": {
                            color: "#1a1a1a !important",
                            fontWeight: "500",
                          },
                        }}
                      >
                        <MenuItem value="">Select Marital Status</MenuItem>
                        {maritalStatusOptions.map((status) => (
                          <MenuItem key={status} value={status}>
                            {status}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  </Field>
                  {errors.maritalStatus && (touched.maritalStatus || values.maritalStatus) && (
                    <FormHelperText>{errors.maritalStatus}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {/* Blood Group and Nationality */}
              <Grid item xs={12} sm={6}>
                <FormControl
                  fullWidth
                  error={errors.bloodGroup && (touched.bloodGroup || values.bloodGroup)}
                >
                  <InputLabel>Blood Group*</InputLabel>
                  <Field name="bloodGroup">
                    {({ field }) => (
                      <Select
                        {...field}
                        label="Blood Group"
                        sx={{
                          borderRadius: "8px",
                          backgroundColor: "#ffffff",
                          color: "#1a1a1a",
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderRadius: "8px",
                          },
                          "& .MuiSelect-select": {
                            color: "#1a1a1a !important",
                            fontWeight: "500",
                          },
                        }}
                      >
                        <MenuItem value="">Select Blood Group</MenuItem>
                        {bloodGroups.map((group) => (
                          <MenuItem key={group} value={group}>
                            {group}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  </Field>
                  {errors.bloodGroup && (touched.bloodGroup || values.bloodGroup) && (
                    <FormHelperText>{errors.bloodGroup}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Field
                  name="nationality"
                  component={SimpleTextField}
                  label="Nationality*"
                  required
                />
              </Grid>

              {/* Aadhar and PAN */}
              <Grid item xs={12} sm={6}>
                <Field
                  name="aadharNumber"
                  component={SimpleTextField}
                  label="Aadhar Number* (12 digits)"
                  required
                  placeholder="Enter 12-digit Aadhar number"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Field
                  name="panNumber"
                  component={SimpleTextField}
                  label="PAN Number* (ABCDE1234F)"
                  required
                  placeholder="Enter PAN number"
                />
              </Grid>

              {/* Mobile and Email */}
              <Grid item xs={12} sm={6}>
                <Field
                  name="mobileNumber"
                  component={SimpleTextField}
                  label="Mobile Number* (10 digits)"
                  required
                  placeholder="Enter 10-digit mobile number"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Field
                  name="email"
                  component={SimpleTextField}
                  label="Personal Email*"
                  required
                  type="email"
                />
              </Grid>

              {/* Work Email */}
              <Grid item xs={12}>
                <Field
                  name="workemail"
                  component={SimpleTextField}
                  label="Work Email*"
                  required
                  type="email"
                />
              </Grid>

              {/* Profile Image */}
              <Grid item xs={12}>
                <Typography
                  variant="body1"
                  gutterBottom
                  sx={{ fontWeight: "600", color: "#333" }}
                >
                  Profile Photo*
                </Typography>
                <Field name="employeeImage">
                  {({ field, form }) => (
                    <div>
                      <Button
                        variant="outlined"
                        component="label"
                        sx={{
                          borderRadius: "8px",
                          borderStyle: "dashed",
                          borderWidth: "2px",
                          borderColor:
                            errors.employeeImage && (touched.employeeImage || values.employeeImage)
                              ? "#d32f2f"
                              : "#ccc",
                          backgroundColor: "#ffffff",
                          color: "#1a1a1a",
                          padding: "20px",
                          width: "100%",
                          minHeight: "80px",
                          "&:hover": {
                            borderColor: "primary.main",
                          },
                        }}
                      >
                        {values.employeeImage
                          ? `Selected: ${values.employeeImage.name}`
                          : "Click to upload profile photo (JPG, PNG only, max 5MB)"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/jpg"
                          hidden
                          onChange={(event) => {
                            const file = event.currentTarget.files[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                toast.error(
                                  "Image size should be less than 5MB"
                                );
                                return;
                              }
                              if (
                                ![
                                  "image/jpeg",
                                  "image/png",
                                  "image/jpg",
                                ].includes(file.type)
                              ) {
                                toast.error(
                                  "Only JPG, JPEG & PNG files are allowed"
                                );
                                return;
                              }
                              form.setFieldValue("employeeImage", file);
                            }
                          }}
                        />
                      </Button>
                      {errors.employeeImage && (touched.employeeImage || values.employeeImage) && (
                        <Typography
                          color="error"
                          variant="caption"
                          sx={{ display: "block", mt: 1 }}
                        >
                          {errors.employeeImage}
                        </Typography>
                      )}
                    </div>
                  )}
                </Field>
              </Grid>
            </Grid>

            {/* Submit button */}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={isSubmitting || !isValid}
              sx={{ mt: 3 }}
            >
              {isSubmitting ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1, color: "white" }} />
                  Saving...
                </>
              ) : (
                "Next Step"
              )}
            </Button>
          </Paper>
        </Form>
      )}
    </Formik>
  );
};

export default PersonalInformationForm;
