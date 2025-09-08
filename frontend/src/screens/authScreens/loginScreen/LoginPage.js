import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  TextField, 
  Button, 
  Typography, 
  Box, 
  Container, 
  Alert, 
  IconButton, 
  InputAdornment,
  useMediaQuery,
  styled,
  ThemeProvider,
  createTheme,
  CircularProgress
} from '@mui/material';
import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

import { debounce } from 'lodash';
import { 
  loginUser, 
  clearError, 
  setAuthError,
  selectAuthLoading,
  selectAuthError,
  selectVerificationNeeded,
  selectVerificationEmail,
  setVerificationEmail,
  logoutUser
} from '../../../redux/authSlice';

// Create a theme
const theme = createTheme();

// Styled components using the theme
const LoginWrapper = styled('div')({
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  padding: '20px',
  backgroundColor: '#ffffff',
});

const LoginContent = styled(motion.div)({
  width: '100%',
  maxWidth: '450px',
  position: 'relative',
  zIndex: 1,
  '@media (max-width: 600px)': {
    maxWidth: '100%',
  },
});

const LoginFormContainer = styled(Container)({
  padding: '32px',
  boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.1)',
  borderRadius: '20px',
  backgroundColor: '#ffffff',
  border: '1px solid rgba(0, 0, 0, 0.1)',
  '@media (max-width: 600px)': {
    padding: '24px',
    marginTop: '32px',
  },
});

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Use Redux selectors
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const verificationNeeded = useSelector(selectVerificationNeeded);
  const verificationEmail = useSelector(selectVerificationEmail);
  
  // Use a ref to track if component is mounted
  const isMounted = useRef(true);
  
  // Media queries for responsive design
  const isMobile = useMediaQuery('(max-width:600px)');

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      console.log('User already logged in, redirecting to dashboard');
      navigate('/Dashboards');
    }
  }, [navigate]);

  useEffect(() => {
    if (!loading && isSubmitting) {
      setIsSubmitting(false);
    }
  }, [loading, isSubmitting]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    // Check if there's a pending login attempt in sessionStorage
    try {
      const pendingLogin = sessionStorage.getItem('pendingLogin');
      if (pendingLogin) {
        const loginData = JSON.parse(pendingLogin);
        setFormData(loginData);
      }
    } catch (error) {
      console.error('Error retrieving pending login data:', error);
    }
  }, []);

  const logout = useCallback(() => {
    dispatch(logoutUser()).then(() => {
      navigate('/login');
    });
  }, [dispatch, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Format input values based on field name
    let formattedValue = value;
    
    if (name === 'companyCode') {
      // Convert company code to uppercase
      formattedValue = value.toUpperCase();
    } else if (name === 'email') {
      // Convert email to lowercase
      formattedValue = value.toLowerCase();
    }
    
    setFormData(prevState => ({
      ...prevState,
      [name]: formattedValue
    }));
    
    // Clear error when user starts typing again
    if (error) dispatch(clearError());
  };

  const togglePasswordVisibility = useCallback((e) => {
    // Prevent form submission when clicking the eye icon
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowPassword(prev => !prev);
  }, []);

const validateForm = useCallback(() => {
  // Basic form validation
  if (!formData.companyCode.trim()) {
    dispatch(setAuthError('Company code is required'));
    return false;
  }
  if (!formData.email.trim()) {
    dispatch(setAuthError('Email is required'));
    return false;
  }
  if (!formData.password) {
    dispatch(setAuthError('Password is required'));
    return false;
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email.trim())) {
    dispatch(setAuthError('Please enter a valid email address'));
    return false;
  }
  
  // Company code validation - ensure it's alphanumeric
  const companyCodeRegex = /^[a-zA-Z0-9]+$/;
  if (!companyCodeRegex.test(formData.companyCode.trim())) {
    dispatch(setAuthError('Company code should contain only letters and numbers'));
    return false;
  }
  
  return true;
}, [formData, dispatch]);

const handleSubmit = useCallback(async (e) => {
  // Prevent default form submission behavior
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  // Prevent double submission
  if (isSubmitting || loading) return;
  
  // Validate form inputs
  if (!validateForm()) {
    return;
  }
  
  // Save current form state to session storage in case of page reload
  try {
    sessionStorage.setItem('pendingLogin', JSON.stringify(formData));
  } catch (error) {
    console.error('Error saving form data to session storage:', error);
  }
  
  // Set submission state
  setIsSubmitting(true);
  
  try {
    console.log('Submitting login form with:', {
      email: formData.email,
      companyCode: formData.companyCode,
      passwordProvided: !!formData.password,
      passwordLength: formData.password.length
    });
    
    // Attempt login using Redux action
    const resultAction = await dispatch(loginUser({
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      companyCode: formData.companyCode.trim().toUpperCase()
    }));
    
    console.log('Login response in component:', {
      success: loginUser.fulfilled.match(resultAction),
      payload: resultAction.payload,
      error: resultAction.error
    });
    
    // Clear pending login on success
    if (loginUser.fulfilled.match(resultAction)) {
      sessionStorage.removeItem('pendingLogin');
      
      // Navigate to dashboard on success
      console.log('Login successful, navigating to dashboard');
      navigate('/Dashboards');
    } else if (loginUser.rejected.match(resultAction)) {
      // Handle specific error cases
      const errorPayload = resultAction.payload;
      
      if (errorPayload && errorPayload.requiresVerification) {
        console.log('Verification required for:', errorPayload.email);
        // The error message will be set by the reducer
      } else {
        console.log('Login failed:', errorPayload);
      }
    }
  } catch (error) {
    console.error('Login error in component:', error);
    dispatch(setAuthError(error.message || 'Login failed. Please try again.'));
  } finally {
    if (isMounted.current) {
      setIsSubmitting(false);
    }
  }
}, [formData, isSubmitting, loading, validateForm, dispatch, navigate]);

const handleRequestVerification = useCallback(() => {
  if (!verificationEmail) {
    const email = formData.email.trim().toLowerCase();
    if (email) {
      console.log('Using form email for verification:', email);
      dispatch(setVerificationEmail(email));
    } else {
      console.error('No email available for verification');
      return;
    }
  }
  
  // Save the current login attempt for after verification
  sessionStorage.setItem('pendingLogin', JSON.stringify(formData));
  
  // Redirect to verification page with email
  const emailToVerify = verificationEmail || formData.email.trim().toLowerCase();
  navigate(`/verify-otp?email=${encodeURIComponent(emailToVerify)}`);
}, [verificationEmail, formData, navigate, dispatch]);


  // Custom text field styling
  const textFieldSx = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: '#ffffff',
      '& fieldset': {
        borderColor: 'rgba(0, 0, 0, 0.23)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(0, 0, 0, 0.87)',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#4a90e2',
      },
      '& input': {
        color: '#000000',
        '&::placeholder': {
          color: 'rgba(0, 0, 0, 0.6)',
          opacity: 1,
        },
        '&:-webkit-autofill': {
          WebkitBoxShadow: '0 0 0 1000px white inset',
          WebkitTextFillColor: '#000000',
          caretColor: '#000000',
          transition: 'background-color 5002s ease-in-out 0s',
        },
      }
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(0, 0, 0, 0.6)',
      '&.Mui-focused': {
        color: '#4a90e2',
      }
    },
    marginBottom: 2
  };

  return (
    <ThemeProvider theme={theme}>
      <LoginWrapper>

        
        <LoginContent
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <LoginFormContainer 
            maxWidth="xs"
            sx={{
              mt: isMobile ? 0 : 4,
              mx: 'auto',
              width: isMobile ? '90%' : 'auto',
            }}
          >
            <Typography
              variant={isMobile ? "h5" : "h4"}
              component="h1"
              sx={{
                mb: 2,
                textAlign: 'center',
                color: '#333333',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '2px'
              }}
            >
              Login
            </Typography>
            
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mt: 1, 
                  mb: 2,
                  '& .MuiAlert-message': {
                    color: '#f44336',
                    fontWeight: 500,
                  },
                  backgroundColor: 'rgba(244, 67, 54, 0.1)',
                  border: '1px solid rgba(244, 67, 54, 0.3)',
                  borderRadius: '8px',
                }}
                action={
                  verificationNeeded && (
                    <Button 
                      color="inherit" 
                      size="small" 
                      onClick={handleRequestVerification}
                      sx={{ fontWeight: 'bold' }}
                    >
                      Verify Now
                    </Button>
                  )
                }
              >
                {error}
              </Alert>
            )}
            
            {/* Use div instead of form to avoid implicit form submission */}
            <Box 
              component="div"
              sx={{ 
                mt: 1,
                '& .MuiTextField-root': {
                  mb: 2
                }
              }}
              onSubmit={(e) => e.preventDefault()}
            >
              <TextField
                fullWidth
                required
                id="companyCode"
                label="Company Code"
                name="companyCode"
                autoComplete="organization"
                value={formData.companyCode}
                onChange={handleChange}
                autoFocus
                sx={textFieldSx}
                size={isMobile ? "small" : "medium"}
                disabled={loading || isSubmitting}
                inputProps={{
                  style: { textTransform: 'uppercase' }
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              
              <TextField
                fullWidth
                required
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                sx={textFieldSx}
                size={isMobile ? "small" : "medium"}
                disabled={loading || isSubmitting}
                inputProps={{
                  style: { textTransform: 'lowercase' }
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              
              <TextField
                fullWidth
                required
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                id="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                sx={textFieldSx}
                size={isMobile ? "small" : "medium"}
                disabled={loading || isSubmitting}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                      onClick={togglePasswordVisibility}
                      edge="end"
                      aria-label="toggle password visibility"
                      sx={{ color: 'rgba(0, 0, 0, 0.6)' }}
                      size={isMobile ? "small" : "medium"}
                      disabled={loading || isSubmitting}
                      type="button" // Explicitly set type to button
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              
              <motion.div whileHover={{ scale: loading || isSubmitting ? 1 : 1.03 }} whileTap={{ scale: loading || isSubmitting ? 1 : 0.98 }}>
                <Button
                  onClick={handleSubmit}
                  fullWidth
                  variant="contained"
                  sx={{
                    mt: 3,
                    mb: 2,
                    backgroundColor: '#4a90e2',
                    '&:hover': {
                      backgroundColor: loading || isSubmitting ? '#4a90e2' : '#357abd'
                    },
                    padding: isMobile ? '8px' : '12px',
                    fontSize: isMobile ? '14px' : '16px',
                    fontWeight: 600,
                    borderRadius: '8px',
                    textTransform: 'none',
                    boxShadow: '0 4px 10px rgba(74, 144, 226, 0.3)',
                    position: 'relative'
                  }}
                  disabled={loading || isSubmitting}
                  type="button" // Explicitly set type to button
                >
                  {loading || isSubmitting ? (
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
                      <span style={{ visibility: 'hidden' }}>Sign In</span>
                    </>
                  ) : 'Sign In'}
                </Button>
              </motion.div>
              
              {verificationNeeded && (
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Button
                    onClick={handleRequestVerification}
                    fullWidth
                    variant="outlined"
                    sx={{
                      color: '#4a90e2',
                      borderColor: '#4a90e2',
                      '&:hover': {
                        backgroundColor: 'rgba(74, 144, 226, 0.08)',
                        borderColor: '#357abd'
                      },
                      padding: isMobile ? '6px' : '10px',
                      fontSize: isMobile ? '13px' : '15px',
                      fontWeight: 500,
                      borderRadius: '8px',
                      textTransform: 'none'
                    }}
                    disabled={loading || isSubmitting}
                  >
                    Verify Email Now
                  </Button>
                </Box>
              )}
              
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography 
                  variant="body2" 
                  sx={{
                    color: 'rgba(0, 0, 0, 0.7)',
                    fontSize: isMobile ? '12px' : '14px',
                    '& a': {
                      color: '#4a90e2',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }
                  }}
                >
                  <Link to='/forgot-password' style={{ marginRight: '10px' }}>
                    Forgot Password?
                  </Link>
                </Typography>
                
                <Typography 
                  variant="body2" 
                  sx={{
                    mt: 1,
                    color: 'rgba(0, 0, 0, 0.7)',
                    fontSize: isMobile ? '12px' : '14px',
                    '& a': {
                      color: '#4a90e2',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }
                  }}
                >
                  Don't have an account?{' '}
                  <Link to="/register" style={{ color: '#4a90e2', textDecoration: 'none' }}>
                    Sign up
                  </Link>
                </Typography>
              </Box>
            </Box>
          </LoginFormContainer>
        </LoginContent>
      </LoginWrapper>
    </ThemeProvider>
  );
};

export default LoginPage;


