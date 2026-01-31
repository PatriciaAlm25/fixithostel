// Issue API Service for backend integration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Create a new issue with images
 * @param {Object} issueData - Issue data with base64 images
 * @returns {Promise<Object>} Created issue
 */
export const createIssueWithImages = async (issueData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/issues/create-with-images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: issueData.title,
        description: issueData.description,
        category: issueData.category,
        priority: issueData.priority || 'medium',
        location: issueData.location,
        images: issueData.images || [], // Array of base64 strings
        reportedBy: issueData.reportedBy,
        reportedByRole: issueData.reportedByRole || 'student',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create issue');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating issue:', error);
    throw error;
  }
};

/**
 * Get all issues with optional filters
 * @param {Object} filters - Filter options (status, category, priority, search)
 * @returns {Promise<Array>} List of issues
 */
export const getAllIssues = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.search) params.append('search', filters.search);
    if (filters.assignedTo) params.append('assignedTo', filters.assignedTo);

    const queryString = params.toString();
    const url = queryString 
      ? `${API_BASE_URL}/issues/all?${queryString}`
      : `${API_BASE_URL}/issues/all`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch issues');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching issues:', error);
    throw error;
  }
};

/**
 * Get a specific issue by ID
 * @param {string} issueId - Issue ID
 * @returns {Promise<Object>} Issue details with full history
 */
export const getIssueById = async (issueId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/issues/${issueId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch issue');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching issue:', error);
    throw error;
  }
};

/**
 * Get all issues reported by a specific user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of user's issues
 */
export const getUserIssues = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/issues/user/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user issues');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user issues:', error);
    throw error;
  }
};

/**
 * Get all issues assigned to a specific user
 * @param {string} userId - User ID (caretaker)
 * @returns {Promise<Array>} List of assigned issues
 */
export const getAssignedIssues = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/issues/assigned/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch assigned issues');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching assigned issues:', error);
    throw error;
  }
};

/**
 * Get issues by status
 * @param {string} status - Status (Reported, Assigned, In Progress, Resolved, Closed)
 * @returns {Promise<Array>} List of issues with that status
 */
export const getIssuesByStatus = async (status) => {
  try {
    const response = await fetch(`${API_BASE_URL}/issues/status/${status}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch issues by status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching issues by status:', error);
    throw error;
  }
};

/**
 * Update issue status with remarks and proof images
 * @param {string} issueId - Issue ID
 * @param {Object} updateData - Status update data (status, remarks, proofImages, assignedTo)
 * @returns {Promise<Object>} Updated issue
 */
export const updateIssueStatus = async (issueId, updateData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/issues/${issueId}/update-status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: updateData.status,
        remarks: updateData.remarks || '',
        proofImages: updateData.proofImages || [], // Base64 array if provided
        assignedTo: updateData.assignedTo || null,
        updatedBy: updateData.updatedBy, // User making the update
        updatedByRole: updateData.updatedByRole, // Role of user
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update issue status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating issue status:', error);
    throw error;
  }
};

/**
 * Assign issue to a caretaker
 * @param {string} issueId - Issue ID
 * @param {string} caretakerId - Caretaker user ID
 * @param {string} assignedBy - User ID assigning the issue
 * @returns {Promise<Object>} Updated issue
 */
export const assignIssue = async (issueId, caretakerId, assignedBy) => {
  try {
    const response = await fetch(`${API_BASE_URL}/issues/${issueId}/assign`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assignedTo: caretakerId,
        assignedBy: assignedBy,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to assign issue');
    }

    return await response.json();
  } catch (error) {
    console.error('Error assigning issue:', error);
    throw error;
  }
};

/**
 * Delete an issue
 * @param {string} issueId - Issue ID
 * @param {string} userId - User ID (must be reporter)
 * @returns {Promise<Object>} Deletion response
 */
export const deleteIssue = async (issueId, userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/issues/${issueId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete issue');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting issue:', error);
    throw error;
  }
};

/**
 * Add a comment/remark to an issue
 * @param {string} issueId - Issue ID
 * @param {Object} commentData - Comment data (text, userId, userRole)
 * @returns {Promise<Object>} Updated issue
 */
export const addComment = async (issueId, commentData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/issues/${issueId}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: commentData.text,
        userId: commentData.userId,
        userRole: commentData.userRole,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add comment');
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

export default {
  createIssueWithImages,
  getAllIssues,
  getIssueById,
  getUserIssues,
  getAssignedIssues,
  getIssuesByStatus,
  updateIssueStatus,
  assignIssue,
  deleteIssue,
  addComment,
};
