/**
 * Management Routes for FixIt Hostel Backend
 * Handles management-only operations: issue assignment, status updates, announcements, lost & found management
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Middleware to verify management role
 */
const verifyManagement = async (req, res, next) => {
  try {
    const { management_id } = req.body;

    if (!management_id) {
      return res.status(400).json({
        success: false,
        message: 'management_id is required',
      });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('role, id')
      .eq('id', management_id)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role !== 'management') {
      return res.status(403).json({
        success: false,
        message: 'Only management can perform this action',
      });
    }

    req.management = user;
    next();
  } catch (error) {
    console.error('❌ Verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed',
      error: error.message,
    });
  }
};

/**
 * POST /api/management/auto-assign-issues
 * Auto-assign unassigned issues to newly registered caretaker (balanced distribution)
 */
router.post('/auto-assign-issues', async (req, res) => {
  try {
    const { caretaker_id, management_id } = req.body;

    if (!caretaker_id || !management_id) {
      return res.status(400).json({
        success: false,
        message: 'caretaker_id and management_id are required',
      });
    }

    // Verify management role
    const { data: mgmt } = await supabase
      .from('users')
      .select('role')
      .eq('id', management_id)
      .single();

    if (!mgmt || mgmt.role !== 'management') {
      return res.status(403).json({
        success: false,
        message: 'Only management can perform this action',
      });
    }

    // Verify caretaker exists
    const { data: caretaker } = await supabase
      .from('users')
      .select('id, name')
      .eq('id', caretaker_id)
      .single();

    if (!caretaker) {
      return res.status(404).json({
        success: false,
        message: 'Caretaker not found',
      });
    }

    // Get all unassigned issues
    const { data: unassignedIssues } = await supabase
      .from('issues')
      .select('id')
      .eq('status', 'Reported')
      .is('assigned_caretaker_id', null)
      .limit(5);  // Assign max 5 issues per caretaker

    if (!unassignedIssues || unassignedIssues.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No unassigned issues to distribute',
        assignedCount: 0,
      });
    }

    // Auto-assign issues
    const assignedIssueIds = unassignedIssues.map(i => i.id);
    
    const { error: updateError } = await supabase
      .from('issues')
      .update({
        assigned_caretaker_id: caretaker_id,
        status: 'Assigned',
        assigned_at: new Date().toISOString(),
      })
      .in('id', assignedIssueIds);

    if (updateError) {
      console.error('❌ Error auto-assigning issues:', updateError);
      throw updateError;
    }

    console.log(`✅ Auto-assigned ${assignedIssueIds.length} issues to caretaker ${caretaker.name}`);

    res.status(200).json({
      success: true,
      message: `Auto-assigned ${assignedIssueIds.length} issues to ${caretaker.name}`,
      assignedCount: assignedIssueIds.length,
    });
  } catch (error) {
    console.error('❌ Error in POST /auto-assign-issues:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to auto-assign issues',
      error: error.message,
    });
  }
});

/**
 * GET /api/management/issues
 * Get all issues (visible to management only)
 */
router.get('/issues', async (req, res) => {
  try {
    const { management_id } = req.query;

    if (!management_id) {
      return res.status(400).json({
        success: false,
        message: 'management_id is required',
      });
    }

    // Verify management role
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', management_id)
      .single();

    if (!user || user.role !== 'management') {
      return res.status(403).json({
        success: false,
        message: 'Only management can view all issues',
      });
    }

    const { data: issues, error } = await supabase
      .from('issues')
      .select(`
        *,
        user:user_id(id, name, email, hostel),
        assigned_to_caretaker:assigned_caretaker_id(id, name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching issues:', error);
      throw error;
    }

    res.status(200).json({
      success: true,
      issues: issues || [],
      count: issues?.length || 0,
    });
  } catch (error) {
    console.error('❌ Error in GET /issues:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch issues',
      error: error.message,
    });
  }
});

/**
 * PUT /api/management/issues/:id/assign
 * Assign an issue to a caretaker
 */
router.put('/issues/:id/assign', verifyManagement, async (req, res) => {
  try {
    const { id } = req.params;
    const { caretaker_id } = req.body;

    if (!caretaker_id) {
      return res.status(400).json({
        success: false,
        message: 'caretaker_id is required',
      });
    }

    // Verify caretaker exists and has correct role
    const { data: caretaker } = await supabase
      .from('users')
      .select('id, role, name')
      .eq('id', caretaker_id)
      .single();

    if (!caretaker) {
      return res.status(404).json({
        success: false,
        message: 'Caretaker not found',
      });
    }

    if (caretaker.role !== 'caretaker') {
      return res.status(400).json({
        success: false,
        message: 'User must have caretaker role',
      });
    }

    // Update issue with caretaker assignment
    const { data: updatedIssue, error } = await supabase
      .from('issues')
      .update({
        assigned_caretaker_id: caretaker_id,
        status: 'Assigned',
        assigned_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('❌ Error assigning issue:', error);
      throw error;
    }

    console.log(`✅ Issue ${id} assigned to caretaker ${caretaker.name}`);

    res.status(200).json({
      success: true,
      message: `Issue assigned to ${caretaker.name}`,
      issue: updatedIssue[0],
    });
  } catch (error) {
    console.error('❌ Error in PUT /issues/:id/assign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign issue',
      error: error.message,
    });
  }
});

/**
 * PUT /api/management/issues/:id/status
 * Update issue status (Reported, Assigned, Under Construction, Repaired, Closed)
 */
router.put('/issues/:id/status', verifyManagement, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      'Reported',
      'Assigned',
      'Under Construction',
      'Repaired',
      'Closed',
    ];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid statuses: ${validStatuses.join(', ')}`,
      });
    }

    const { data: updatedIssue, error } = await supabase
      .from('issues')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('❌ Error updating issue status:', error);
      throw error;
    }

    console.log(`✅ Issue ${id} status updated to ${status}`);

    res.status(200).json({
      success: true,
      message: `Issue status updated to ${status}`,
      issue: updatedIssue[0],
    });
  } catch (error) {
    console.error('❌ Error in PUT /issues/:id/status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update issue status',
      error: error.message,
    });
  }
});

/**
 * GET /api/management/lost-found
 * Get all lost & found items
 */
router.get('/lost-found', async (req, res) => {
  try {
    const { management_id } = req.query;

    if (!management_id) {
      return res.status(400).json({
        success: false,
        message: 'management_id is required',
      });
    }

    // Verify management role
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', management_id)
      .single();

    if (!user || user.role !== 'management') {
      return res.status(403).json({
        success: false,
        message: 'Only management can view all lost & found items',
      });
    }

    const { data: items, error } = await supabase
      .from('lost_found')
      .select(`
        *,
        user:user_id(id, name, email, hostel)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching lost & found items:', error);
      throw error;
    }

    res.status(200).json({
      success: true,
      items: items || [],
      count: items?.length || 0,
    });
  } catch (error) {
    console.error('❌ Error in GET /lost-found:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lost & found items',
      error: error.message,
    });
  }
});

/**
 * PUT /api/management/lost-found/:id/status
 * Update lost & found item status (Lost, Found, Claimed, Not Found)
 */
router.put('/lost-found/:id/status', verifyManagement, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Lost', 'Found', 'Claimed', 'Not Found'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid statuses: ${validStatuses.join(', ')}`,
      });
    }

    const { data: updatedItem, error } = await supabase
      .from('lost_found')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('❌ Error updating lost & found status:', error);
      throw error;
    }

    console.log(`✅ Lost & Found item ${id} status updated to ${status}`);

    res.status(200).json({
      success: true,
      message: `Item status updated to ${status}`,
      item: updatedItem[0],
    });
  } catch (error) {
    console.error('❌ Error in PUT /lost-found/:id/status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update lost & found status',
      error: error.message,
    });
  }
});

/**
 * GET /api/management/caretakers
 * Get all caretakers
 */
router.get('/caretakers', async (req, res) => {
  try {
    const { management_id } = req.query;

    if (!management_id) {
      return res.status(400).json({
        success: false,
        message: 'management_id is required',
      });
    }

    // Verify management role
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', management_id)
      .single();

    if (!user || user.role !== 'management') {
      return res.status(403).json({
        success: false,
        message: 'Only management can view caretakers',
      });
    }

    const { data: caretakers, error } = await supabase
      .from('users')
      .select('id, name, email, hostel, created_at')
      .eq('role', 'caretaker')
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ Error fetching caretakers:', error);
      throw error;
    }

    res.status(200).json({
      success: true,
      caretakers: caretakers || [],
      count: caretakers?.length || 0,
    });
  } catch (error) {
    console.error('❌ Error in GET /caretakers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch caretakers',
      error: error.message,
    });
  }
});

/**
 * GET /api/management/stats
 * Get management dashboard statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const { management_id } = req.query;

    if (!management_id) {
      return res.status(400).json({
        success: false,
        message: 'management_id is required',
      });
    }

    // Verify management role
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', management_id)
      .single();

    if (!user || user.role !== 'management') {
      return res.status(403).json({
        success: false,
        message: 'Only management can view stats',
      });
    }

    // Get issue statistics
    const { data: issues } = await supabase
      .from('issues')
      .select('status, priority');

    const { data: lostFound } = await supabase
      .from('lost_found')
      .select('status');

    const { data: caretakers } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'caretaker');

    const stats = {
      totalIssues: issues?.length || 0,
      issuesByStatus: {
        reported: issues?.filter(i => i.status === 'Reported').length || 0,
        assigned: issues?.filter(i => i.status === 'Assigned').length || 0,
        underConstruction: issues?.filter(i => i.status === 'Under Construction').length || 0,
        repaired: issues?.filter(i => i.status === 'Repaired').length || 0,
        closed: issues?.filter(i => i.status === 'Closed').length || 0,
      },
      lostFoundItems: lostFound?.length || 0,
      lostFoundByStatus: {
        lost: lostFound?.filter(i => i.status === 'Lost').length || 0,
        found: lostFound?.filter(i => i.status === 'Found').length || 0,
        claimed: lostFound?.filter(i => i.status === 'Claimed').length || 0,
        notFound: lostFound?.filter(i => i.status === 'Not Found').length || 0,
      },
      totalCaretakers: caretakers?.length || 0,
    };

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('❌ Error in GET /stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message,
    });
  }
});

module.exports = router;
