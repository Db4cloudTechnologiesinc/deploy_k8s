// RegisterPage.js
import { useState } from 'react';
import api from '../../../api/axiosInstance';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Box, Button, TextField, Typography, Container, InputAdornment, IconButton, Grid, LinearProgress } from '@mui/material';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

import "./RegisterPage.css";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Apply sentence case formatting to name fields
    if (name === 'firstName' || name === 'middleName' || name === 'lastName') {
      // Convert to sentence case (first letter uppercase, rest lowercase)
      const formattedValue = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      setFormData({ ...formData, [name]: formattedValue });
    } else {
      // For non-name fields, use the value as is
      setFormData({ ...formData, [name]: value });
    }
    
    setError('');
  
    // Check password strength when password field changes
    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (password) => {
    // Initialize strength as 0
    let strength = 0;
    let feedback = [];

    // If password is empty, return
    if (password.length === 0) {
      setPasswordStrength(0);
      setPasswordFeedback('');
      return;
    }

    // Check length
    if (password.length < 8) {
      feedback.push("Password should be at least 8 characters");
    } else {
      strength += 20;
    }

    // Check for lowercase letters
    if (password.match(/[a-z]/)) {
      strength += 20;
    } else {
      feedback.push("Include lowercase letters");
    }

    // Check for uppercase letters
    if (password.match(/[A-Z]/)) {
      strength += 20;
    } else {
      feedback.push("Include uppercase letters");
    }

    // Check for numbers
    if (password.match(/[0-9]/)) {
      strength += 20;
    } else {
      feedback.push("Include numbers");
    }

    // Check for special characters
    if (password.match(/[^a-zA-Z0-9]/)) {
      strength += 20;
    } else {
      feedback.push("Include special characters");
    }

    setPasswordStrength(strength);
    setPasswordFeedback(feedback.join(', '));
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return 'error';
    if (passwordStrength < 80) return 'warning';
    return 'success';
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const validateForm = () => {
    // Check required fields
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }

    // Check password strength
    if (passwordStrength < 60) {
      setError('Password is not strong enough. ' + passwordFeedback);
      return false;
    }

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      return false;
    }

    return true;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
  
    // Prepare data for API - combine name fields
    const apiData = {
      ...formData,
      name: `${formData.firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName}`.trim()
    };
  
    // Add this debug log
    console.log('Sending registration data:', apiData);
    
    try {
      await api.post('auth/register', apiData);
      alert('OTP sent to email. Please verify.');
      setOtpSent(true);
      navigate('/verifyOtp', { state: { email: formData.email } });
    } catch (error) {
  
      if (error.response && error.response.status === 409) {
        setError('User already exists. Please try login!');
      } else {
        setError('An error occurred. Please try again.');
        console.error('Registration error:', error);
        
          console.error("Registration error: ", error);
          console.log("Error details: ", error.response?.data); // Add this
          console.log("Error status: ", error.response?.status); // Add this
          console.log("Error headers: ", error.response?.headers); // Add this
        
      }
    }
  };

  // Prepare data for API - combine name fields
const fullName = `${formData.firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName}`.trim();
const apiData = {
  ...formData,
  name: fullName || `${formData.firstName} ${formData.lastName}` // Fallback if the combined name is empty
};


  return (
    <div className="register-main-wrapper">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="register-content"
      >
        <Container
          component="main"
          maxWidth="xs"
          sx={{
            mt: 8,
            p: 4,
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            borderRadius: '20px',
            backgroundColor: '#ffffff',
            border: '1px solid #e0e0e0',
            boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.1)',
            '& .MuiTextField-root': {
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#ffffff',
                '& fieldset': {
                  borderColor: '#d0d0d0',
                },
                '&:hover fieldset': {
                  borderColor: '#b0b0b0',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#4a90e2',
                },
                '& input': {
                  color: '#333333',
                  '&::placeholder': {
                    color: '#888888',
                  },
                  '&:-webkit-autofill': {
            WebkitBoxShadow: '0 0 0 1000px #ffffff inset',
            WebkitTextFillColor: '#333333',
            caretColor: '#333333',
            transition: 'background-color 5000s ease-in-out 0s',
                },
                '&:-webkit-autofill:hover, &:-webkit-autofill:focus': {
            WebkitBoxShadow: '0 0 0 1000px #ffffff inset',
            WebkitTextFillColor: '#333333',
          },
        }
              },
              '& .MuiInputLabel-root': {
                color: '#666666',
              }
            }
          }}
        >
          <Typography
            variant="h4"
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
            Register
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <Grid container spacing={1}>
              <Grid item xs={4}>
                <TextField
                  margin="normal"
                  fullWidth
                  label="First Name"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  autoFocus
                  onChange={handleChange}
                  required
                  value={formData.firstName}
                  size="small"
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  margin="normal"
                  fullWidth
                  label="Middle Name"
                  name="middleName"
                  type="text"
                  autoComplete="additional-name"
                  onChange={handleChange}
                  value={formData.middleName}
                  size="small"
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  margin="normal"
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  onChange={handleChange}
                  required
                  value={formData.lastName}
                  size="small"
                />
              </Grid>
            </Grid>

            <TextField
              margin="normal"
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              autoComplete="email"
              onChange={handleChange}
              required
              value={formData.email}
            />
            
            <TextField
              margin="normal"
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              onChange={handleChange}
              required
              value={formData.password}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={togglePasswordVisibility}
                      edge="end"
                      sx={{ color: '#666666' }}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            {formData.password && (
              <>
                <LinearProgress 
                  variant="determinate" 
                  value={passwordStrength} 
                  color={getPasswordStrengthColor()}
                  sx={{ mt: 1, height: 8, borderRadius: 4 }}
                />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    display: 'block', 
                    mt: 0.5, 
                    color: passwordStrength < 40 ? '#f44336' : 
                           passwordStrength < 80 ? '#ff9800' : '#4caf50' 
                  }}
                >
                  {passwordStrength < 40 ? 'Weak' : 
                   passwordStrength < 80 ? 'Medium' : 'Strong'} 
                  {passwordFeedback && ` - ${passwordFeedback}`}
                </Typography>
              </>
            )}
            
            <TextField
              margin="normal"
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              onChange={handleChange}
              required
              value={formData.confirmPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={toggleConfirmPasswordVisibility}
                      edge="end"
                      sx={{ color: '#666666' }}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {error && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}

            <motion.div whileHover={{ scale: 1.05 }}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  mb: 2,
                  backgroundColor: '#4a90e2',
                  '&:hover': {
                    backgroundColor: '#357abd'
                  },
                  padding: '12px',
                  fontSize: '16px',
                  fontWeight: 600
                }}
              >
                Register
              </Button>
            </motion.div>
            <Typography
              variant="body2"
              sx={{
                mt: 2,
                textAlign: 'center',
                color: '#666666',
                '& a': {
                  color: '#4a90e2',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }
              }}
            >
              Already a user? <Link to='/login'>Login here</Link>
            </Typography>
          </Box>
        </Container>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
