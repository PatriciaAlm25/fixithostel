/**
 * Backend API Service
 * Connects React frontend to Express.js backend API
 * Base URL: http://localhost:3000/api
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Store token in localStorage
const getToken = () => localStorage.getItem('authToken');
const setToken = (token) => localStorage.setItem('authToken', token);
const removeToken = () => localStorage.removeItem('authToken');

// Default fetch headers
const getHeaders = (includeAuth = true) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (includeAuth && getToken()) {
    headers['Authorization'] = `Bearer ${getToken()}`;
  }
  return headers;
};

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

/**
 * Send OTP to email
 */
export const sendOTP = async (email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to send OTP');
    return data;
  } catch (error) {
    console.error('❌ Send OTP Error:', error);
    throw error;
  }
};

/**
 * Test email configuration
 */
export const testEmail = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/test-email`, {
      method: 'GET',
      headers: getHeaders(false),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to test email');
    return data;
  } catch (error) {
    console.error('❌ Test Email Error:', error);
    throw error;
  }
};

/**
 * Register user with OTP verification
 */
export const register = async (userData) => {
  try {
    console.log('📤 Register Request:', userData);
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    console.log('📥 Register Response:', { status: response.status, data });
    if (!response.ok) throw new Error(data.message || 'Registration failed');
    if (data.token) {
      setToken(data.token);
    }
    return data;
  } catch (error) {
    console.error('❌ Register Error:', error);
    throw error;
  }
};

/**
 * Login with email and password
 */
export const login = async (email, password) => {
  try {
    console.log('📤 Login request to:', `${API_BASE_URL}/auth/login`);
    console.log('📧 Email:', email);
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ email, password }),
    });
    console.log('📥 Response status:', response.status);
    const data = await response.json();
    console.log('📥 Response data:', { 
      success: data.success, 
      message: data.message,
      hasUser: !!data.user,
      hasToken: !!data.token 
    });
    if (!response.ok) {
      const errorMsg = data.message || 'Login failed';
      console.error('❌ Login failed:', errorMsg);
      throw new Error(errorMsg);
    }
    if (data.token) {
      console.log('🔑 Saving token');
      setToken(data.token);
    }
    console.log('✅ Login successful');
    return data;
  } catch (error) {
    console.error('❌ Login Error:', error.message);
    throw error;
  }
};

/**
 * Get current user
 */
export const getCurrentUser = async () => {
  try {
    console.log('📥 Fetching current user...');
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: getHeaders(true),
    });
    const data = await response.json();
    
    console.log('📤 Current user response:', { 
      status: response.status, 
      success: data.success,
      hasUser: !!data.user 
    });
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get user');
    }
    
    // Return the user object, not the entire response
    if (data.user) {
      console.log('✅ Current user retrieved:', data.user.email);
      return data.user;
    }
    
    return data;
  } catch (error) {
    console.error('❌ Get Current User Error:', error.message);
    throw error;
  }
};

/**
 * Logout
 */
export const logout = () => {
  removeToken();
};

// ============================================================================
// ISSUE ENDPOINTS
// ============================================================================

/**
 * Create a new issue with image upload
 */
export const createIssue = async (formData) => {
  try {
    // For file upload, use FormData directly
    const response = await fetch(`${API_BASE_URL}/issues`, {
      method: 'POST',
      headers: {
        // Don't set Content-Type for FormData
        ...(getToken() && { 'Authorization': `Bearer ${getToken()}` }),
      },
      body: formData, // FormData object
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create issue');
    return data;
  } catch (error) {
    console.error('❌ Create Issue Error:', error);
    throw error;
  }
};

/**
 * Get all issues with optional filters
 */
export const getIssues = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE_URL}/issues?${params}`, {
      method: 'GET',
      headers: getHeaders(true),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch issues');
    return data;
  } catch (error) {
    console.error('❌ Get Issues Error:', error);
    throw error;
  }
};

/**
 * Get single issue by ID
 */
export const getIssueById = async (issueId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/issues/${issueId}`, {
      method: 'GET',
      headers: getHeaders(true),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch issue');
    return data;
  } catch (error) {
    console.error('❌ Get Issue Error:', error);
    throw error;
  }
};

/**
 * Assign issue to caretaker
 */
export const assignIssue = async (issueId, assignedToId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/issues/${issueId}/assign`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify({ assigned_to: assignedToId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to assign issue');
    return data;
  } catch (error) {
    console.error('❌ Assign Issue Error:', error);
    throw error;
  }
};

/**
 * Update issue status
 */
export const updateIssueStatus = async (issueId, status) => {
  try {
    const response = await fetch(`${API_BASE_URL}/issues/${issueId}/status`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify({ status }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update issue');
    return data;
  } catch (error) {
    console.error('❌ Update Issue Status Error:', error);
    throw error;
  }
};

/**
 * Delete issue
 */
export const deleteIssue = async (issueId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/issues/${issueId}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to delete issue');
    return data;
  } catch (error) {
    console.error('❌ Delete Issue Error:', error);
    throw error;
  }
};

// ============================================================================
// LOST & FOUND ENDPOINTS
// ============================================================================

/**
 * Create a lost & found item with image
 */
export const createLostFoundItem = async (formData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/lost-found`, {
      method: 'POST',
      headers: {
        ...(getToken() && { 'Authorization': `Bearer ${getToken()}` }),
      },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create item');
    return data;
  } catch (error) {
    console.error('❌ Create Lost & Found Item Error:', error);
    throw error;
  }
};

/**
 * Get all lost & found items with optional filters
 */
export const getLostFoundItems = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE_URL}/lost-found?${params}`, {
      method: 'GET',
      headers: getHeaders(true),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch items');
    return data;
  } catch (error) {
    console.error('❌ Get Lost & Found Items Error:', error);
    throw error;
  }
};

/**
 * Get single lost & found item
 */
export const getLostFoundItemById = async (itemId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/lost-found/${itemId}`, {
      method: 'GET',
      headers: getHeaders(true),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch item');
    return data;
  } catch (error) {
    console.error('❌ Get Lost & Found Item Error:', error);
    throw error;
  }
};

/**
 * Update lost & found item status
 */
export const updateLostFoundStatus = async (itemId, status) => {
  try {
    const response = await fetch(`${API_BASE_URL}/lost-found/${itemId}/status`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify({ status }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update item');
    return data;
  } catch (error) {
    console.error('❌ Update Lost & Found Status Error:', error);
    throw error;
  }
};

/**
 * Delete lost & found item
 */
export const deleteLostFoundItem = async (itemId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/lost-found/${itemId}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to delete item');
    return data;
  } catch (error) {
    console.error('❌ Delete Lost & Found Item Error:', error);
    throw error;
  }
};

// ============================================================================
// ANNOUNCEMENT ENDPOINTS
// ============================================================================

/**
 * Create announcement (management only)
 */
export const createAnnouncement = async (announcementData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/announcements`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(announcementData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create announcement');
    return data;
  } catch (error) {
    console.error('❌ Create Announcement Error:', error);
    throw error;
  }
};

/**
 * Get all announcements with optional filters
 */
export const getAnnouncements = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE_URL}/announcements?${params}`, {
      method: 'GET',
      headers: getHeaders(true),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch announcements');
    return data;
  } catch (error) {
    console.error('❌ Get Announcements Error:', error);
    throw error;
  }
};

/**
 * Get single announcement
 */
export const getAnnouncementById = async (announcementId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/announcements/${announcementId}`, {
      method: 'GET',
      headers: getHeaders(true),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch announcement');
    return data;
  } catch (error) {
    console.error('❌ Get Announcement Error:', error);
    throw error;
  }
};

/**
 * Update announcement (management only)
 */
export const updateAnnouncement = async (announcementId, updateData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/announcements/${announcementId}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(updateData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update announcement');
    return data;
  } catch (error) {
    console.error('❌ Update Announcement Error:', error);
    throw error;
  }
};

/**
 * Delete announcement (management only)
 */
export const deleteAnnouncement = async (announcementId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/announcements/${announcementId}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to delete announcement');
    return data;
  } catch (error) {
    console.error('❌ Delete Announcement Error:', error);
    throw error;
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getToken();
};

/**
 * Get stored auth token
 */
export const getAuthToken = () => {
  return getToken();
};

/**
 * Set auth token
 */
export const setAuthToken = (token) => {
  setToken(token);
};

/**
 * Clear auth token
 */
export const clearAuthToken = () => {
  removeToken();
};

export default {
  // Auth
  sendOTP,
  testEmail,
  register,
  login,
  getCurrentUser,
  logout,
  isAuthenticated,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  
  // Issues
  createIssue,
  getIssues,
  getIssueById,
  assignIssue,
  updateIssueStatus,
  deleteIssue,
  
  // Lost & Found
  createLostFoundItem,
  getLostFoundItems,
  getLostFoundItemById,
  updateLostFoundStatus,
  deleteLostFoundItem,
  
  // Announcements
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
};
