import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Paper,
  InputAdornment,
  IconButton,
  styled,
  ThemeProvider,
  createTheme,
  useMediaQuery,
  FormHelperText
} from '@mui/material';
import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash, FaCheck, FaTimes, FaLock, FaExclamationTriangle } from 'react-icons/fa';

import { 
  resetPassword, 
  clearError, 
  setAuthError,
  selectAuthLoading,
  selectAuthError
} from '../../../redux/authSlice';
import authService from '../../../screens/api/auth';

// Create theme
const theme = createTheme();

// Styled components for the white background and container
const PageWrapper = styled('div')({
  minHeight: '100vh',
  width: '100%',
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '20px',
  backgroundColor: '#ffffff',
});

const ContentContainer = styled(motion.div)(({ theme }) => ({
  zIndex: 1,
  width: '100%',
  maxWidth: '500px',
  [theme.breakpoints.down('sm')]: {
    maxWidth: '100%',
  },
}));

const ResetPasswordPaper = styled(Paper)(({ theme }) => ({
  padding: '32px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
  borderRadius: '15px',
  boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.1)',
  backgroundColor: '#ffffff',
  border: '1px solid #e0e0e0',
  [theme.breakpoints.down('sm')]: {
    padding: '24px 16px',
  },
}));

const PasswordCriteria = styled(Box)(({ theme }) => ({
  marginTop: '10px',
  padding: '16px',
  backgroundColor: '#f5f5f5',
  borderRadius: '10px',
  width: '100%',
  border: '1px solid #e0e0e0',
  [theme.breakpoints.down('sm')]: {
    padding: '12px',
  },
}));

const CriteriaItem = styled(Box)(({ isValid }) => ({
  display: 'flex',
  alignItems: 'center',
  margin: '5px 0',
  color: isValid ? '#4caf50' : '#666666',
}));

const IconContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  marginBottom: '24px',
});

const LockIcon = styled(FaLock)({
  fontSize: '48px',
  color: '#4a90e2',
  padding: '16px',
  borderRadius: '50%',
  backgroundColor: 'rgba(74, 144, 226, 0.1)',
});

const ErrorMessage = styled(FormHelperText)(({ theme }) => ({
  marginLeft: '14px',
  marginTop: '4px',
  marginBottom: '8px',
  fontSize: '0.75rem',
  fontWeight: 500,
  color: theme.palette.error.main,
}));

// Add a new styled component for password uniqueness warning
const PasswordWarning = styled(Box)(({ theme }) => ({
  marginTop: '16px',
  padding: '12px 16px',
  backgroundColor: 'rgba(255, 193, 7, 0.1)',
  borderRadius: '8px',
  border: '1px solid rgba(255, 193, 7, 0.3)',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  [theme.breakpoints.down('sm')]: {
    padding: '10px 12px',
  },
}));

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenChecking, setTokenChecking] = useState(true);
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  
  // Form validation errors
  const [validationErrors, setValidationErrors] = useState({
    password: '',
    confirmPassword: ''
  });
  
  // Password strength criteria
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });
  
  const { token } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Use Redux selectors
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  
  // Media queries for responsive design
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  // Check if error is about same password
  const isSamePasswordError = error && error.includes('cannot be the same as your current password');
  
  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      try {
        setTokenChecking(true);
        
        // Extract email and companyCode from query parameters
        const queryParams = new URLSearchParams(location.search);
        const emailParam = queryParams.get('email');
        const companyCodeParam = queryParams.get('companyCode');
        
        console.log('Token verification with params:', {
          token,
          email: emailParam,
          companyCode: companyCodeParam
        });
        
        if (!emailParam || !companyCodeParam) {
          console.warn('Missing email or companyCode in reset URL');
          dispatch(setAuthError('Invalid reset link. Please request a new password reset.'));
          setTokenValid(false);
          setTokenChecking(false);
          return;
        }
        
        setEmail(emailParam);
        setCompanyCode(companyCodeParam);
        
        // Verify token with all required parameters
        const response = await authService.verifyResetToken({
          token,
          email: emailParam,
          companyCode: companyCodeParam
        });
        
        console.log('Token verification response:', response);
        setTokenValid(true);
      } catch (err) {
        console.error('Token verification error:', err);
        dispatch(setAuthError('Invalid or expired token. Please request a new password reset.'));
        setTokenValid(false);
      } finally {
        setTokenChecking(false);
      }
    };
    
    if (token) {
      verifyToken();
    } else {
      setTokenChecking(false);
      setTokenValid(false);
      dispatch(setAuthError('No reset token provided.'));
    }
  }, [token, location.search, dispatch]);
  
  // Check password strength whenever password changes
  useEffect(() => {
    const newCriteria = {
      length: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
    
    setPasswordCriteria(newCriteria);
    
    // Clear global error when typing
    if (error) dispatch(clearError());
    
    // Validate password as user types
    validatePasswordField(password);
    
    // If confirm password is not empty, check if passwords match
    if (confirmPassword) {
      validateConfirmPasswordField(confirmPassword, password);
    }
  }, [password, dispatch, error, confirmPassword]);
  
  // Validate password field
  const validatePasswordField = (value) => {
    let errorMessage = '';
        
    if (!value) {
      errorMessage = 'Password is required';
    } else if (value.length < 8) {
      errorMessage = 'Password must be at least 8 characters long';
    } else if (!/[A-Z]/.test(value)) {
      errorMessage = 'Password must include at least one uppercase letter';
    } else if (!/[a-z]/.test(value)) {
      errorMessage = 'Password must include at least one lowercase letter';
    } else if (!/[0-9]/.test(value)) {
      errorMessage = 'Password must include at least one number';
    } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
      errorMessage = 'Password must include at least one special character';
    }
    
    setValidationErrors(prev => ({ ...prev, password: errorMessage }));
    return !errorMessage;
  };
  
  // Validate confirm password field
  const validateConfirmPasswordField = (value, passwordValue) => {
    let errorMessage = '';
    
    if (!value) {
      errorMessage = 'Please confirm your password';
    } else if (value !== passwordValue) {
      errorMessage = 'Passwords do not match';
    }
    
    setValidationErrors(prev => ({ ...prev, confirmPassword: errorMessage }));
    return !errorMessage;
  };
  
  // Handle password input change
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (success) setSuccess('');
    // Clear same password error when user starts typing new password
    if (isSamePasswordError) dispatch(clearError());
  };
  
  // Handle confirm password input change
  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    validateConfirmPasswordField(e.target.value, password);
    if (error) dispatch(clearError());
    if (success) setSuccess('');
  };
  
  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // Toggle confirm password visibility
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  
  // Validate form
  const validateForm = useCallback(() => {
    // Validate both fields
    const isPasswordValid = validatePasswordField(password);
    const isConfirmPasswordValid = validateConfirmPasswordField(confirmPassword, password);
    
    // Return true only if both fields are valid
    return isPasswordValid && isConfirmPasswordValid;
  }, [password, confirmPassword]);
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear any existing errors
    dispatch(clearError());
    
    // Validate form before submission
    if (!validateForm()) {
      // If there are validation errors, show them in the form
      // and prevent submission
      return;
    }
    
    try {
      // Include all necessary parameters for reset
      const resetData = {
        token,
        email,
        companyCode,
        password
      };
      
      console.log('Submitting password reset with data:', {
        ...resetData,
        password: '[REDACTED]'
      });
      
      const resultAction = await dispatch(resetPassword(resetData));
      
      if (resetPassword.fulfilled.match(resultAction)) {
        setSuccess('Password has been reset successfully. You will be redirected to login page.');
        // Clear form
        setPassword('');
        setConfirmPassword('');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      console.error('Reset password error:', err);
    }
  };
  
  // If token is being checked, show loading
  if (tokenChecking) {
    return (
      <ThemeProvider theme={theme}>
        <PageWrapper>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            zIndex: 1,
            position: 'relative'
          }}>
            <CircularProgress size={isMobile ? 40 : 60} sx={{ color: '#4a90e2' }} />
          </Box>
        </PageWrapper>
      </ThemeProvider>
    );
  }
  
  // If token is invalid, show error
  if (!tokenValid) {
    return (
      <ThemeProvider theme={theme}>
        <PageWrapper>
          <ContentContainer
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ResetPasswordPaper elevation={3}>
              <IconContainer>
                <LockIcon />
              </IconContainer>
              <Typography variant={isMobile ? "h5" : "h4"} component="h1" gutterBottom align="center">
                Invalid Reset Link
              </Typography>
              
              {error && (
                <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                  {error}
                </Alert>
              )}
              
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/forgot-password')}
                fullWidth
                sx={{ 
                  mt: 2,
                  py: isMobile ? 1 : 1.5,
                  borderRadius: '8px',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }}
              >
                Request New Reset Link
              </Button>
            </ResetPasswordPaper>
          </ContentContainer>
        </PageWrapper>
      </ThemeProvider>
    );
  }
  
  return (
    <ThemeProvider theme={theme}>
      <PageWrapper>
        <ContentContainer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ResetPasswordPaper elevation={3}>
            <IconContainer>
              <LockIcon />
            </IconContainer>
            
            <Typography 
              variant={isMobile ? "h5" : "h4"} 
              component="h1" 
              gutterBottom
              align="center"
              sx={{ fontWeight: 600 }}
            >
              Reset Password
            </Typography>
            
            <Typography 
              variant="body1" 
              align="center" 
              sx={{ 
                mb: 3, 
                color: '#555',
                fontSize: isMobile ? '0.9rem' : '1rem'
              }}
            >
              Create a new password for <strong>{email}</strong>
            </Typography>
            
            {/* Show special warning for same password error */}
            {isSamePasswordError && (
              <Alert 
                severity="warning" 
                sx={{ 
                  width: '100%', 
                  mb: 3,
                  borderRadius: '8px',
                  '& .MuiAlert-message': {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }
                }}
                icon={<FaExclamationTriangle />}
              >
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Password Must Be Different
                  </Typography>
                  <Typography variant="body2">
                    Your new password cannot be the same as your current password. Please choose a different password for security reasons.
                  </Typography>
                </Box>
              </Alert>
            )}
            
            {/* Show other errors */}
            {error && !isSamePasswordError && (
              <Alert 
                severity="error" 
                sx={{ 
                  width: '100%', 
                  mb: 3,
                  borderRadius: '8px'
                }}
              >
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert 
                severity="success" 
                sx={{ 
                  width: '100%', 
                  mb: 3,
                  borderRadius: '8px'
                }}
              >
                {success}
              </Alert>
            )}
            
            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              <TextField
                required
                fullWidth
                name="password"
                label="New Password"
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={handlePasswordChange}
                margin="normal"
                disabled={loading}
                error={!!validationErrors.password}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '8px',
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={togglePasswordVisibility}
                        edge="end"
                        aria-label="toggle password visibility"
                        size={isMobile ? "small" : "medium"}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              {validationErrors.password && (
                <ErrorMessage>{validationErrors.password}</ErrorMessage>
              )}
              
              {/* Password uniqueness warning */}
              {password && (
                <PasswordWarning>
                  <FaExclamationTriangle style={{ color: '#ff9800', fontSize: '16px' }} />
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#e65100',
                      fontSize: isMobile ? '0.75rem' : '0.8rem',
                      fontWeight: 500
                    }}
                  >
                    Your new password must be different from your current password
                  </Typography>
                </PasswordWarning>
              )}
              
              <PasswordCriteria>
                <Typography 
                  variant="subtitle2" 
                  gutterBottom
                  sx={{ 
                    fontWeight: 600,
                    fontSize: isMobile ? '0.8rem' : '0.9rem',
                    color: '#555'
                  }}
                >
                  Password must contain:
                </Typography>
                
                <CriteriaItem isValid={passwordCriteria.length}>
                  {passwordCriteria.length ? 
                    <FaCheck style={{ marginRight: '8px', color: '#4caf50' }} /> : 
                    <FaTimes style={{ marginRight: '8px', color: '#bdbdbd' }} />
                  }
                  At least 8 characters
                </CriteriaItem>
                
                <CriteriaItem isValid={passwordCriteria.hasUpperCase}>
                  {passwordCriteria.hasUpperCase ? 
                    <FaCheck style={{ marginRight: '8px', color: '#4caf50' }} /> : 
                    <FaTimes style={{ marginRight: '8px', color: '#bdbdbd' }} />
                  }
                  At least one uppercase letter
                </CriteriaItem>
                
                <CriteriaItem isValid={passwordCriteria.hasLowerCase}>
                  {passwordCriteria.hasLowerCase ? 
                    <FaCheck style={{ marginRight: '8px', color: '#4caf50' }} /> : 
                    <FaTimes style={{ marginRight: '8px', color: '#bdbdbd' }} />
                  }
                  At least one lowercase letter
                </CriteriaItem>
                
                <CriteriaItem isValid={passwordCriteria.hasNumber}>
                  {passwordCriteria.hasNumber ? 
                    <FaCheck style={{ marginRight: '8px', color: '#4caf50' }} /> : 
                    <FaTimes style={{ marginRight: '8px', color: '#bdbdbd' }} />
                  }
                  At least one number
                </CriteriaItem>
                
                <CriteriaItem isValid={passwordCriteria.hasSpecialChar}>
                  {passwordCriteria.hasSpecialChar ? 
                    <FaCheck style={{ marginRight: '8px', color: '#4caf50' }} /> : 
                    <FaTimes style={{ marginRight: '8px', color: '#bdbdbd' }} />
                  }
                  At least one special character
                </CriteriaItem>
              </PasswordCriteria>
              
              <TextField
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                margin="normal"
                disabled={loading}
                error={!!validationErrors.confirmPassword}
                sx={{
                  mt: 3,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '8px',
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={toggleConfirmPasswordVisibility}
                        edge="end"
                        aria-label="toggle confirm password visibility"
                        size={isMobile ? "small" : "medium"}
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              {validationErrors.confirmPassword && (
                <ErrorMessage>{validationErrors.confirmPassword}</ErrorMessage>
              )}
              
              <motion.div 
                whileHover={{ scale: loading ? 1 : 1.02 }} 
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  sx={{ 
                    mt: 4, 
                    mb: 2,
                    py: isMobile ? 1.2 : 1.5,
                    backgroundColor: '#4a90e2',
                    borderRadius: '8px',
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    boxShadow: '0 4px 10px rgba(74, 144, 226, 0.3)',
                    '&:hover': {
                      backgroundColor: loading ? '#4a90e2' : '#357abd',
                    },
                    position: 'relative'
                  }}
                >
                  {loading ? (
                    <>
                        <CircularProgress 
                        size={24} 
                        sx={{ 
                          color: 'white',
                          position: 'absolute',
                          left: 'calc(50% - 12px)',
                          top: 'calc(50% - 12px)'
                        }} 
                      />
                      <span style={{ visibility: 'hidden' }}>Reset Password</span>
                    </>
                  ) : 'Reset Password'}
                </Button>
              </motion.div>
              
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  variant="text"
                  color="primary"
                  onClick={() => navigate('/login')}
                  sx={{ 
                    textTransform: 'none',
                    fontSize: isMobile ? '0.85rem' : '0.9rem'
                  }}
                >
                  Back to Login
                </Button>
              </Box>
            </Box>
          </ResetPasswordPaper>
        </ContentContainer>
      </PageWrapper>
    </ThemeProvider>
  );
};

export default ResetPassword;