import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../../redux/actions/userActions';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Alert, 
  CircularProgress,
  FormHelperText,
  InputAdornment,
  IconButton,
  styled,
  ThemeProvider,
  createTheme,
  useMediaQuery,
  Container,
  Grid
} from '@mui/material';
import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash, FaLock, FaArrowLeft, FaCheck, FaTimes } from 'react-icons/fa';


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
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// Enhanced styled components with perfect centering and white background
const ChangePasswordWrapper = styled('div')(({ theme }) => ({
  minHeight: '100vh',
  width: '100vw',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  overflow: 'auto',
  padding: '20px',
  backgroundColor: '#ffffff',
  [theme.breakpoints.down('sm')]: {
    padding: '10px',
    alignItems: 'flex-start',
    paddingTop: '20px',
  },
  [theme.breakpoints.between('sm', 'md')]: {
    padding: '15px',
  },
}));



const ChangePasswordContent = styled(motion.div)(({ theme }) => ({
  width: '100%',
  maxWidth: '500px',
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  margin: '0 auto',
  [theme.breakpoints.down('sm')]: {
    maxWidth: '100%',
    width: '100%',
    minHeight: 'auto',
  },
  [theme.breakpoints.between('sm', 'md')]: {
    maxWidth: '450px',
  },
  [theme.breakpoints.up('lg')]: {
    maxWidth: '550px',
  },
}));

const ChangePasswordFormContainer = styled(Paper)(({ theme }) => ({
  padding: '40px',
  boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.1)',
  borderRadius: '20px',
  backgroundColor: '#ffffff',
  border: '1px solid #e0e0e0',
  transition: 'all 0.3s ease-in-out',
  width: '100%',
  position: 'relative',
  transform: 'translateZ(0)', // Force hardware acceleration
  [theme.breakpoints.down('sm')]: {
    padding: '20px',
    borderRadius: '15px',
    margin: '0',
    minHeight: 'auto',
  },
  [theme.breakpoints.between('sm', 'md')]: {
    padding: '30px',
    borderRadius: '18px',
  },
  [theme.breakpoints.up('lg')]: {
    padding: '45px',
    borderRadius: '25px',
  },
}));

const IconContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  marginBottom: '24px',
  [theme.breakpoints.down('sm')]: {
    marginBottom: '16px',
  },
  [theme.breakpoints.between('sm', 'md')]: {
    marginBottom: '20px',
  },
}));

const LockIcon = styled(FaLock)(({ theme }) => ({
  fontSize: '48px',
  color: '#4a90e2',
  padding: '16px',
  borderRadius: '50%',
  backgroundColor: 'rgba(74, 144, 226, 0.1)',
  transition: 'all 0.3s ease',
  [theme.breakpoints.down('sm')]: {
    fontSize: '36px',
    padding: '12px',
  },
  [theme.breakpoints.between('sm', 'md')]: {
    fontSize: '42px',
    padding: '14px',
  },
  [theme.breakpoints.up('lg')]: {
    fontSize: '52px',
    padding: '18px',
  },
}));

const PasswordCriteria = styled(Box)(({ theme }) => ({
  marginTop: '12px',
  padding: '16px',
  backgroundColor: '#f5f5f5',
  borderRadius: '12px',
  width: '100%',
  border: '1px solid #e0e0e0',
  transition: 'all 0.3s ease',
  [theme.breakpoints.down('sm')]: {
    padding: '12px',
    borderRadius: '8px',
    marginTop: '8px',
  },
  [theme.breakpoints.between('sm', 'md')]: {
    padding: '14px',
    borderRadius: '10px',
    marginTop: '10px',
  },
  [theme.breakpoints.up('lg')]: {
    padding: '18px',
    borderRadius: '14px',
    marginTop: '14px',
  },
}));

const CriteriaItem = styled(Box)(({ isValid, theme }) => ({
  display: 'flex',
  alignItems: 'center',
  margin: '6px 0',
  color: isValid ? '#4caf50' : '#666666',
  fontSize: '0.875rem',
  transition: 'color 0.3s ease',
  [theme.breakpoints.down('sm')]: {
    margin: '4px 0',
    fontSize: '0.8rem',
  },
  [theme.breakpoints.between('sm', 'md')]: {
    margin: '5px 0',
    fontSize: '0.85rem',
  },
  [theme.breakpoints.up('lg')]: {
    margin: '7px 0',
    fontSize: '0.9rem',
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    '& fieldset': {
      borderColor: '#d0d0d0',
      transition: 'border-color 0.3s ease',
    },
    '&:hover fieldset': {
      borderColor: '#b0b0b0',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#4a90e2',
      borderWidth: '2px',
    },
    '& input': {
      color: '#333333',
      fontSize: '1rem',
      '&::placeholder': {
        color: '#888888',
        opacity: 1,
      },
      '&:-webkit-autofill': {
        WebkitBoxShadow: '0 0 0 1000px #ffffff inset',
        WebkitTextFillColor: '#333333',
        caretColor: '#333333',
        transition: 'background-color 5000s ease-in-out 0s',
      },
    }
  },
  '& .MuiInputLabel-root': {
    color: '#666666',
    fontSize: '1rem',
    '&.Mui-focused': {
      color: '#4a90e2',
    }
  },
  '& .MuiFormHelperText-root': {
    color: '#f44336',
    fontSize: '0.75rem',
    marginLeft: '14px',
    marginTop: '4px',
  },
  marginBottom: '16px',
  [theme.breakpoints.down('sm')]: {
    marginBottom: '12px',
    '& .MuiOutlinedInput-root': {
      '& input': {
        fontSize: '0.9rem',
        padding: '12px 14px',
      }
    },
    '& .MuiInputLabel-root': {
      fontSize: '0.9rem',
    },
  },
  [theme.breakpoints.between('sm', 'md')]: {
    marginBottom: '14px',
    '& .MuiOutlinedInput-root': {
      '& input': {
        fontSize: '0.95rem',
        padding: '14px 16px',
      }
    },
    '& .MuiInputLabel-root': {
      fontSize: '0.95rem',
    },
  },
  [theme.breakpoints.up('lg')]: {
    marginBottom: '18px',
    '& .MuiOutlinedInput-root': {
      '& input': {
        fontSize: '1.05rem',
        padding: '16px 18px',
      }
    },
    '& .MuiInputLabel-root': {
      fontSize: '1.05rem',
    },
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#4a90e2',
  color: 'white',
  fontWeight: 600,
  borderRadius: '8px',
  textTransform: 'none',
  boxShadow: '0 4px 10px rgba(74, 144, 226, 0.3)',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    backgroundColor: '#357abd',
    boxShadow: '0 6px 15px rgba(74, 144, 226, 0.4)',
    transform: 'translateY(-2px)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
  '&:disabled': {
    backgroundColor: '#4a90e2',
    opacity: 0.7,
    transform: 'none',
  },
  [theme.breakpoints.down('sm')]: {
    padding: '10px 16px',
    fontSize: '0.9rem',
    borderRadius: '6px',
  },
  [theme.breakpoints.between('sm', 'md')]: {
    padding: '12px 20px',
    fontSize: '0.95rem',
    borderRadius: '7px',
  },
  [theme.breakpoints.up('lg')]: {
    padding: '14px 24px',
    fontSize: '1.05rem',
    borderRadius: '9px',
  },
}));

const BackButton = styled(Button)(({ theme }) => ({
  color: '#4a90e2',
  textTransform: 'none',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: 'rgba(74, 144, 226, 0.08)',
    transform: 'translateX(-2px)',
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.8rem',
    padding: '6px 12px',
  },
  [theme.breakpoints.between('sm', 'md')]: {
    fontSize: '0.85rem',
    padding: '8px 16px',
  },
  [theme.breakpoints.up('lg')]: {
    fontSize: '0.95rem',
    padding: '10px 20px',
  },
}));

// Centered container wrapper
const CenteredContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  width: '100%',
  position: 'relative',
  [theme.breakpoints.down('sm')]: {
    alignItems: 'flex-start',
    paddingTop: '20px',
    minHeight: 'calc(100vh - 40px)',
  },
}));

const ChangePassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, success, error } = useSelector(state => state.users?.passwordChange || {});
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  
  // Password strength criteria
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
    differentFromCurrent: true
  });
  
  // Enhanced media queries for better responsive design
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const isLargeDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  
  // Clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      setSuccessMessage('Password changed successfully!');
      const timer = setTimeout(() => {
        setSuccessMessage('');
        navigate('/dashboards');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);
  
  // Check password strength whenever new password changes
  useEffect(() => {
    const newPassword = formData.newPassword;
    const currentPassword = formData.currentPassword;
    
    const newCriteria = {
      length: newPassword.length >= 8,
      hasUpperCase: /[A-Z]/.test(newPassword),
      hasLowerCase: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecialChar: /[@$!%*?&]/.test(newPassword),
      differentFromCurrent: newPassword !== currentPassword && newPassword.length > 0
    };
    
    setPasswordCriteria(newCriteria);
  }, [formData.newPassword, formData.currentPassword]);
  
  const validateForm = () => {
    const errors = {};
    
    if (!formData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!formData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])/.test(formData.newPassword)) {
      errors.newPassword = 'Password must include at least one lowercase letter';
    } else if (!/(?=.*[A-Z])/.test(formData.newPassword)) {
      errors.newPassword = 'Password must include at least one uppercase letter';
    } else if (!/(?=.*\d)/.test(formData.newPassword)) {
      errors.newPassword = 'Password must include at least one number';
    } else if (!/(?=.*[@$!%*?&])/.test(formData.newPassword)) {
      errors.newPassword = 'Password must include at least one special character';
    } else if (formData.newPassword === formData.currentPassword) {
      errors.newPassword = 'New password must be different from current password';
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear specific field error when user starts typing
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };
  
  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      console.log('Auth state before change password:', {
        token: localStorage.getItem('token'),
        companyCode: localStorage.getItem('companyCode')
      });
      
      await dispatch(changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      }));
      
      // Reset form on success
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      console.error('Failed to change password:', err);
    }
  };
  
  // Get responsive icon size
  const getIconSize = () => {
    if (isMobile) return 16;
    if (isTablet) return 18;
    if (isLargeDesktop) return 22;
    return 20;
  };
  
  // Get responsive criteria icon size
  const getCriteriaIconSize = () => {
    if (isMobile) return 12;
    if (isTablet) return 14;
    if (isLargeDesktop) return 16;
    return 14;
  };
  
  return (
    <ThemeProvider theme={theme}>
      <ChangePasswordWrapper>
        {/* Centered Content Container */}
        <CenteredContainer>
          <Container 
            maxWidth={false} 
            sx={{ 
              padding: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              maxWidth: isMobile ? '100%' : isTablet ? '500px' : isLargeDesktop ? '600px' : '550px'
            }}
          >
            <ChangePasswordContent
              initial={{ 
                opacity: 0, 
                y: isMobile ? 10 : 20,
                scale: 0.95
              }}
              animate={{ 
                opacity: 1, 
                y: 0,
                scale: 1
              }}
              transition={{ 
                duration: isMobile ? 0.4 : 0.6,
                ease: "easeOut",
                type: "spring",
                stiffness: 100,
                damping: 15
              }}
            >
              <ChangePasswordFormContainer elevation={3}>
                <IconContainer>
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      delay: 0.2, 
                      duration: 0.5,
                      type: "spring",
                      stiffness: 200
                    }}
                  >
                    <LockIcon />
                  </motion.div>
                </IconContainer>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <Typography
                    variant={isMobile ? "h6" : isTablet ? "h5" : "h4"}
                    component="h1"
                    sx={{
                      mb: isMobile ? 1 : isTablet ? 1.5 : 2,
                      textAlign: 'center',
                      color: 'white',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: isMobile ? '1px' : isTablet ? '1.5px' : '2px',
                      fontSize: {
                        xs: '1.25rem',
                        sm: '1.5rem',
                        md: '1.75rem',
                        lg: '2rem'
                      }
                    }}
                  >
                    Change Password
                  </Typography>
                  
                  <Typography 
                    variant="body1" 
                    align="center" 
                    sx={{ 
                      mb: isMobile ? 2 : isTablet ? 2.5 : 3, 
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: {
                        xs: '0.85rem',
                        sm: '0.9rem',
                        md: '1rem',
                        lg: '1.05rem'
                      },
                      lineHeight: {
                        xs: 1.4,
                        sm: 1.5,
                        md: 1.6
                      },
                      px: isMobile ? 1 : 0
                    }}
                  >
                    Update your current password with a new secure password
                  </Typography>
                </motion.div>
                
                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Alert 
                      severity="success" 
                      sx={{ 
                        mt: 1, 
                        mb: 2,
                        '& .MuiAlert-message': {
                          color: '#4caf50',
                          fontWeight: 500,
                          fontSize: {
                            xs: '0.8rem',
                            sm: '0.85rem',
                            md: '0.9rem'
                          }
                        },
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        border: '1px solid rgba(76, 175, 80, 0.3)',
                        borderRadius: isMobile ? '6px' : '8px',
                      }}
                    >
                      {successMessage}
                    </Alert>
                  </motion.div>
                )}
                
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Alert 
                      severity="error" 
                      sx={{ 
                        mt: 1, 
                        mb: 2,
                        '& .MuiAlert-message': {
                          color: '#f44336',
                          fontWeight: 500,
                          fontSize: {
                            xs: '0.8rem',
                            sm: '0.85rem',
                            md: '0.9rem'
                          }
                        },
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                        border: '1px solid rgba(244, 67, 54, 0.3)',
                        borderRadius: isMobile ? '6px' : '8px',
                      }}
                    >
                      {error}
                    </Alert>
                  </motion.div>
                )}
                
                <Box 
                  component="form" 
                  onSubmit={handleSubmit} 
                  noValidate
                  sx={{ 
                    mt: 1,
                    width: '100%'
                  }}
                >
                  {/* Current Password Field */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    <StyledTextField
                      margin="normal"
                      required
                      fullWidth
                      name="currentPassword"
                      label="Current Password"
                      type={showPasswords.currentPassword ? "text" : "password"}
                      id="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      error={!!formErrors.currentPassword}
                      helperText={formErrors.currentPassword}
                      disabled={loading}
                      size={isMobile ? "small" : "medium"}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => togglePasswordVisibility('currentPassword')}
                              edge="end"
                              aria-label="toggle current password visibility"
                              sx={{ 
                                color: 'rgba(255, 255, 255, 0.7)',
                                '&:hover': {
                                  color: 'rgba(255, 255, 255, 0.9)',
                                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                }
                              }}
                              size={isMobile ? "small" : "medium"}
                              disabled={loading}
                              type="button"
                            >
                              {showPasswords.currentPassword ? 
                                <FaEyeSlash size={getIconSize()} /> : 
                                <FaEye size={getIconSize()} />
                              }
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </motion.div>
                  
                  {/* New Password Field */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    <StyledTextField
                      margin="normal"
                      required
                      fullWidth
                      name="newPassword"
                      label="New Password"
                      type={showPasswords.newPassword ? "text" : "password"}
                      id="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      error={!!formErrors.newPassword}
                      helperText={formErrors.newPassword}
                      disabled={loading}
                      size={isMobile ? "small" : "medium"}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => togglePasswordVisibility('newPassword')}
                              edge="end"
                              aria-label="toggle new password visibility"
                              sx={{ 
                                color: 'rgba(255, 255, 255, 0.7)',
                                '&:hover': {
                                  color: 'rgba(255, 255, 255, 0.9)',
                                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                }
                              }}
                              size={isMobile ? "small" : "medium"}
                              disabled={loading}
                              type="button"
                            >
                              {showPasswords.newPassword ? 
                                <FaEyeSlash size={getIconSize()} /> : 
                                <FaEye size={getIconSize()} />
                              }
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </motion.div>
                  
                  {/* Password Criteria */}
                  {formData.newPassword && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <PasswordCriteria>
                        <Typography 
                          variant="subtitle2" 
                          gutterBottom
                          sx={{ 
                            fontWeight: 600,
                            fontSize: {
                              xs: '0.75rem',
                              sm: '0.8rem',
                              md: '0.85rem',
                              lg: '0.9rem'
                            },
                            color: 'rgba(255, 255, 255, 0.9)',
                            mb: isMobile ? 0.5 : 1
                          }}
                        >
                          Password Requirements:
                        </Typography>
                        
                        <Grid container spacing={isMobile ? 0.5 : 1}>
                          <Grid item xs={12} sm={6}>
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 }}
                            >
                              <CriteriaItem isValid={passwordCriteria.length}>
                                {passwordCriteria.length ? 
                                  <FaCheck style={{ 
                                    marginRight: isMobile ? '6px' : '8px', 
                                    color: '#4caf50', 
                                    fontSize: getCriteriaIconSize() 
                                  }} /> : 
                                  <FaTimes style={{ 
                                    marginRight: isMobile ? '6px' : '8px', 
                                    color: '#bdbdbd', 
                                    fontSize: getCriteriaIconSize() 
                                  }} />
                                }
                                At least 8 characters
                              </CriteriaItem>
                            </motion.div>
                            
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.2 }}
                            >
                              <CriteriaItem isValid={passwordCriteria.hasUpperCase}>
                                {passwordCriteria.hasUpperCase ? 
                                  <FaCheck style={{ 
                                    marginRight: isMobile ? '6px' : '8px', 
                                    color: '#4caf50', 
                                    fontSize: getCriteriaIconSize() 
                                  }} /> : 
                                  <FaTimes style={{ 
                                    marginRight: isMobile ? '6px' : '8px', 
                                    color: '#bdbdbd', 
                                    fontSize: getCriteriaIconSize() 
                                  }} />
                                }
                                Uppercase letter (A-Z)
                              </CriteriaItem>
                            </motion.div>
                            
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 }}
                            >
                              <CriteriaItem isValid={passwordCriteria.hasLowerCase}>
                                {passwordCriteria.hasLowerCase ? 
                                  <FaCheck style={{ 
                                    marginRight: isMobile ? '6px' : '8px', 
                                    color: '#4caf50', 
                                    fontSize: getCriteriaIconSize() 
                                  }} /> : 
                                  <FaTimes style={{ 
                                    marginRight: isMobile ? '6px' : '8px', 
                                    color: '#bdbdbd', 
                                    fontSize: getCriteriaIconSize() 
                                  }} />
                                }
                                Lowercase letter (a-z)
                              </CriteriaItem>
                            </motion.div>
                          </Grid>
                          
                          <Grid item xs={12} sm={6}>
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.4 }}
                            >
                              <CriteriaItem isValid={passwordCriteria.hasNumber}>
                                {passwordCriteria.hasNumber ? 
                                  <FaCheck style={{ 
                                    marginRight: isMobile ? '6px' : '8px', 
                                    color: '#4caf50', 
                                    fontSize: getCriteriaIconSize() 
                                  }} /> : 
                                  <FaTimes style={{ 
                                    marginRight: isMobile ? '6px' : '8px', 
                                    color: '#bdbdbd', 
                                    fontSize: getCriteriaIconSize() 
                                  }} />
                                }
                                Number (0-9)
                              </CriteriaItem>
                            </motion.div>
                            
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.5 }}
                            >
                              <CriteriaItem isValid={passwordCriteria.hasSpecialChar}>
                                {passwordCriteria.hasSpecialChar ? 
                                  <FaCheck style={{ 
                                    marginRight: isMobile ? '6px' : '8px', 
                                    color: '#4caf50', 
                                    fontSize: getCriteriaIconSize() 
                                  }} /> : 
                                  <FaTimes style={{ 
                                    marginRight: isMobile ? '6px' : '8px', 
                                    color: '#bdbdbd', 
                                    fontSize: getCriteriaIconSize() 
                                  }} />
                                }
                                Special character (@$!%*?&)
                              </CriteriaItem>
                            </motion.div>
                            
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.6 }}
                            >
                              <CriteriaItem isValid={passwordCriteria.differentFromCurrent}>
                                {passwordCriteria.differentFromCurrent ? 
                                  <FaCheck style={{ 
                                    marginRight: isMobile ? '6px' : '8px', 
                                    color: '#4caf50', 
                                    fontSize: getCriteriaIconSize() 
                                  }} /> : 
                                  <FaTimes style={{ 
                                    marginRight: isMobile ? '6px' : '8px', 
                                    color: '#bdbdbd', 
                                    fontSize: getCriteriaIconSize() 
                                  }} />
                                }
                                Different from current
                              </CriteriaItem>
                            </motion.div>
                          </Grid>
                        </Grid>
                      </PasswordCriteria>
                    </motion.div>
                  )}
                  
                  {/* Confirm Password Field */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                  >
                    <StyledTextField
                      margin="normal"
                      required
                      fullWidth
                      name="confirmPassword"
                      label="Confirm New Password"
                      type={showPasswords.confirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      error={!!formErrors.confirmPassword}
                      helperText={formErrors.confirmPassword}
                      disabled={loading}
                      sx={{
                        mt: formData.newPassword ? (isMobile ? 2 : isTablet ? 2.5 : 3) : (isMobile ? 1 : 2)
                      }}
                      size={isMobile ? "small" : "medium"}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => togglePasswordVisibility('confirmPassword')}
                              edge="end"
                              aria-label="toggle confirm password visibility"
                              sx={{ 
                                color: 'rgba(255, 255, 255, 0.7)',
                                '&:hover': {
                                  color: 'rgba(255, 255, 255, 0.9)',
                                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                }
                              }}
                              size={isMobile ? "small" : "medium"}
                              disabled={loading}
                              type="button"
                            >
                              {showPasswords.confirmPassword ? 
                                <FaEyeSlash size={getIconSize()} /> : 
                                <FaEye size={getIconSize()} />
                              }
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </motion.div>
                  
                  {/* Submit Button */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                    whileHover={{ scale: loading ? 1 : (isMobile ? 1.02 : 1.03) }} 
                    whileTap={{ scale: loading ? 1 : (isMobile ? 0.99 : 0.98) }}
                    style={{ width: '100%' }}
                  >
                    <StyledButton
                      type="submit"
                      fullWidth
                      variant="contained"
                      sx={{
                        mt: isMobile ? 2 : isTablet ? 2.5 : 3,
                        mb: isMobile ? 1.5 : 2,
                      }}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <CircularProgress 
                            size={isMobile ? 20 : isTablet ? 22 : 24} 
                            sx={{ 
                              color: 'white',
                              position: 'absolute',
                              left: '50%',
                              top: '50%',
                              marginLeft: isMobile ? '-10px' : isTablet ? '-11px' : '-12px',
                              marginTop: isMobile ? '-10px' : isTablet ? '-11px' : '-12px'
                            }} 
                          />
                          <span style={{ visibility: 'hidden' }}>Change Password</span>
                        </>
                      ) : 'Change Password'}
                    </StyledButton>
                  </motion.div>
                  
                  {/* Navigation Links */}
                  <Box sx={{ 
                    mt: isMobile ? 1 : isTablet ? 1.5 : 2, 
                    textAlign: 'center' 
                  }}>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8, duration: 0.5 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <BackButton
                        variant="text"
                        startIcon={<FaArrowLeft size={isMobile ? 14 : 16} />}
                        onClick={() => navigate('/dashboards')}
                      >
                        Back to Dashboard
                      </BackButton>
                    </motion.div>
                  </Box>
                  
                  {/* Additional Help Text */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9, duration: 0.5 }}
                  >
                    <Box sx={{ 
                      mt: isMobile ? 2 : isTablet ? 2.5 : 3, 
                      textAlign: 'center',
                      px: isMobile ? 1 : 0
                    }}>
                      <Typography 
                        variant="body2" 
                        sx={{
                          color: 'rgba(255, 255, 255, 0.6)',
                          fontSize: {
                            xs: '0.7rem',
                            sm: '0.75rem',
                            md: '0.8rem',
                            lg: '0.85rem'
                          },
                          lineHeight: {
                            xs: 1.3,
                            sm: 1.4,
                            md: 1.5
                          },
                          maxWidth: isMobile ? '100%' : isTablet ? '90%' : '85%',
                          mx: 'auto'
                        }}
                      >
                        Make sure your new password is strong and unique.
                        {!isMobile && <br />}
                        {isMobile ? ' ' : ''}Avoid using personal information or common words.
                      </Typography>
                    </Box>
                  </motion.div>
                  
                  {/* Security Tips for larger screens */}
                  {(isTablet || isDesktop) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.0, duration: 0.5 }}
                    >
                      <Box sx={{ 
                        mt: 3, 
                        p: 2, 
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                        }
                      }}>
                        <Typography 
                          variant="caption" 
                          sx={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontSize: {
                              sm: '0.7rem',
                              md: '0.75rem',
                              lg: '0.8rem'
                            },
                            display: 'block',
                            textAlign: 'center',
                            lineHeight: 1.4
                          }}
                        >
                          💡 <strong>Security Tip:</strong> Use a combination of letters, numbers, and symbols. 
                          Consider using a passphrase with multiple words for better security.
                        </Typography>
                      </Box>
                    </motion.div>
                  )}
                </Box>
              </ChangePasswordFormContainer>
            </ChangePasswordContent>
          </Container>
        </CenteredContainer>
      </ChangePasswordWrapper>
    </ThemeProvider>
  );
};

export default ChangePassword;
