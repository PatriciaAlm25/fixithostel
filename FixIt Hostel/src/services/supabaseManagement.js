import { supabase } from './supabaseClient';

/**
 * Get all issues with full details (for management)
 */
export const getAllIssuesForManagement = async () => {
  try {
    console.log('📋 Fetching all issues for management...');
    const { data, error } = await supabase
      .from('issues')
      .select(`
        id,
        title,
        description,
        category,
        priority,
        status,
        hostel,
        block,
        room_no,
        created_by,
        assigned_to,
        images,
        created_at,
        updated_at,
        users!created_by (id, name, email, hostel, room_no, role)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching issues:', error);
      return { success: false, issues: [], error };
    }

    console.log(`✅ Fetched ${data?.length || 0} issues for management`);
    return { success: true, issues: data || [] };
  } catch (error) {
    console.error('❌ Error in getAllIssuesForManagement:', error);
    return { success: false, issues: [], error };
  }
};

/**
 * Assign an issue to a caretaker
 */
export const assignIssueToCare = async (issueId, caretakerId, remarks = '') => {
  try {
    console.log(`📌 Assigning issue ${issueId} to caretaker ${caretakerId}...`);
    
    const { data, error } = await supabase
      .from('issues')
      .update({
        assigned_to: caretakerId,
        status: 'Assigned',
        updated_at: new Date().toISOString(),
      })
      .eq('id', issueId)
      .select();

    if (error) {
      console.error('❌ Error assigning issue:', error);
      return { success: false, error };
    }

    // Log the assignment in activity table if it exists
    if (remarks) {
      console.log('💬 Adding assignment remarks:', remarks);
      try {
        await supabase.from('issue_activity').insert({
          issue_id: issueId,
          activity_type: 'assigned',
          actor_id: supabase.auth.user?.id,
          details: remarks,
          created_at: new Date().toISOString(),
        });
      } catch (activityError) {
        console.warn('⚠️ Could not log activity:', activityError);
      }
    }

    console.log('✅ Issue assigned successfully');
    return { success: true, data: data?.[0] };
  } catch (error) {
    console.error('❌ Error in assignIssueToCare:', error);
    return { success: false, error };
  }
};

/**
 * Update issue status (management only)
 */
export const updateIssueStatusAsManagement = async (issueId, newStatus, remarks = '') => {
  try {
    console.log(`🔄 Updating issue ${issueId} status to ${newStatus}...`);
    
    const updateData = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    // If marking as repaired/resolved, record completion time
    if (newStatus === 'Repaired' || newStatus === 'Completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('issues')
      .update(updateData)
      .eq('id', issueId)
      .select();

    if (error) {
      console.error('❌ Error updating issue status:', error);
      return { success: false, error };
    }

    console.log('✅ Issue status updated successfully');
    return { success: true, data: data?.[0] };
  } catch (error) {
    console.error('❌ Error in updateIssueStatusAsManagement:', error);
    return { success: false, error };
  }
};

/**
 * Get all lost & found items (for management)
 */
export const getAllLostFoundForManagement = async () => {
  try {
    console.log('🔍 Fetching all lost & found items for management...');
    
    const { data, error } = await supabase
      .from('lost_found_items')
      .select(`
        id,
        item_type,
        item_name,
        description,
        category,
        location,
        hostel,
        block,
        room_no,
        status,
        user_id,
        created_at,
        updated_at,
        lost_found_images (
          id,
          image_url
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching lost & found:', error);
      return { success: false, items: [], error };
    }

    console.log(`✅ Fetched ${data?.length || 0} lost & found items`);
    return { success: true, items: data || [] };
  } catch (error) {
    console.error('❌ Error in getAllLostFoundForManagement:', error);
    return { success: false, items: [], error };
  }
};

/**
 * Update lost & found item status (Found/Not Found)
 */
export const updateLostFoundStatus = async (itemId, newStatus, remarks = '') => {
  try {
    console.log(`📦 Updating lost & found item ${itemId} status to ${newStatus}...`);
    
    const updateData = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('lost_found_items')
      .update(updateData)
      .eq('id', itemId)
      .select();

    if (error) {
      console.error('❌ Error updating lost & found status:', error);
      return { success: false, error };
    }

    console.log('✅ Lost & found item status updated');
    return { success: true, data: data?.[0] };
  } catch (error) {
    console.error('❌ Error in updateLostFoundStatus:', error);
    return { success: false, error };
  }
};

/**
 * Subscribe to all issues updates (for management real-time)
 */
export const subscribeToAllIssuesForManagement = (callback) => {
  console.log('👁️ Subscribing to all issues updates...');
  
  const subscription = supabase
    .from('issues')
    .on('*', (payload) => {
      console.log('🔔 Issues update received:', payload.eventType);
      if (callback) callback(payload);
    })
    .subscribe();

  return {
    unsubscribe: () => {
      subscription.unsubscribe();
      console.log('✅ Unsubscribed from all issues updates');
    },
  };
};

/**
 * Subscribe to all lost & found updates (for management real-time)
 */
export const subscribeToAllLostFoundForManagement = (callback) => {
  console.log('👁️ Subscribing to all lost & found updates...');
  
  const subscription = supabase
    .from('lost_found_items')
    .on('*', (payload) => {
      console.log('🔔 Lost & found update received:', payload.eventType);
      if (callback) callback(payload);
    })
    .subscribe();

  return {
    unsubscribe: () => {
      subscription.unsubscribe();
      console.log('✅ Unsubscribed from lost & found updates');
    },
  };
};

/**
 * Check if user is management
 */
export const isUserManagement = (user) => {
  return user && user.role === 'management';
};

/**
 * Get all caretakers for assignment
 */
export const getAllCaretakers = async () => {
  try {
    console.log('👥 Fetching all caretakers...');
    
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, hostel, block, role')
      .eq('role', 'caretaker')
      .order('name');

    if (error) {
      console.error('❌ Error fetching caretakers:', error);
      return { success: false, caretakers: [], error };
    }

    console.log(`✅ Fetched ${data?.length || 0} caretakers`);
    return { success: true, caretakers: data || [] };
  } catch (error) {
    console.error('❌ Error in getAllCaretakers:', error);
    return { success: false, caretakers: [], error };
  }
};
