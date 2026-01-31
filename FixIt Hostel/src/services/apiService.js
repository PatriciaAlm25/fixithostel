import { mockUsers } from './mockData';
import { supabase } from './supabaseClient';
import * as supabaseAuth from './supabaseAuth';

// Store OTPs temporarily (in production, use backend)
const otpStore = new Map();

// API Base URL - Update this to your backend server
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via Gmail using backend API
const sendOTPToEmail = async (email, otp) => {
  try {
    // First, store OTP locally for quick verification during development
    otpStore.set(email, {
      otp,
      createdAt: Date.now(),
      expiresAt: Date.now() + 1 * 60 * 1000, // 1 minute expiry
    });

    // Try to send via backend Gmail API
    let emailSent = false;
    let error = null;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp,
          subject: 'FixIt Hostel - Your One-Time Password',
          template: 'otp',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          emailSent = true;
          console.log(`✅ OTP sent successfully to ${email}`);
          console.log(`
╔════════════════════════════════════════════════════════╗
║     📧 FixIt Hostel - OTP Email Sent Successfully       ║
╠════════════════════════════════════════════════════════╣
║ Email: ${email}
║ Status: ✓ Email sent to your inbox
║ OTP Code: ${otp}
║ Valid for: 1 minute
║                                                        ║
║ Please check your email for the OTP code               ║
║ (Check spam/junk folder if not in inbox)              ║
╚════════════════════════════════════════════════════════╝
          `);
        }
      } else {
        error = 'Backend email service returned an error';
        console.warn('⚠️', error);
      }
    } catch (fetchError) {
      error = fetchError.message;
      console.warn('⚠️ Could not reach backend email service:', error);
    }

    // If email sending failed, show fallback info
    if (!emailSent) {
      console.warn(`
╔════════════════════════════════════════════════════════╗
║     ⚠️ FixIt Hostel - Email Sending Failed              ║
╠════════════════════════════════════════════════════════╣
║ Email: ${email}
║ OTP Code: ${otp}
║ Valid for: 1 minute
║ Error: ${error || 'Unknown error'}
║                                                        ║
║ DEMO MODE: OTP is shown here for development           ║
║ In production, please check your email inbox           ║
╚════════════════════════════════════════════════════════╝
      `);
    }

    return emailSent;

  } catch (error) {
    console.error('Error in sendOTPToEmail:', error);
    throw error;
  }
};

// Verify OTP
const verifyOTP = (email, otp) => {
  const storedData = otpStore.get(email);
  
  if (!storedData) {
    return { valid: false, message: 'OTP expired or not found. Please request a new OTP.' };
  }
  
  if (Date.now() > storedData.expiresAt) {
    otpStore.delete(email);
    return { valid: false, message: 'OTP has expired. Please request a new one.' };
  }
  
  if (storedData.otp !== otp) {
    return { valid: false, message: 'Invalid OTP. Please try again.' };
  }
  
  otpStore.delete(email);
  return { valid: true, message: 'OTP verified successfully.' };
};

export const authService = {
  // Step 1: Send OTP to email
  sendOTP: (email) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (!email || !email.includes('@')) {
          reject(new Error('Invalid email format'));
          return;
        }

        const otp = generateOTP();
        await sendOTPToEmail(email, otp);

        resolve({
          success: true,
          message: `OTP sent to ${email}. Check your email.`,
          email,
        });
      } catch (error) {
        console.error('Error sending OTP:', error);
        reject(new Error('Failed to send OTP. Please try again later.'));
      }
    });
  },

  // Step 2: Verify OTP and create/login user
  verifyOTPAndLogin: (email, otp, userData = null) => {
    return new Promise(async (resolve, reject) => {
      setTimeout(async () => {
        const verification = verifyOTP(email, otp);
        
        if (!verification.valid) {
          reject(new Error(verification.message));
        } else {
          try {
            // If userData provided, register the user
            if (userData) {
              try {
                // Call backend registration endpoint
                const response = await fetch(`${API_BASE_URL}/auth/register`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    email,
                    password: userData.password,
                    name: userData.name || '',
                    role: userData.role || 'student',
                    ...userData,
                  }),
                });

                if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.message || 'Registration failed');
                }

                const registrationResult = await response.json();
                if (!registrationResult.success) {
                  throw new Error(registrationResult.message);
                }

                const user = registrationResult.user;
                
                // Also save to local mockUsers for backward compatibility
                const normalizedEmail = String(user.email).toLowerCase();
                const existingLocal = mockUsers.find((u) => String(u.email || '').toLowerCase() === normalizedEmail);
                if (!existingLocal) {
                  const newUser = {
                    id: user.id,
                    email: user.email,
                    ...userData,
                    registeredAt: new Date().toISOString(),
                  };
                  mockUsers.push(newUser);
                }

                console.log('✅ User registered successfully via backend:', email);
                console.log('📝 Registered user data:', {
                  id: user.id,
                  email: user.email,
                  name: user.name,
                  role: user.role,
                  registeredAt: user.registeredAt,
                });

                // Return user without password
                const { password, ...userWithoutPassword } = user;
                resolve(userWithoutPassword);
              } catch (backendError) {
                console.error('❌ Backend registration error:', backendError.message);
                reject(new Error(backendError.message || 'Registration failed'));
              }
            } else {
              // Login without registration (user already exists)
              const normalizedSearch = String(email).toLowerCase();
              let user = mockUsers.find((u) => String(u.email || '').toLowerCase() === normalizedSearch);
              
              if (!user) {
                try {
                  user = await getUserByEmailFromFirebase(email);
                } catch (firebaseError) {
                  console.warn('⚠️ Firebase lookup failed:', firebaseError);
                }
              }
              
              if (!user) {
                reject(new Error('User not found. Please complete registration first.'));
              } else {
                const { password, ...userWithoutPassword } = user;
                console.log('✅ OTP verified and user authenticated:', email);
                resolve(userWithoutPassword);
              }
            }
          } catch (error) {
            reject(new Error('Registration failed: ' + error.message));
          }
        }
      }, 500);
    });
  },

  // Step 3: Login with email and password (after registration)
  loginWithPassword: (email, password) => {
    return new Promise(async (resolve, reject) => {
      setTimeout(async () => {
        try {
          // Call backend login endpoint
          const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              password,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Login failed');
          }

          const loginResult = await response.json();
          if (!loginResult.success) {
            throw new Error(loginResult.message);
          }

          const user = loginResult.user;
          console.log('✅ Login successful via backend:', email);
          console.log('👤 User details:', {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          });

          resolve(user);
        } catch (error) {
          console.error('❌ Login error:', error.message);
          reject(new Error(error.message || 'Login failed'));
        }
      }, 500);
    });
  },

  // Register user (OTP verification happens in login)
  register: (userData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newUser = {
          id: mockUsers.length + 1,
          ...userData,
        };
        // Don't add to mockUsers yet, wait for OTP verification
        resolve(newUser);
      }, 500);
    });
  },

  logout: () => {
    return Promise.resolve();
  },
};

export const issueService = {
  getIssues: (filters = {}) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([]);
      }, 300);
    });
  },

  createIssue: (issueData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: Date.now(),
          createdAt: new Date(),
          status: 'Reported',
          ...issueData,
        });
      }, 300);
    });
  },

  updateIssue: (issueId, updates) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: issueId,
          lastUpdated: new Date(),
          ...updates,
        });
      }, 300);
    });
  },
};

export const analyticsService = {
  getAnalytics: (issues = []) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Calculate analytics based on actual issues
        const totalIssues = issues.length;
        const resolvedIssues = issues.filter((i) => i.status === 'Resolved').length;
        const pendingIssues = issues.filter((i) => i.status === 'Reported' || i.status === 'Assigned' || i.status === 'In Progress').length;
        const emergencyIssues = issues.filter((i) => i.priority === 'Emergency').length;

        // Group by category
        const issuesByCategory = {};
        issues.forEach((issue) => {
          if (issue.category) {
            issuesByCategory[issue.category] = (issuesByCategory[issue.category] || 0) + 1;
          }
        });

        // Group by hostel
        const hostelWiseIssues = {};
        issues.forEach((issue) => {
          if (issue.hostel) {
            hostelWiseIssues[issue.hostel] = (hostelWiseIssues[issue.hostel] || 0) + 1;
          }
        });

        resolve({
          totalIssues,
          resolvedIssues,
          pendingIssues,
          emergencyIssues,
          issuesByCategory,
          hostelWiseIssues,
          avgResolutionTime: 'N/A',
        });
      }, 500);
    });
  },
};

export const announcementService = {
  // Create a new announcement (management only)
  createAnnouncement: async (announcementData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/notices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(announcementData),
      });

      if (!response.ok) {
        throw new Error('Failed to create announcement');
      }

      const data = await response.json();
      return data.notice || data;
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
  },

  // Get all announcements (all users can read)
  getAnnouncements: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/notices`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch announcements');
      }

      const data = await response.json();
      return data.notices || [];
    } catch (error) {
      console.error('Error fetching announcements:', error);
      throw error;
    }
  },

  // Get single announcement by ID
  getAnnouncementById: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/notices/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch announcement');
      }

      const data = await response.json();
      return data.notice || data;
    } catch (error) {
      console.error('Error fetching announcement:', error);
      throw error;
    }
  },

  // Update announcement (management only)
  updateAnnouncement: async (id, announcementData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/notices/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(announcementData),
      });

      if (!response.ok) {
        throw new Error('Failed to update announcement');
      }

      const data = await response.json();
      return data.notice || data;
    } catch (error) {
      console.error('Error updating announcement:', error);
      throw error;
    }
  },

  // Delete announcement (management only)
  deleteAnnouncement: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/notices/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete announcement');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      throw error;
    }
  },
};
