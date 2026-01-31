import { supabase } from './supabaseClient';

/**
 * Register a new user
 * @param {Object} userData - {email, password, name, role, hostel, block, roomNo, phone}
 * @returns {Promise<Object>} - {success, user, error}
 */
export const registerUser = async (userData) => {
  try {
    const { email, password, name, role, hostel, block, roomNo, phone } = userData;

    console.log('📝 Registering user:', email);

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        },
      },
    });

    if (authError) throw new Error(`Auth error: ${authError.message}`);

    // Create user profile
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email,
          name,
          role,
          hostel,
          block,
          room_no: roomNo,
          phone,
          is_active: true,
        },
      ])
      .select();

    if (profileError) throw new Error(`Profile error: ${profileError.message}`);

    console.log('✅ User registered successfully:', authData.user.id);
    return { success: true, user: profileData[0] };
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Login user
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} - {success, user, error}
 */
export const loginUser = async (email, password) => {
  try {
    console.log('🔐 Logging in user:', email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(`Login error: ${error.message}`);

    // Get user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError) throw new Error(`Profile error: ${userError.message}`);

    console.log('✅ Login successful:', user.id);
    return { success: true, user };
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Logout user
 * @returns {Promise<Object>} - {success, error}
 */
export const logoutUser = async () => {
  try {
    console.log('👋 Logging out user...');
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    console.log('✅ Logout successful');
    return { success: true };
  } catch (error) {
    console.error('❌ Logout error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Get current logged-in user
 * @returns {Promise<Object|null>} - User object or null
 */
export const getCurrentUser = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('ℹ️  No active session');
      return null;
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) throw error;

    console.log('✅ Current user retrieved:', user.id);
    return user;
  } catch (error) {
    console.error('❌ Error getting current user:', error.message);
    return null;
  }
};

/**
 * Update user profile
 * @param {string} userId
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - {success, user, error}
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    console.log('📝 Updating user profile:', userId);

    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select();

    if (error) throw error;

    console.log('✅ User profile updated');
    return { success: true, user: data[0] };
  } catch (error) {
    console.error('❌ Update error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<Object|null>}
 */
export const getUserByEmail = async (email) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code === 'PGRST116') {
      console.log('ℹ️  User not found:', email);
      return null;
    }

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('❌ Error getting user:', error.message);
    return null;
  }
};

/**
 * Get all users (admin only)
 * @returns {Promise<Array>}
 */
export const getAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`✅ Retrieved ${data.length} users`);
    return data;
  } catch (error) {
    console.error('❌ Error getting users:', error.message);
    return [];
  }
};

/**
 * Get users by role
 * @param {string} role - 'student', 'caretaker', or 'management'
 * @returns {Promise<Array>}
 */
export const getUsersByRole = async (role) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', role)
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`✅ Retrieved ${data.length} ${role}s`);
    return data;
  } catch (error) {
    console.error('❌ Error getting users by role:', error.message);
    return [];
  }
};

/**
 * Subscribe to auth state changes
 * @param {Function} callback - Called with (event, session)
 * @returns {Object} - Subscription object with unsubscribe method
 */
export const subscribeToAuthChanges = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};
