import React, { createContext, useState, useCallback, useEffect } from 'react';
import backendAPI from '../services/backendAPI';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [otpSent, setOtpSent] = useState(false);
  const [currentEmail, setCurrentEmail] = useState('');
  const [pendingUserData, setPendingUserData] = useState(null);
  const [error, setError] = useState(null);

  // Initialize from localStorage and verify with backend
  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const token = backendAPI.getAuthToken();

      if (storedUser && token) {
        try {
          const userData = JSON.parse(storedUser);
          console.log('👤 Loaded user from localStorage:', userData.email);
          setUser(userData);
          setIsAuthenticated(true);
          
          // Verify token is still valid by fetching current user
          try {
            console.log('🔍 Verifying token with backend...');
            const currentUser = await backendAPI.getCurrentUser();
            console.log('✅ Token verified, user:', currentUser.email);
            setUser(currentUser);
            localStorage.setItem('user', JSON.stringify(currentUser));
          } catch (err) {
            // Token expired or invalid, clear auth
            console.warn('⚠️ Token verification failed:', err.message);
            backendAPI.logout();
            localStorage.removeItem('user');
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('❌ Failed to parse stored user:', error);
          localStorage.removeItem('user');
          backendAPI.logout();
        }
      } else {
        console.log('ℹ️ No stored user or token found');
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = useCallback((userData) => {
    console.log('🔐 Login callback executed with user:', userData?.email);
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
    console.log('💾 User stored in localStorage');
    setOtpSent(false);
    setCurrentEmail('');
    setPendingUserData(null);
    setError(null);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    setOtpSent(false);
    setCurrentEmail('');
    setPendingUserData(null);
    localStorage.removeItem('user');
    backendAPI.logout();
  }, []);

  const updateUserProfile = useCallback((updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, [user]);

  const setSendOtpState = useCallback((email, userData = null) => {
    setOtpSent(true);
    setCurrentEmail(email);
    setPendingUserData(userData);
    setError(null);
  }, []);

  const clearOtpState = useCallback(() => {
    setOtpSent(false);
    setCurrentEmail('');
    setPendingUserData(null);
    setError(null);
  }, []);

  const setAuthError = useCallback((errorMessage) => {
    setError(errorMessage);
  }, []);

  const clearAuthError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    user,
    isAuthenticated,
    loading,
    otpSent,
    currentEmail,
    pendingUserData,
    error,
    login,
    logout,
    updateUserProfile,
    setSendOtpState,
    clearOtpState,
    setAuthError,
    clearAuthError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
