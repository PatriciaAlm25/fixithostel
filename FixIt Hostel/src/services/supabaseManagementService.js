/**
 * Management API Service
 * Handles all management-specific API calls
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Get all issues (management view)
 */
export async function getAllIssues(managementId) {
  try {
    const response = await fetch(`${API_BASE}/management/issues?management_id=${managementId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error fetching all issues:', error);
    return {
      success: false,
      error: error.message,
      issues: [],
    };
  }
}

/**
 * Assign an issue to a caretaker
 */
export async function assignIssueToCaret aker(issueId, caretakerId, managementId) {
  try {
    const response = await fetch(`${API_BASE}/management/issues/${issueId}/assign`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        caretaker_id: caretakerId,
        management_id: managementId,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error assigning issue:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Update issue status
 */
export async function updateIssueStatus(issueId, status, managementId) {
  try {
    const response = await fetch(`${API_BASE}/management/issues/${issueId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
        management_id: managementId,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error updating issue status:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get all lost & found items
 */
export async function getAllLostFoundItems(managementId) {
  try {
    const response = await fetch(`${API_BASE}/management/lost-found?management_id=${managementId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error fetching lost & found items:', error);
    return {
      success: false,
      error: error.message,
      items: [],
    };
  }
}

/**
 * Update lost & found item status
 */
export async function updateLostFoundStatus(itemId, status, managementId) {
  try {
    const response = await fetch(`${API_BASE}/management/lost-found/${itemId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
        management_id: managementId,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error updating lost & found status:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get all caretakers
 */
export async function getAllCaretakers(managementId) {
  try {
    const response = await fetch(`${API_BASE}/management/caretakers?management_id=${managementId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error fetching caretakers:', error);
    return {
      success: false,
      error: error.message,
      caretakers: [],
    };
  }
}

/**
 * Get management dashboard statistics
 */
export async function getManagementStats(managementId) {
  try {
    const response = await fetch(`${API_BASE}/management/stats?management_id=${managementId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error fetching management stats:', error);
    return {
      success: false,
      error: error.message,
      stats: {},
    };
  }
}

/**
 * Auto-assign unassigned issues to newly registered caretaker
 */
export async function autoAssignIssuesToCaretaker(caretakerId, managementId) {
  try {
    const response = await fetch(`${API_BASE}/management/auto-assign-issues`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        caretaker_id: caretakerId,
        management_id: managementId,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error auto-assigning issues:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
