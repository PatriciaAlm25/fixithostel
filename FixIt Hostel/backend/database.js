/**
 * User Database Module
 * Manages user registration and login data
 * Uses in-memory storage with JSON file persistence
 * Auth is handled by Supabase
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables early
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Database file path
const DB_FILE = path.join(__dirname, 'users.db.json');

// Initialize Supabase client (lazy initialization)
let supabase = null;
let supabaseInitialized = false;

const initSupabase = () => {
  if (supabaseInitialized) return supabase; // Return cached result even if null
  
  supabaseInitialized = true; // Mark as initialized to avoid re-checking
  
  // Get credentials from environment variables (loaded by dotenv)
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  
  console.log(`ℹ️ Initializing Supabase...`);
  console.log(`   URL: ${supabaseUrl ? '✓ Found' : '✗ Missing'}`);
  console.log(`   Key: ${supabaseServiceKey ? '✓ Found' : '✗ Missing'}`);
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️ Supabase credentials not found. Using local database only.');
    return null;
  }

  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('✅ Supabase client initialized for backend');
    return supabase;
  } catch (error) {
    console.error('❌ Failed to initialize Supabase:', error.message);
    return null;
  }
};

/**
 * Initialize database file if it doesn't exist
 */
const initDatabase = () => {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: {} }, null, 2));
  }
};

/**
 * Read all users from database
 */
const getAllUsers = () => {
  try {
    initDatabase();
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const db = JSON.parse(data);
    return db.users || {};
  } catch (error) {
    console.error('Error reading database:', error);
    return {};
  }
};

/**
 * Save users to database
 */
const saveDatabase = (users) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users }, null, 2));
  } catch (error) {
    console.error('Error saving database:', error);
    throw error;
  }
};

/**
 * Find user by email
 */
const findUserByEmail = (email) => {
  if (!email) return null;
  const normalized = String(email).toLowerCase();
  const users = getAllUsers();
  for (const userId in users) {
    if (String(users[userId].email || '').toLowerCase() === normalized) {
      return { id: userId, ...users[userId] };
    }
  }
  return null;
};

/**
 * Check if email is already registered (comprehensive check)
 * Prevents duplicate registration by checking both local and Supabase databases
 * @param {string} email - Email to check
 * @returns {Promise<boolean>} - True if email already registered, false otherwise
 */
const isEmailAlreadyRegistered = async (email) => {
  try {
    if (!email) return false;
    
    const normalizedEmail = String(email).toLowerCase().trim();
    console.log(`🔍 Checking if email already registered: ${normalizedEmail}`);

    // Check local database first (faster)
    const existingLocal = findUserByEmail(normalizedEmail);
    if (existingLocal) {
      console.log(`   ❌ Found in local database (ID: ${existingLocal.id})`);
      return true;
    }
    console.log(`   ✓ Not in local database`);

    // Check Supabase database as backup
    const supabaseClient = initSupabase();
    if (supabaseClient) {
      try {
        const { data: existingSupabaseUser, error } = await supabaseClient
          .from('users')
          .select('id, email')
          .eq('email', normalizedEmail)
          .single();

        if (existingSupabaseUser) {
          console.log(`   ❌ Found in Supabase database (ID: ${existingSupabaseUser.id})`);
          return true;
        }

        if (error && error.code !== 'PGRST116') {
          console.warn(`   ⚠️ Error checking Supabase: ${error.message}`);
        } else {
          console.log(`   ✓ Not in Supabase database`);
        }
      } catch (error) {
        console.warn(`   ⚠️ Supabase check exception: ${error.message}`);
      }
    }

    console.log(`   ✅ Email is available for registration`);
    return false;
  } catch (error) {
    console.error(`   ❌ Error checking email registration: ${error.message}`);
    // Return true (reject) on error to be safe
    return true;
  }
};

/**
 * Register a new user
 * @param {Object} userData - User data including email, password, name, role, etc.
 * @returns {Object} - Registered user data (without password)
 */
const registerUser = async (userData) => {
  try {
    // Normalize email to prevent duplicate registrations with different cases
    if (userData.email) {
      userData.email = String(userData.email).toLowerCase().trim();
    }

    // Check if user already exists locally
    const existingUserLocal = findUserByEmail(userData.email);
    if (existingUserLocal) {
      throw new Error('Email already registered');
    }

    // Check if user exists in Supabase
    let supabaseClient = initSupabase();
    if (supabaseClient) {
      try {
        const { data: existingSupabaseUser, error: searchError } = await supabaseClient
          .from('users')
          .select('id, email')
          .eq('email', userData.email)
          .single();

        if (existingSupabaseUser) {
          throw new Error('Email already registered in database');
        }

        if (searchError && searchError.code !== 'PGRST116') { // PGRST116 = no rows found
          console.warn('⚠️ Error checking Supabase:', searchError.message);
        }
      } catch (error) {
        if (!error.message.includes('no rows')) {
          console.warn('⚠️ Supabase check error:', error.message);
        }
      }
    }

    // Generate user ID
    const userId = `user_${Date.now()}`;

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user object
    // Exclude plain text password
    const { password: _, ...otherUserData } = userData;
    const newUser = {
      id: userId,
      email: userData.email,
      password: hashedPassword,
      name: userData.name || '',
      role: userData.role || 'student',
      registeredAt: new Date().toISOString(),
      email_verified: false, // Email not yet verified
      ...otherUserData, // Include any additional fields (but not password)
    };

    // Save to local database
    const users = getAllUsers();
    users[userId] = newUser;
    saveDatabase(users);
    console.log(`✅ User saved locally: ${userData.email}`);

    // Save to Supabase with password hash for login verification
    supabaseClient = initSupabase();
    if (supabaseClient) {
      try {
        console.log(`📤 Saving user to Supabase: ${userData.email}`);
        
        // Build Supabase data with only essential columns that are guaranteed to exist
        // These are the core columns that should exist in any FixIt Hostel Supabase setup
        const supabaseData = {
          id: userId,
          email: userData.email,
          password_hash: hashedPassword,  // Store hashed password for login verification
          name: userData.name || '',
          role: userData.role || 'student',
          email_verified: userData.email_verified || false,
          registered_at: new Date().toISOString(),
        };

        // Add optional location fields (only if schema includes them)
        if (userData.hostel) supabaseData.hostel = userData.hostel;
        if (userData.block) supabaseData.block = userData.block;
        
        // Handle room_no - could come as roomNo or room_no
        const roomNo = userData.roomNo || userData.room_no;
        if (roomNo) supabaseData.room_no = roomNo;
        
        if (userData.phone) supabaseData.phone = userData.phone;

        console.log(`   Inserting to Supabase with columns: ${Object.keys(supabaseData).join(', ')}`);

        const { data: insertedUser, error: insertError } = await supabaseClient
          .from('users')
          .insert([supabaseData])
          .select();

        if (insertError) {
          console.warn('⚠️ Error saving to Supabase:', insertError.message);
          console.warn('   Code:', insertError.code);
          if (insertError.code === 'PGRST204') {
            console.warn('   Issue: One or more columns do not exist in the Supabase schema');
            console.warn('   Fix: Run the setup SQL in Supabase to add missing columns');
            console.warn('   See: SUPABASE_SETUP_INSTRUCTIONS.md');
          }
          console.warn('   ℹ️ User data saved locally. Supabase sync failed (non-critical for now)');
        } else {
          console.log(`✅ User saved to Supabase: ${userData.email}`);
        }
      } catch (error) {
        console.warn('⚠️ Supabase save exception:', error.message);
        console.warn('   ℹ️ User data saved locally. Supabase sync failed (non-critical)');
      }
    } else {
      console.log('ℹ️ Supabase not configured - using local database only');
    }

    console.log(`✅ User registered: ${userData.email} (ID: ${userId})`);

    // Return user without password
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  } catch (error) {
    console.error('Registration error:', error.message);
    throw error;
  }
};

/**
 * Verify user credentials (login)
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Object} - User data (without password) if credentials match
 */
const verifyUserCredentials = async (email, password) => {
  try {
    const normalizedEmail = String(email).toLowerCase().trim();
    console.log(`🔐 Verifying credentials for: ${normalizedEmail}`);
    console.log(`   Input password length: ${password?.length || 0}`);
    
    // First check local database
    let user = findUserByEmail(normalizedEmail);
    let passwordHash = user?.password;
    
    console.log(`   User in local DB: ${!!user}`);
    if (user) {
      console.log(`   Hash exists: ${!!passwordHash}`);
      console.log(`   Hash preview: ${passwordHash?.substring(0, 20)}...`);
    }

    if (!user) {
      console.log(`ℹ️ User not found locally, checking Supabase...`);
      
      // If not in local DB, try Supabase
      const supabaseClient = initSupabase();
      if (supabaseClient) {
        try {
          console.log(`   Checking Supabase...`);
          const { data: supabaseUser, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('email', normalizedEmail)
            .single();

          if (supabaseUser) {
            console.log(`✅ Found user in Supabase: ${normalizedEmail}`);
            user = supabaseUser;
            // Get password hash from Supabase (could be in 'password_hash' or 'password' column)
            passwordHash = supabaseUser.password_hash || supabaseUser.password;
            console.log(`   Supabase hash: ${passwordHash?.substring(0, 20)}...`);
          }
        } catch (error) {
          console.warn('⚠️ Error checking Supabase:', error.message);
        }
      } else {
        console.log(`   Supabase not configured`);
      }
    }

    if (!user) {
      console.log(`❌ User not found: ${normalizedEmail}`);
      return null;
    }

    console.log(`✅ User found, verifying password...`);
    console.log(`   Hash type: ${typeof passwordHash}`);
    console.log(`   Hash is null/undefined: ${passwordHash == null}`);

    // Compare password with hash
    if (!passwordHash) {
      console.error(`❌ NO PASSWORD HASH for user!`);
      throw new Error('Invalid password');
    }
    
    const passwordMatch = await bcrypt.compare(password, passwordHash);
    console.log(`   Bcrypt compare result: ${passwordMatch}`);

    if (!passwordMatch) {
      console.error(`❌ Password mismatch for: ${normalizedEmail}`);
      throw new Error('Invalid password');
    }

    console.log(`✅ Password verified for: ${normalizedEmail}`);

    // Update email_verified status in Supabase if logging in successfully
    const supabaseClient = initSupabase();
    if (supabaseClient && !user.email_verified) {
      try {
        await supabaseClient
          .from('users')
          .update({ email_verified: true })
          .eq('email', normalizedEmail);
        
        console.log('✅ Email verified for user:', normalizedEmail);
        user.email_verified = true;
      } catch (error) {
        console.warn('⚠️ Error updating email verification status:', error.message);
      }
    }

    console.log(`✅ User login successful: ${normalizedEmail}`);

    // Return user without password
    const { password: _, password_hash: __, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error('Login error:', error.message);
    throw error;
  }
};

/**
 * Check if user exists by email
 */
const userExists = (email) => {
  return findUserByEmail(email) !== null;
};

/**
 * Update user data
 */
const updateUser = async (userId, userData) => {
  try {
    const users = getAllUsers();

    if (!users[userId]) {
      throw new Error('User not found');
    }

    // Hash password if it's being updated
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }

    // Update user
    users[userId] = {
      ...users[userId],
      ...userData,
      id: userId, // Preserve ID
      email: users[userId].email, // Prevent email changes
    };

    saveDatabase(users);
    console.log(`✅ User updated: ${userId}`);

    const { password, ...userWithoutPassword } = users[userId];
    return userWithoutPassword;
  } catch (error) {
    console.error('Update error:', error.message);
    throw error;
  }
};

/**
 * Delete user
 */
const deleteUser = (userId) => {
  try {
    const users = getAllUsers();

    if (!users[userId]) {
      throw new Error('User not found');
    }

    delete users[userId];
    saveDatabase(users);
    console.log(`✅ User deleted: ${userId}`);
  } catch (error) {
    console.error('Delete error:', error.message);
    throw error;
  }
};

// ============================================
// NOTICES DATABASE FUNCTIONS
// ============================================

const NOTICES_FILE = path.join(__dirname, 'notices.db.json');

/**
 * Initialize notices database
 */
const initNoticesDatabase = () => {
  if (!fs.existsSync(NOTICES_FILE)) {
    fs.writeFileSync(NOTICES_FILE, JSON.stringify({ notices: [] }, null, 2));
  }
};

/**
 * Get all notices
 */
const getAllNotices = () => {
  try {
    console.log('[getAllNotices] Initializing database...');
    initNoticesDatabase();
    console.log('[getAllNotices] Reading file:', NOTICES_FILE);
    const data = fs.readFileSync(NOTICES_FILE, 'utf-8');
    console.log('[getAllNotices] File read, parsing JSON...');
    const db = JSON.parse(data);
    console.log('[getAllNotices] ✅ Parsed, returning', db.notices ? db.notices.length : 0, 'notices');
    return db.notices || [];
  } catch (error) {
    console.error('[getAllNotices] ❌ Error reading notices:', error.message, error.stack);
    return [];
  }
};

/**
 * Save notices to database
 */
const saveNotices = (notices) => {
  try {
    console.log('[saveNotices] Writing', notices.length, 'notices to:', NOTICES_FILE);
    fs.writeFileSync(NOTICES_FILE, JSON.stringify({ notices }, null, 2));
    console.log('[saveNotices] ✅ Successfully saved');
  } catch (error) {
    console.error('[saveNotices] ❌ Error saving notices:', error.message, error.stack);
    throw error;
  }
};

/**
 * Add a new notice
 */
const addNotice = async (notice) => {
  try {
    console.log('[addNotice] Entry - notice.id:', notice.id);
    console.log('[addNotice] Calling getAllNotices...');
    const notices = getAllNotices();
    console.log('[addNotice] Got notices:', notices.length, 'items');
    notices.push(notice);
    console.log('[addNotice] Pushed notice, now have:', notices.length, 'items');
    console.log('[addNotice] Calling saveNotices...');
    saveNotices(notices);
    console.log('[addNotice] ✅ Successfully saved notice:', notice.id);
    return notice;
  } catch (error) {
    console.error('[addNotice] ❌ Error adding notice:', error.message, error.stack);
    throw error;
  }
};

/**
 * Get notice by ID
 */
const getNoticeById = async (noticeId) => {
  try {
    const notices = getAllNotices();
    return notices.find(n => n.id === noticeId) || null;
  } catch (error) {
    console.error('Error getting notice:', error);
    return null;
  }
};

/**
 * Update notice
 */
const updateNotice = async (noticeId, updatedData) => {
  try {
    const notices = getAllNotices();
    const index = notices.findIndex(n => n.id === noticeId);
    
    if (index === -1) {
      throw new Error('Notice not found');
    }

    notices[index] = { ...notices[index], ...updatedData };
    saveNotices(notices);
    console.log(`✅ Notice updated: ${noticeId}`);
    return notices[index];
  } catch (error) {
    console.error('Error updating notice:', error);
    throw error;
  }
};

/**
 * Delete notice
 */
const deleteNotice = async (noticeId) => {
  try {
    const notices = getAllNotices();
    const filtered = notices.filter(n => n.id !== noticeId);
    saveNotices(filtered);
    console.log(`✅ Notice deleted: ${noticeId}`);
  } catch (error) {
    console.error('Error deleting notice:', error);
    throw error;
  }
};

module.exports = {
  initDatabase,
  getAllUsers,
  findUserByEmail,
  isEmailAlreadyRegistered,
  registerUser,
  verifyUserCredentials,
  userExists,
  updateUser,
  deleteUser,
  initSupabase,
  // Notices functions
  initNoticesDatabase,
  getAllNotices,
  addNotice,
  getNoticeById,
  updateNotice,
  deleteNotice,
};
