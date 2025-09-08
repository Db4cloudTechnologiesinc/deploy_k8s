import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Paper,
  styled,
  ThemeProvider,
  createTheme,
  useMediaQuery
} from '@mui/material';
import { motion } from 'framer-motion';

import { 
  forgotPassword, 
  clearError, 
  setAuthError,
  selectAuthLoading,
  selectAuthError
} from '../../../redux/authSlice';

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

const ForgotPasswordPaper = styled(Paper)(({ theme }) => ({
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

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Use Redux selectors
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  
  // Media queries for responsive design
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  // Handle email input change
  const handleEmailChange = (e) => {
    setEmail(e.target.value.toLowerCase());
    if (error) dispatch(clearError());
    if (success) setSuccess('');
  };
  
  // Handle company code input change
  const handleCompanyCodeChange = (e) => {
    setCompanyCode(e.target.value.toUpperCase());
    if (error) dispatch(clearError());
    if (success) setSuccess('');
  };
  
  // Validate form
  const validateForm = useCallback(() => {
    if (!email.trim()) {
      dispatch(setAuthError('Email is required'));
      return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      dispatch(setAuthError('Please enter a valid email address'));
      return false;
    }
    
    if (!companyCode.trim()) {
      dispatch(setAuthError('Company code is required'));
      return false;
    }
    
    return true;
  }, [email, companyCode, dispatch]);
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const resultAction = await dispatch(forgotPassword({ email, companyCode }));
      
      if (forgotPassword.fulfilled.match(resultAction)) {
        setSuccess('Password reset instructions have been sent to your email.');
        // Clear form
        setEmail('');
        setCompanyCode('');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
    }
  };
  
  return (
    <ThemeProvider theme={theme}>
      <PageWrapper>
        <ContentContainer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ForgotPasswordPaper elevation={3}>
            <Typography 
              variant={isMobile ? "h5" : "h4"} 
              component="h1" 
              gutterBottom
              align="center"
              sx={{ fontWeight: 600 }}
            >
              Forgot Password
            </Typography>
            
            <Typography 
              variant="body1" 
              align="center" 
              sx={{ 
                mb: 3, 
                color: '#555',
                fontSize: isMobile ? '0.9rem' : '1rem',
                maxWidth: '90%'
              }}
            >
              Enter your email address and company code below. We'll send you instructions to reset your password.
            </Typography>
            
            {error && (
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
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={email}
                onChange={handleEmailChange}
                margin="normal"
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '8px',
                    '&.Mui-focused fieldset': {
                      borderColor: '#4a90e2',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#4a90e2',
                  },
                }}
              />
              
              <TextField
                required
                fullWidth
                id="companyCode"
                label="Company Code"
                name="companyCode"
                value={companyCode}
                onChange={handleCompanyCodeChange}
                margin="normal"
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '8px',
                    '&.Mui-focused fieldset': {
                      borderColor: '#4a90e2',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#4a90e2',
                  },
                }}
                inputProps={{
                  style: { textTransform: 'uppercase' }
                }}
              />
              
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
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <Button
                  component={Link}
                  to="/login"
                  variant="text"
                  color="primary"
                  sx={{ 
                    textTransform: 'none',
                    fontSize: isMobile ? '0.85rem' : '0.9rem',
                    mb: isMobile ? 1 : 0
                  }}
                >
                  Back to Login
                </Button>
                
                <Button
                  component={Link}
                  to="/register"
                  variant="text"
                  color="primary"
                  sx={{ 
                    textTransform: 'none',
                    fontSize: isMobile ? '0.85rem' : '0.9rem'
                  }}
                >
                  Register
                </Button>
              </Box>
            </Box>
          </ForgotPasswordPaper>
        </ContentContainer>
      </PageWrapper>
    </ThemeProvider>
  );
};

export default ForgotPassword;
