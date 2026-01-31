// Lost & Found API Service
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Create a lost/found item with images
 * @param {Object} itemData - Item data with base64 images
 * @returns {Promise<Object>} Created item
 */
export const createItemWithImages = async (itemData) => {
  try {
    console.log('📤 Sending lost & found item to backend:', {
      type: itemData.type,
      title: itemData.title,
      imageCount: itemData.images?.length || 0,
      url: `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/lost-found/create-with-images`,
    });

    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/lost-found/create-with-images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: itemData.type, // 'lost' or 'found'
        category: itemData.category, // 'electronics', 'documents', 'clothing', 'accessories', 'other'
        title: itemData.title,
        description: itemData.description,
        images: itemData.images, // Array of base64 strings
        location: itemData.location,
        dateReported: itemData.dateReported,
        contactInfo: itemData.contactInfo,
        userId: itemData.userId, // Current user ID
      }),
    });

    console.log('📥 Response status:', response.status);

    if (!response.ok) {
      let errorMessage = 'Failed to create item';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        errorMessage = `Server error (${response.status}): ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('✅ Item created successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Error creating lost/found item:', error);
    throw error;
  }
};

/**
 * Get all lost/found items with optional filters
 * @param {Object} filters - Filter options (type, status, search, category)
 * @returns {Promise<Array>} List of items
 */
export const getAllItems = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.type) params.append('type', filters.type); // 'lost' or 'found'
    if (filters.status) params.append('status', filters.status); // 'active', 'claimed', 'resolved'
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);

    const queryString = params.toString();
    const url = queryString 
      ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/lost-found/all?${queryString}`
      : `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/lost-found/all`;

    console.log('📤 Fetching lost & found items from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('📥 Response status:', response.status);

    if (!response.ok) {
      throw new Error('Failed to fetch items');
    }

    const items = await response.json();
    console.log('✅ Lost & Found items fetched:', items);
    return items;
  } catch (error) {
    console.error('❌ Error fetching lost/found items:', error);
    throw error;
  }
};

/**
 * Get a specific lost/found item by ID
 * @param {string} itemId - Item ID
 * @returns {Promise<Object>} Item details
 */
export const getItemById = async (itemId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/lost-found/${itemId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch item');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching item:', error);
    throw error;
  }
};

/**
 * Get all items posted by a specific user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of user's items
 */
export const getUserItems = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/lost-found/user/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user items');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user items:', error);
    throw error;
  }
};

/**
 * Submit a claim for a lost/found item
 * @param {string} itemId - Item ID to claim
 * @param {Object} claimData - Claim details (userId, remarks, proof images)
 * @returns {Promise<Object>} Created claim
 */
export const submitClaim = async (itemId, claimData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/lost-found/${itemId}/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: claimData.userId,
        remarks: claimData.remarks,
        proofImages: claimData.proofImages || [], // Array of base64 strings if provided
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit claim');
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting claim:', error);
    throw error;
  }
};

/**
 * Approve a claim (Admin only)
 * @param {string} claimId - Claim ID
 * @param {string} adminId - Admin user ID (for authorization)
 * @returns {Promise<Object>} Updated claim
 */
export const approveClaim = async (claimId, adminId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/lost-found/claim/${claimId}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        adminId: adminId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to approve claim');
    }

    return await response.json();
  } catch (error) {
    console.error('Error approving claim:', error);
    throw error;
  }
};

/**
 * Reject a claim (Admin only)
 * @param {string} claimId - Claim ID
 * @param {string} adminId - Admin user ID (for authorization)
 * @param {string} reason - Reason for rejection
 * @returns {Promise<Object>} Updated claim
 */
export const rejectClaim = async (claimId, adminId, reason) => {
  try {
    const response = await fetch(`${API_BASE_URL}/lost-found/claim/${claimId}/reject`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        adminId: adminId,
        reason: reason || '',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reject claim');
    }

    return await response.json();
  } catch (error) {
    console.error('Error rejecting claim:', error);
    throw error;
  }
};

/**
 * Update an item's status
 * @param {string} itemId - Item ID
 * @param {string} status - New status ('active', 'claimed', 'resolved')
 * @returns {Promise<Object>} Updated item
 */
export const updateItemStatus = async (itemId, status) => {
  try {
    const response = await fetch(`${API_BASE_URL}/lost-found/${itemId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: status,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update item status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating item status:', error);
    throw error;
  }
};

/**
 * Delete a lost/found item
 * @param {string} itemId - Item ID
 * @param {string} userId - User ID (must be owner)
 * @returns {Promise<Object>} Deletion response
 */
export const deleteItem = async (itemId, userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/lost-found/${itemId}`, {
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
      throw new Error(error.message || 'Failed to delete item');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting item:', error);
    throw error;
  }
};

/**
 * Get all claims for management review
 * @returns {Promise<Array>} List of all claims
 */
export const getAllClaims = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/lost-found/claims/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch claims');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching claims:', error);
    throw error;
  }
};

export default {
  createItemWithImages,
  getAllItems,
  getItemById,
  getUserItems,
  submitClaim,
  approveClaim,
  rejectClaim,
  updateItemStatus,
  deleteItem,
  getAllClaims,
};
