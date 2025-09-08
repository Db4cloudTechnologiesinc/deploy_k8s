import React from "react";
import { FaChartBar } from "react-icons/fa";
import { Nav } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux';
import { selectIsAuthenticated, logoutUser } from '../../redux/authSlice';

import "./MainScreen.css";

const items = [{ title: "Dashboards", icon: <FaChartBar />, delay: "0.9s" }];

const MainScreen = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Function to validate authentication (similar to PrivateRoute logic)
  const validateAuthentication = () => {
    const token = localStorage.getItem('token');
    const companyCode = localStorage.getItem('companyCode');
    
    // Check if Redux says authenticated but token is missing
    if (isAuthenticated && !token) {
      console.log('MainScreen: Token missing but Redux state is authenticated, dispatching logout');
      dispatch(logoutUser());
      return false;
    }
    
    // Check if company code is missing
    if (!companyCode) {
      console.log('MainScreen: Company code missing, dispatching logout');
      if (isAuthenticated) {
        dispatch(logoutUser());
      }
      return false;
    }
    
    // Check if both Redux state and localStorage are consistent
    if (isAuthenticated && token && companyCode) {
      return true;
    }
    
    return false;
  };

  // Function to handle dashboard navigation
  const handleDashboardClick = (e) => {
    e.preventDefault();
    
    if (validateAuthentication()) {
      // User is authenticated, navigate to dashboard
      console.log('MainScreen: User authenticated, navigating to dashboard');
      navigate('/dashboards');
    } else {
      // User is not authenticated, navigate to login
      console.log('MainScreen: User not authenticated, redirecting to login');
      navigate('/login', { 
        state: { 
          from: { pathname: '/dashboards' },
          authError: 'Please login to access the dashboard'
        }
      });
    }
  };

  return (
    <div className="hrms-main-wrapper">

      <div className="hrms-content-container">
        <div className="hrms-intro-container">
          <h1 className="hrms-intro-title">
            Welcome to <span className="company-name">DB4People</span> HRMS
          </h1>

          <p className="hrms-intro-text">
            Transform your HR operations with our comprehensive Human Resource
            Management System. DB4People HRMS streamlines your workforce
            management with powerful tools for employee data management,
            attendance tracking, payroll processing, and performance evaluation.
          </p>
          <p className="hrms-intro-text">
            Built for the modern workplace, our cloud-based solution ensures
            secure access to your HR data anytime, anywhere, while maintaining
            the highest standards of data protection and compliance.
          </p>
        </div>
        <div className="hrms-icon-container">
          {items.map((item, index) => (
            <div
              key={index}
              className="dashboard-link"
              onClick={handleDashboardClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleDashboardClick(e);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`Navigate to ${item.title}`}
              style={{ cursor: 'pointer' }}
            >
              <div
                className="hrms-icon-wrapper"
                style={{ animationDelay: item.delay }}
              >
                <div className="hrms-icon-circle">{item.icon}</div>
                <div className="hrms-icon-label">{item.title}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MainScreen;