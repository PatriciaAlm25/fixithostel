import React, { useState } from 'react';
import { useAuth } from '../hooks/useCustom';
import backendAPI from '../services/backendAPI';
import { validateEmail } from '../utils/helpers';
import Form from '../components/Form';
import '../styles/Auth.css';

const Login = ({ onSuccess, onSwitchToRegister, onGoBack }) => {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (formData) => {
    console.log('🔐 Login handler started');
    setError('');

    try {
      // Validate email
      if (!formData.email || !formData.email.includes('@')) {
        const msg = 'Please enter a valid email address';
        console.warn('⚠️', msg);
        setError(msg);
        return;
      }

      // Validate password
      if (!formData.password) {
        const msg = 'Password is required';
        console.warn('⚠️', msg);
        setError(msg);
        return;
      }

      if (formData.password.length < 1) {
        const msg = 'Please enter your password';
        console.warn('⚠️', msg);
        setError(msg);
        return;
      }

      setLoading(true);
      console.log('🔐 Login attempt for:', formData.email);
      console.log('📤 Calling backendAPI.login()');
      
      const response = await backendAPI.login(formData.email, formData.password);
      
      console.log('✅ Login response received:', { 
        success: response.success,
        message: response.message,
        hasUser: !!response.user,
        hasToken: !!response.token 
      });
      
      if (!response.user) {
        throw new Error('No user data in response');
      }
      
      console.log('👤 User data:', { 
        id: response.user.id,
        email: response.user.email,
        name: response.user.name 
      });
      
      console.log('🔑 Calling login() with user:', response.user);
      login(response.user);
      console.log('✅ Login successful in component');
      console.log('🔄 User state in AuthContext should update now');
      
      // Wait a bit for state to update, then call onSuccess
      console.log('⏳ Waiting for state update...');
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('✅ Calling onSuccess() to hide login form');
      setLoading(false);
      onSuccess();
    } catch (err) {
      console.error('❌ Login error:', err);
      console.error('Error details:', {
        message: err?.message,
        status: err?.status,
        code: err?.code,
        stack: err?.stack,
        fullError: JSON.stringify(err, Object.getOwnPropertyNames(err))
      });
      const errorMsg = err?.message || 'Login failed. Please check your email and password.';
      console.error('Setting error:', errorMsg);
      setError(errorMsg);
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        {onGoBack && (
          <button className="back-btn" onClick={onGoBack} title="Go back">
            ← Back
          </button>
        )}
        <h1 className="auth-title">FixIt Hostel</h1>
        <h2 className="auth-subtitle">Login</h2>

        {error && <div className="error-message">{error}</div>}

        <Form
          fields={[
            {
              name: 'email',
              label: 'Email Address',
              type: 'email',
              placeholder: 'Enter your email',
              required: true,
            },
            {
              name: 'password',
              label: 'Password',
              type: 'password',
              placeholder: 'Enter your password',
              required: true,
            },
          ]}
          onSubmit={handleLogin}
          submitText={loading ? 'Logging in...' : 'Login'}
          isSubmitting={loading}
          title=""
        />

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <button className="link-btn" onClick={onSwitchToRegister}>
              Register here
            </button>
          </p>
        </div>

        <div className="otp-info">
          <p className="otp-info-title">🔐 Secure Login</p>
          <p>Use the email and password you registered with to login.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
