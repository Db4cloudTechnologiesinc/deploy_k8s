import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { motion } from 'framer-motion';

import PaymentGateway from '../../components/PaymentGateway';
import authService from '../api/auth';

const PaymentPage = () => {
  const { companyCode } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [companyData, setCompanyData] = useState(null);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  useEffect(() => {
    if (companyCode) {
      fetchCompanyPaymentInfo();
    }
  }, [companyCode]);

  const fetchCompanyPaymentInfo = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching payment info for company:', companyCode);
      const response = await authService.getPaymentLink(companyCode);
      
      console.log('Payment info response:', response);
      setCompanyData(response.company);
      
    } catch (err) {
      console.error('Error fetching company payment info:', err);
      console.error('Error details:', {
        status: err.response?.status,
        message: err.response?.data?.message,
        data: err.response?.data
      });
      
      // Provide more specific error messages
      let errorMessage = 'Failed to load payment information';
      if (err.response?.status === 404) {
        errorMessage = 'Company not found. Please check the company code.';
      } else if (err.response?.status === 400 && err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentDetails) => {
    setPaymentCompleted(true);
    setShowPaymentGateway(false);
    
    // Show success message and redirect after delay
    setTimeout(() => {
      navigate('/login', {
        state: {
          message: `Payment successful! ₹${paymentDetails.amount} has been processed. Your company account is now active.`,
          type: 'success'
        }
      });
    }, 3000);
  };

  const handlePaymentFailure = (error) => {
    setShowPaymentGateway(false);
    setError(`Payment failed: ${error.message || 'Unknown error'}. Please try again.`);
  };

  const handlePaymentClose = () => {
    setShowPaymentGateway(false);
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(45deg, #1e3c72 0%, #2a5298 100%)'
        }}
      >
        <CircularProgress size={60} sx={{ color: 'white' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#ffffff'
      }}
    >


      <Container maxWidth="md" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Paper
            elevation={8}
            sx={{
              p: 4,
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #e0e0e0',
              boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* Header */}
            <Box textAlign="center" mb={4}>
              <Typography variant="h3" fontWeight="bold" color="primary" gutterBottom>
                Complete Payment
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Activate Your HRMS Account
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {paymentCompleted ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Card sx={{ backgroundColor: '#e8f5e8', border: '2px solid #4caf50' }}>
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h4" sx={{ color: '#2e7d32', mb: 2 }}>
                      🎉 Payment Successful!
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#2e7d32', mb: 2 }}>
                      Your HRMS account is now active
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Redirecting to login page in a few seconds...
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            ) : companyData ? (
              <>
                {/* Company Information */}
                <Card sx={{ mb: 4, background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                      {companyData.name}
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      Company Code: <strong>{companyData.companyCode}</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      Contact Email: <strong>{companyData.contactEmail}</strong>
                    </Typography>
                  </CardContent>
                </Card>

                {/* Payment Details */}
                <Card sx={{ mb: 4 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
                      Payment Details
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemText 
                          primary="HRMS Registration Fee" 
                          secondary="One-time setup and activation fee"
                        />
                        <Typography variant="h6" fontWeight="bold" color="primary">
                          ₹20,000
                        </Typography>
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemText 
                          primary={<Typography fontWeight="bold">Total Amount</Typography>}
                        />
                        <Typography variant="h5" fontWeight="bold" color="primary">
                          ₹20,000
                        </Typography>
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>

                {/* What's Included */}
                <Card sx={{ mb: 4, backgroundColor: '#f8f9fa' }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
                      What's Included
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="✅ Complete HRMS system access" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="✅ Employee management tools" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="✅ Payroll management system" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="✅ Attendance tracking" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="✅ Leave management" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="✅ 365 days of service" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="✅ Technical support" />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>

                {/* Payment Button */}
                <Box textAlign="center">
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => setShowPaymentGateway(true)}
                    sx={{
                      py: 2,
                      px: 6,
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                      }
                    }}
                  >
                    Proceed to Payment
                  </Button>
                </Box>
              </>
            ) : (
              <Alert severity="info">
                Loading payment information...
              </Alert>
            )}

            {/* Back to Login */}
            <Box textAlign="center" mt={4}>
              <Button
                variant="text"
                onClick={() => navigate('/login')}
                sx={{ color: 'text.secondary' }}
              >
                Back to Login
              </Button>
            </Box>

            {/* Debug Information */}
            {process.env.NODE_ENV === 'development' && (
              <Paper sx={{ mt: 2, p: 2, bgcolor: 'grey.100' }}>
                <Typography variant="caption" color="text.secondary">
                  <strong>Debug Info:</strong><br/>
                  Company Code: {companyCode}<br/>
                  API URL: {process.env.REACT_APP_API_URL || 'http://localhost:5002'}<br/>
                  Error: {error || 'None'}<br/>
                  Company Data: {companyData ? 'Loaded' : 'Not loaded'}
                </Typography>
              </Paper>
            )}
          </Paper>
        </motion.div>

        {/* Payment Gateway Modal */}
        {companyData && (
          <PaymentGateway
            open={showPaymentGateway}
            onClose={handlePaymentClose}
            companyCode={companyData.companyCode}
            adminEmail={companyData.contactEmail}
            companyName={companyData.name}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentFailure={handlePaymentFailure}
          />
        )}
      </Container>
    </Box>
  );
};

export default PaymentPage;
