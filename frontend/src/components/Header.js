import React, { useState, useEffect, useRef } from "react";
import api, { getAssetUrl } from "../api/axiosInstance";
import {
  Container,
  Navbar,
  Nav,
  NavDropdown,
  Button,
  Badge,
  Toast,
  Spinner,
} from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutUser } from "../redux/authSlice";
import {
  FaBars,
  FaBell,
  FaCog,
  FaUserCircle,
  FaSignOutAlt,
  FaSignInAlt,
  FaHome,
} from "react-icons/fa";
import { timesheetService } from "../services/timesheetService";
import "./Header.css";
import { useSidebar } from "../Context";
import NotificationSidebar from "./NotificationSidebar";
import { useNotifications } from "../context/NotificationContext";

const Header = () => {
  // First, get all the hooks and context values
  const { toggleSidebar } = useSidebar();
  const { getUserUnreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  // Then declare all your state variables
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showNotificationSidebar, setShowNotificationSidebar] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [navExpanded, setNavExpanded] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const isLoggedIn = Boolean(localStorage.getItem("token"));

  // Create refs
  const profileMenuRef = useRef(null);
  const navbarCollapseRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const timerStartTimeRef = useRef(null);

  // Get data from localStorage
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const employeeId =
    profileData?.Emp_ID || localStorage.getItem("employeeId") || "EMP123";

  // Now you can safely use userId
  const userUnreadCount = getUserUnreadCount(userId);

  const [companyLogo, setCompanyLogo] = useState(
    "https://res.cloudinary.com/dfl9rotoy/image/upload/v1741065300/logo2-removebg-preview_p6juhh.png"
  );

  const [logoLoading, setLogoLoading] = useState(false);

  // Add a new useEffect to fetch the company logo
  useEffect(() => {
    const fetchCompanyLogo = async () => {
      if (!isLoggedIn) return;

      try {
        setLogoLoading(true);
        const response = await api.get("/companies/logo");
        if (response.data && response.data.logoUrl) {
          // Use getAssetUrl to handle both S3 and local URLs properly
          const processedLogoUrl = getAssetUrl(response.data.logoUrl);
          setCompanyLogo(processedLogoUrl);
        }
      } catch (error) {
        console.error("Error fetching company logo:", error);
        // Keep the default logo if there's an error
      } finally {
        setLogoLoading(false);
      }
    };

    fetchCompanyLogo();
  }, [isLoggedIn]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    // If token exists but is expired or invalid, handle accordingly
    if (token) {
      // You could add token validation logic here if needed
    }
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) {
        return; // Don't fetch if not logged in
      }

      try {
        setProfileLoading(true);
        // Use the by-user endpoint from employeesRouter.js with authentication
        const response = await api.get(`/employees/by-user/${userId}`);

        if (response.data.success) {
          setProfileData(response.data.data);

          // Store employee ID in localStorage if not already there
          if (response.data.data.Emp_ID) {
            localStorage.setItem("employeeId", response.data.data.Emp_ID);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Get profile image URL
  const getProfileImageUrl = () => {
    if (profileData?.personalInfo?.employeeImage) {
      return getAssetUrl(profileData.personalInfo.employeeImage);
    }
    return null;
  };

  const toggleNotificationSidebar = () => {
    setShowNotificationSidebar(!showNotificationSidebar);
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (profileData?.personalInfo) {
      const { firstName, lastName } = profileData.personalInfo;
      return `${firstName || ""} ${lastName || ""}`.trim() || employeeId;
    }
    return employeeId;
  };

  // Get user initials for fallback
  const getUserInitials = () => {
    if (profileData?.personalInfo) {
      const { firstName, lastName } = profileData.personalInfo;
      const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : "";
      const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : "";
      return firstInitial + lastInitial;
    }
    return employeeId ? employeeId.charAt(0).toUpperCase() : "U";
  };

  // Add this useEffect to handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      initializeTimesheet();
      return cleanupTimesheet;
    }
  }, [isLoggedIn]);

  const initializeTimesheet = async () => {
    try {
      const response = await timesheetService.getTodayTimesheet(
        employeeId,
        token
      );
      const timesheet = response.data.timesheet;

      if (timesheet && timesheet.status === "active") {
        const checkInTime = new Date(timesheet.checkInTime);
        startTimerWithTime(checkInTime);
      }
    } catch (error) {
      console.error("Error initializing timesheet:", error);
      showToastMessage("Failed to load timesheet status");
    }
  };

  const startTimerWithTime = (checkInTime) => {
    setStartTime(checkInTime);
    setIsTimerRunning(true);
    timerStartTimeRef.current = checkInTime;
    localStorage.setItem("checkInTime", checkInTime.toISOString());

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    timerIntervalRef.current = setInterval(() => {
      const currentTime = new Date();
      const elapsedSeconds = Math.floor((currentTime - checkInTime) / 1000);
      setTimer(elapsedSeconds);
    }, 1000);
  };

  const cleanupTimesheet = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
  };

  const handleTimerClick = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      if (isTimerRunning) {
        // Check-out logic remains the same
        const checkInTime = new Date(startTime);
        const checkOutTime = new Date();
        const durationInSeconds = Math.floor(
          (checkOutTime - checkInTime) / 1000
        );

        await timesheetService.checkOut(employeeId, durationInSeconds, token);
        cleanupTimesheet();
        setIsTimerRunning(false);
        setTimer(0);
        setStartTime(null);
        localStorage.removeItem("checkInTime");
        showToastMessage("Successfully logged out");
      } else {
        // Enhanced check-in logic
        const employeeName = getUserDisplayName();

        try {
          // Try normal check-in first
          const response = await timesheetService.checkIn(
            employeeId,
            employeeName,
            token
          );

          const checkInTime = new Date(response.data.checkInTime);
          startTimerWithTime(checkInTime);

          // Show warning if there was an auto check-out
          if (response.data.warning) {
            showToastMessage(response.data.warning, "warning");
          } else {
            showToastMessage("Successfully logged in");
          }
        } catch (error) {
          if (
            error.response?.status === 400 &&
            error.response?.data?.message === "Already checked in"
          ) {
            // Show confirmation dialog for force check-in
            const shouldForceCheckIn = window.confirm(
              "You have an active session. This might be due to an unexpected shutdown. " +
                "Would you like to start a new session? (This will auto-complete the previous session)"
            );

            if (shouldForceCheckIn) {
              const forceResponse = await timesheetService.forceCheckIn(
                employeeId,
                employeeName,
                token
              );

              const checkInTime = new Date(forceResponse.data.checkInTime);
              startTimerWithTime(checkInTime);
              showToastMessage(
                forceResponse.data.message || "New session started"
              );
            }
          } else {
            throw error; // Re-throw other errors
          }
        }
      }
    } catch (error) {
      console.error("Timesheet operation failed:", error);
      showToastMessage("Operation failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Replace the handleNavToggle function with this more direct approach
  const handleNavToggle = () => {
    setNavExpanded(!navExpanded);

    // If we're closing the navbar, also close the profile menu
    if (navExpanded) {
      setShowProfileMenu(false);
    }
  };

  // Replace the closeNavbar function with this more direct approach
  const closeNavbar = () => {
    setNavExpanded(false);

    // Direct DOM manipulation to ensure the navbar closes
    const navbarToggler = document.querySelector(".navbar-toggler");
    const navbarCollapse = document.querySelector(".navbar-collapse");

    if (navbarCollapse && navbarCollapse.classList.contains("show")) {
      // If the navbar is expanded, click the toggle button to collapse it
      if (navbarToggler) {
        navbarToggler.click();
      } else {
        // Fallback: manually remove the 'show' class
        navbarCollapse.classList.remove("show");
      }
    }
  };

  const handleProfileToggle = (e) => {
    // Prevent event propagation to avoid immediate closing on mobile
    e.stopPropagation();
    setShowProfileMenu((prev) => !prev);
  };

  const handleClickOutside = (e) => {
    if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
      setShowProfileMenu(false);
    }
  };

  // Add this function to handle dropdown item clicks
  const handleDropdownItemClick = (callback) => {
    // Close the dropdown first
    setShowProfileMenu(false);
    // Close the navbar on mobile
    closeNavbar();
    // Then execute the callback (like navigation)
    if (callback) callback();
  };

  // Add this useEffect to handle clicks outside the navbar
  useEffect(() => {
    function handleClickOutside(event) {
      // If the navbar is expanded and the click is outside the navbar
      if (
        navExpanded &&
        !event.target.closest(".navbar-collapse") &&
        !event.target.closest(".navbar-toggler")
      ) {
        closeNavbar();
      }

      // Close profile menu when clicking outside
      if (
        showProfileMenu &&
        !event.target.closest(".profile-dropdown-container") &&
        !event.target.closest(".custom-dropdown-menu")
      ) {
        setShowProfileMenu(false);
      }
    }

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      // Remove event listener on cleanup
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [navExpanded, showProfileMenu]);

  const handleLogout = async () => {
    try {
      // Clean up timesheet first
      cleanupTimesheet();

      // Clear profile data
      setProfileData(null);

      // Dispatch Redux logout action
      await dispatch(logoutUser());

      // Clear all localStorage items
      localStorage.removeItem("token");
      localStorage.removeItem("employeeId");
      localStorage.removeItem("userId");
      localStorage.removeItem("checkInTime");
      localStorage.removeItem("companyCode");
      localStorage.removeItem("tokenExpiry"); // Clear token expiry if you're using it

      // Clear any other auth-related items
      localStorage.removeItem("userInfo");
      localStorage.removeItem("refreshToken");

      // Show logout message
      showToastMessage("Successfully logged out");

      // Navigate to login immediately
      navigate("/login", {
        state: {
          authError: "You have been logged out successfully.",
        },
        replace: true,
      });
    } catch (error) {
      console.error("Logout error:", error);

      // Even if there's an error, force logout by clearing everything
      cleanupTimesheet();
      setProfileData(null);

      // Clear localStorage regardless of error
      localStorage.clear();

      // Navigate to login
      navigate("/login", {
        state: {
          authError: "Logout completed.",
        },
        replace: true,
      });
    }
  };

  const getPathIndicator = () => {
    const path = location.pathname.split("/").filter(Boolean);

    // Special case for sensitive routes
    if (path.includes("reset-password")) {
      return (
        <span>
          <span
            className="path-link"
            onClick={() => navigate("/")}
            style={{
              cursor: "pointer",
              color: "#fff",
              textDecoration: "none",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
          >
            Home
          </span>
          {" > "}
          <span
            className="path-link"
            style={{
              color: "#fff",
              textDecoration: "none",
            }}
          >
            Reset Password
          </span>
        </span>
      );
    }

    // Regular path handling for other routes
    return path.map((segment, index) => {
      // Format the segment for display (capitalize, replace hyphens with spaces)
      let displaySegment = segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      // Truncate very long segments (like tokens)
      if (displaySegment.length > 20) {
        displaySegment = displaySegment.substring(0, 10) + "...";
      }

      return (
        <span key={index}>
          <span
            className="path-link"
            onClick={() => navigate(`/${path.slice(0, index + 1).join("/")}`)}
            style={{
              cursor: "pointer",
              color: "#fff",
              textDecoration: "none",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
          >
            {displaySegment}
          </span>
          {index < path.length - 1 && " > "}
        </span>
      );
    });
  };

  return (
    <>
      {isLoggedIn && (
        <NotificationSidebar
          show={showNotificationSidebar}
          onClose={() => setShowNotificationSidebar(false)}
        />
      )}
      <header className="mb-5">
        <Navbar
          className="custom-navbar"
          expand="lg"
          variant="dark"
          fixed="top"
          expanded={navExpanded}
          onToggle={handleNavToggle}
          ref={navbarCollapseRef}
        >
          <Container fluid>
            {isLoggedIn && (
              <Button variant="link" className="me-3" onClick={toggleSidebar}>
                <FaBars size={28} color="white" />
              </Button>
            )}

            <LinkContainer to="/">
              <Navbar.Brand className="brand">
                {logoLoading ? (
                  <Spinner animation="border" variant="light" size="sm" />
                ) : (
                  <img
                    src={companyLogo}
                    alt="Company Logo"
                    style={{
                      width: "auto",
                      maxHeight: "120px",
                      marginLeft: "0",
                      verticalAlign: "middle",
                    }}
                    className="responsive-logo"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        "https://res.cloudinary.com/dfl9rotoy/image/upload/v1741065300/logo2-removebg-preview_p6juhh.png";
                    }}
                  />
                )}
              </Navbar.Brand>
            </LinkContainer>

            <div className="path-indicator">{getPathIndicator()}</div>

            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse
              id="basic-navbar-nav"
              className="navbar-collapse-container"
            >
              <Nav className="ms-auto align-items-center">
                <div className="d-flex align-items-center">
                  {/* upto this */}
                  {isLoggedIn && (
                    <div className="check-in-out-box">
                      <Button
                        className={`timer-button ${
                          isTimerRunning ? "active" : ""
                        }`}
                        onClick={() => {
                          handleTimerClick();
                          closeNavbar();
                        }}
                        title={
                          isTimerRunning
                            ? "Click to Check-out"
                            : "Click to Check-in"
                        }
                        aria-label={isTimerRunning ? "Check out" : "Check in"}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Spinner animation="border" size="sm" />
                        ) : isTimerRunning ? (
                          <>
                            <div className="timer-icon-container">
                              <FaSignOutAlt className="timer-icon rotate" />
                            </div>
                            <div className="timer-content">
                              <span className="timer-label">Check-out</span>
                              <span className="timer-value">{`${formatTime(
                                timer
                              )}`}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="timer-icon-container">
                              <FaSignInAlt className="timer-icon beat" />
                            </div>
                            <div className="timer-content">
                              <span className="timer-label">Check-in</span>
                            </div>
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  <Nav.Link
                    className="icon-link ms-3"
                    onClick={() => {
                      navigate("/");
                      closeNavbar();
                    }}
                  >
                    <FaHome size={32} title="Home" />
                  </Nav.Link>
                  {isLoggedIn && (
                    <Nav.Link
                      className="icon-link ms-3 position-relative"
                      onClick={toggleNotificationSidebar}
                      title="Notifications"
                    >
                      <FaBell size={24} />
                      {userUnreadCount > 0 && (
                        <Badge
                          pill
                          bg="danger"
                          className="position-absolute"
                          style={{
                            top: "-5px",
                            right: "-5px",
                            fontSize: "0.6rem",
                            padding: "0.25em 0.4em",
                          }}
                        >
                          {userUnreadCount > 99 ? "99+" : userUnreadCount}
                        </Badge>
                      )}
                    </Nav.Link>
                  )}
                  <div className="profile-dropdown-container">
                    {windowWidth <= 1024 ? (
                      <>
                        <div
                          className="profile-dropdown-toggle"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowProfileMenu(!showProfileMenu);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            cursor: "pointer",
                          }}
                        >
                          {profileLoading ? (
                            <Spinner
                              animation="border"
                              size="sm"
                              variant="light"
                            />
                          ) : isLoggedIn && getProfileImageUrl() ? (
                            <>
                              <img
                                src={getProfileImageUrl()}
                                alt="Profile"
                                style={{
                                  width: "28px",
                                  height: "28px",
                                  borderRadius: "50%",
                                  objectFit: "cover",
                                  border: "1px solid white",
                                }}
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.nextSibling.style.display = "flex";
                                }}
                              />
                              <div
                                style={{
                                  width: "28px",
                                  height: "28px",
                                  borderRadius: "50%",
                                  backgroundColor: "#6366f1",
                                  color: "white",
                                  display: "none",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                  border: "1px solid white",
                                }}
                              >
                                {getUserInitials()}
                              </div>
                            </>
                          ) : (
                            <FaUserCircle size={28} color="white" />
                          )}
                        </div>

                        {showProfileMenu && (
                          <div className="custom-dropdown-menu">
                            {isLoggedIn ? (
                              <>
                                <div className="dropdown-header d-flex align-items-center px-3 py-2">
                                  <strong>{getUserDisplayName()}</strong>
                                  {profileData?.Emp_ID && (
                                    <small className="ms-2 text-muted">
                                      ({profileData.Emp_ID})
                                    </small>
                                  )}
                                </div>
                                <div
                                  className="dropdown-item"
                                  onClick={() => {
                                    setShowProfileMenu(false);
                                    closeNavbar();
                                    navigate("Dashboards/profile");
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      alignItems: "center",
                                    }}
                                  >
                                    <FaUserCircle
                                      style={{
                                        fontSize: "24px",
                                        marginBottom: "5px",
                                      }}
                                    />
                                    <span>My Profile</span>
                                  </div>
                                </div>
                                <div
                                  className="dropdown-item"
                                  onClick={() => {
                                    console.log(
                                      "Change password clicked, navigating to /auth/change-password"
                                    );
                                    setShowProfileMenu(false);
                                    closeNavbar();
                                    navigate("/auth/change-password"); // Update this path to match your router configuration
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      alignItems: "center",
                                    }}
                                  >
                                    <FaCog
                                      style={{
                                        fontSize: "24px",
                                        marginBottom: "5px",
                                      }}
                                    />
                                    <span>Change Password</span>
                                  </div>
                                </div>
                                <div
                                  className="dropdown-item logout-item"
                                  onClick={() => {
                                    setShowProfileMenu(false);
                                    closeNavbar();
                                    handleLogout();
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      alignItems: "center",
                                    }}
                                  >
                                    <FaSignOutAlt
                                      style={{
                                        fontSize: "24px",
                                        marginBottom: "5px",
                                      }}
                                    />
                                    <span>Logout</span>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div
                                className="dropdown-item login-item"
                                onClick={() => {
                                  setShowProfileMenu(false);
                                  closeNavbar();
                                  navigate("/login");
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                  }}
                                >
                                  <FaSignInAlt
                                    style={{
                                      fontSize: "24px",
                                      marginBottom: "5px",
                                    }}
                                  />
                                  <span>Login</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      // Desktop version with similar changes
                      <NavDropdown
                        title={
                          profileLoading ? (
                            <Spinner
                              animation="border"
                              size="sm"
                              variant="light"
                            />
                          ) : isLoggedIn && getProfileImageUrl() ? (
                            <>
                              <img
                                src={getProfileImageUrl()}
                                alt="Profile"
                                style={{
                                  width: "28px",
                                  height: "28px",
                                  borderRadius: "50%",
                                  objectFit: "cover",
                                  border: "1px solid white",
                                }}
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.nextSibling.style.display = "flex";
                                }}
                              />
                              <div
                                style={{
                                  width: "28px",
                                  height: "28px",
                                  borderRadius: "50%",
                                  backgroundColor: "#6366f1",
                                  color: "white",
                                  display: "none",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                  border: "1px solid white",
                                }}
                              >
                                {getUserInitials()}
                              </div>
                            </>
                          ) : (
                            <FaUserCircle size={28} color="white" />
                          )
                        }
                        id="profile-dropdown"
                        show={showProfileMenu}
                        onClick={handleProfileToggle}
                        ref={profileMenuRef}
                        align="end"
                        className="profile-dropdown ms-3"
                        menuVariant="dark"
                      >
                        {isLoggedIn ? (
                          <>
                            <div className="dropdown-header d-flex align-items-center px-3 py-2">
                              <strong>{getUserDisplayName()}</strong>
                              {profileData?.Emp_ID && (
                                <small className="ms-2 text-muted">
                                  ({profileData.Emp_ID})
                                </small>
                              )}
                            </div>
                            <NavDropdown.Item
                              onClick={() =>
                                handleDropdownItemClick(() =>
                                  navigate("/Dashboards/profile")
                                )
                              }
                            >
                              My Profile
                            </NavDropdown.Item>
                            <NavDropdown.Item
                              onClick={() =>
                                handleDropdownItemClick(() =>
                                  navigate("/change-password")
                                )
                              }
                            >
                              Change Password
                            </NavDropdown.Item>
                            <NavDropdown.Divider />
                            <NavDropdown.Item
                              onClick={() =>
                                handleDropdownItemClick(handleLogout)
                              }
                              className="logout-item"
                            >
                              <FaSignOutAlt className="me-2" /> Logout
                            </NavDropdown.Item>
                          </>
                        ) : (
                          <NavDropdown.Item
                            onClick={() =>
                              handleDropdownItemClick(() => navigate("/login"))
                            }
                            className="login-item"
                          >
                            <FaSignInAlt className="me-2" /> Login
                          </NavDropdown.Item>
                        )}
                      </NavDropdown>
                    )}
                  </div>
                </div>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={3000}
          autohide
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 9999,
          }}
        >
          <Toast.Body>{toastMessage}</Toast.Body>
        </Toast>
      </header>
    </>
  );
};

export default Header;
