/**
 * Centralized Date Formatting Utility
 * All dates in the application should use DD/MM/YYYY format
 */

/**
 * Format a date to DD/MM/YYYY format
 * @param {Date|string|number} date - Date object, ISO string, or timestamp
 * @returns {string} Formatted date string in DD/MM/YYYY format
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) return '';
    
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Format a date to DD/MM/YYYY HH:MM format
 * @param {Date|string|number} date - Date object, ISO string, or timestamp
 * @returns {string} Formatted date string with time
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) return '';
    
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return '';
  }
};

/**
 * Format a date for input fields (YYYY-MM-DD)
 * @param {Date|string|number} date - Date object, ISO string, or timestamp
 * @returns {string} Formatted date string in YYYY-MM-DD format for input fields
 */
export const formatDateForInput = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) return '';
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date for input:', error);
    return '';
  }
};

/**
 * Parse DD/MM/YYYY string to Date object
 * @param {string} dateString - Date string in DD/MM/YYYY format
 * @returns {Date|null} Date object or null if invalid
 */
export const parseDateString = (dateString) => {
  if (!dateString) return null;
  
  try {
    const parts = dateString.split('/');
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const year = parseInt(parts[2], 10);
    
    const date = new Date(year, month, day);
    
    // Validate the date
    if (isNaN(date.getTime())) return null;
    if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
      return null; // Invalid date (e.g., 31/02/2024)
    }
    
    return date;
  } catch (error) {
    console.error('Error parsing date string:', error);
    return null;
  }
};

/**
 * Format date with month name (e.g., "15 Jan 2024")
 * @param {Date|string|number} date - Date object, ISO string, or timestamp
 * @returns {string} Formatted date string with month name
 */
export const formatDateWithMonthName = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) return '';
    
    const day = dateObj.getDate();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    
    return `${day} ${month} ${year}`;
  } catch (error) {
    console.error('Error formatting date with month name:', error);
    return '';
  }
};

/**
 * Format date range
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {string} Formatted date range string
 */
export const formatDateRange = (startDate, endDate) => {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  
  if (!start && !end) return '';
  if (!end) return start;
  if (!start) return end;
  
  return `${start} - ${end}`;
};

/**
 * Get relative date string (Today, Yesterday, etc.)
 * @param {Date|string|number} date - Date to format
 * @returns {string} Relative date string or formatted date
 */
export const getRelativeDateString = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Reset time parts for comparison
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    dateObj.setHours(0, 0, 0, 0);
    
    if (dateObj.getTime() === today.getTime()) {
      return 'Today';
    } else if (dateObj.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return formatDate(date);
    }
  } catch (error) {
    return formatDate(date);
  }
};

/**
 * Helper to pad numbers to 2 digits
 */
const pad2 = (n) => String(n).padStart(2, '0');

/**
 * Month names array for conversion
 */
export const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * Convert year, month name, and day to ISO date string (YYYY-MM-DD)
 * This avoids timezone issues by keeping dates as strings
 * @param {number} year - Full year (e.g., 2024)
 * @param {string} monthName - Month name (e.g., "January")
 * @param {number} day - Day of month (1-31)
 * @returns {string} ISO date string (YYYY-MM-DD)
 */
export const toISODate = (year, monthName, day) => {
  if (!year || !monthName || !day) return '';
  const monthIndex = monthNames.indexOf(monthName);
  if (monthIndex === -1) return '';
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
};

/**
 * Parse ISO date string to components
 * @param {string} isoDate - Date string in YYYY-MM-DD format
 * @returns {object} Object with year, month (name), and day
 */
export const fromISODate = (isoDate) => {
  if (!isoDate) return { year: '', month: '', day: '' };
  
  try {
    const dateStr = typeof isoDate === 'string' ? isoDate : isoDate.toISOString();
    const [year, month, day] = dateStr.slice(0, 10).split('-').map(Number);
    
    return {
      year,
      month: monthNames[month - 1] || '',
      day
    };
  } catch (error) {
    console.error('Error parsing ISO date:', error);
    return { year: '', month: '', day: '' };
  }
};

/**
 * Compare two ISO date strings
 * @param {string} date1 - First date (YYYY-MM-DD)
 * @param {string} date2 - Second date (YYYY-MM-DD)
 * @returns {number} -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export const compareISODates = (date1, date2) => {
  if (!date1 || !date2) return 0;
  if (date1 === date2) return 0;
  return date1 < date2 ? -1 : 1;
};

/**
 * Export default object with all functions
 */
export default {
  formatDate,
  formatDateTime,
  formatDateForInput,
  parseDateString,
  formatDateWithMonthName,
  formatDateRange,
  getRelativeDateString,
  toISODate,
  fromISODate,
  compareISODates,
  monthNames
};
