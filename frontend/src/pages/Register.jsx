import React, { useState } from 'react';
import { useAuth } from '../hooks/useCustom';
import backendAPI from '../services/backendAPI';
import { validateEmail, validatePhone } from '../utils/helpers';
import {
  departments,
  hostels,
  blocks,
  corridors,
} from '../services/mockData';
import Form from '../components/Form';
import '../styles/Auth.css';

const Register = ({ onSuccess, onSwitchToLogin, onGoBack }) => {
  const { login, setSendOtpState, clearOtpState, otpSent, currentEmail, pendingUserData } = useAuth();
  const [step, setStep] = useState('role');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({});
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep('details');
  };

  const getStudentFields = () => [
    {
      name: 'name',
      label: 'Full Name',
      type: 'text',
      placeholder: 'Enter your full name',
      required: true,
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'your@college.edu',
      required: true,
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      placeholder: 'Create a strong password',
      required: true,
    },
    {
      name: 'dob',
      label: 'Date of Birth',
      type: 'date',
      required: true,
    },
    {
      name: 'age',
      label: 'Age',
      type: 'number',
      required: true,
    },
    {
      name: 'department',
      label: 'Department',
      type: 'select',
      options: departments,
      required: true,
    },
    {
      name: 'college',
      label: 'College Name',
      type: 'text',
      placeholder: 'Enter your college name',
      required: true,
    },
    {
      name: 'year',
      label: 'Year of Study',
      type: 'select',
      options: ['1', '2', '3', '4'],
      required: true,
    },
    {
      name: 'hostel',
      label: 'Hostel',
      type: 'select',
      options: hostels,
      required: true,
    },
    {
      name: 'block',
      label: 'Block',
      type: 'select',
      options: blocks,
      required: true,
    },
    {
      name: 'roomNo',
      label: 'Room Number',
      type: 'number',
      placeholder: 'e.g., 101',
      required: true,
    },
  ];

  const getManagementFields = () => [
    {
      name: 'name',
      label: 'Full Name',
      type: 'text',
      placeholder: 'Enter your full name',
      required: true,
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'admin@hostel.edu',
      required: true,
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      placeholder: 'Create a strong password',
      required: true,
    },
    {
      name: 'hostelType',
      label: 'Manage',
      type: 'select',
      options: ['hostel', 'mess'],
      required: true,
    },
  ];

  const getCaretakerFields = () => [
    {
      name: 'name',
      label: 'Full Name',
      type: 'text',
      placeholder: 'Enter your full name',
      required: true,
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'caretaker@hostel.edu',
      required: true,
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      placeholder: 'Create a strong password',
      required: true,
    },
    {
      name: 'specialization',
      label: 'Specialization',
      type: 'select',
      options: [
        'Plumbing',
        'Electrical',
        'Carpentry',
        'Cleaning',
        'Grounds Maintenance',
      ],
      required: true,
    },
    {
      name: 'hostel',
      label: 'Assigned Hostel',
      type: 'select',
      options: hostels,
      required: true,
    },
  ];

  const getFieldsByRole = () => {
    switch (role) {
      case 'student':
        return getStudentFields();
      case 'management':
        return getManagementFields();
      case 'caretaker':
        return getCaretakerFields();
      default:
        return [];
    }
  };

  const validateForm = (data) => {
    if (!validateEmail(data.email)) {
      setError('Invalid email format');
      return false;
    }
    if (data.phone && !validatePhone(data.phone)) {
      setError('Phone number must be 10 digits');
      return false;
    }
    return true;
  };

  const handleDetailSubmit = async (data) => {
    console.log('📝 handleDetailSubmit called with:', data);
    setError('');

    try {
      // Validate form
      if (!validateForm(data)) {
        console.warn('⚠️ Form validation failed');
        return;
      }

      console.log('✓ Form validation passed');
      setLoading(true);

      // Ensure email is valid
      if (!data.email || data.email.trim() === '') {
        setError('Email is required');
        setLoading(false);
        return;
      }

      if (!data.password || data.password.trim() === '') {
        setError('Password is required');
        setLoading(false);
        return;
      }

      // Send OTP first
      console.log('📧 Sending OTP to:', data.email);
      const otpResponse = await backendAPI.sendOTP(data.email);
      console.log('✅ OTP sent successfully:', otpResponse);
      
      // Normalize field names for backend compatibility
      const normalizedData = { ...data };
      if (normalizedData.roomNo) {
        normalizedData.room_no = normalizedData.roomNo;
        delete normalizedData.roomNo;
      }
      
      // Store user data for later verification
      const registrationData = {
        ...normalizedData,
        role,
        hostelId:
          role === 'student'
            ? `${data.hostel}-${data.block}-R${data.roomNo}`
            : undefined,
      };
      
      console.log('💾 Storing registration data:', registrationData);
      setSendOtpState(data.email, registrationData);
      
      // Set success message
      setError('');
      console.log('✅ Moving to OTP verification step');
      // Stop loading before moving to OTP step so buttons are enabled
      setLoading(false);
      setStep('otp');
    } catch (err) {
      console.error('❌ Error in handleDetailSubmit:', err);
      const errorMessage = err?.message || 'Failed to send OTP. Please try again.';
      console.error('Setting error:', errorMessage);
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (formData) => {
    console.log('🔐 handleVerifyOTP called with OTP:', formData.otp);
    setError('');

    if (!formData.otp || formData.otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      // Normalize field names for backend compatibility
      const normalizedData = { ...pendingUserData };
      if (normalizedData.roomNo) {
        normalizedData.room_no = normalizedData.roomNo;
        delete normalizedData.roomNo;
      }
      
      console.log('📤 Sending registration with OTP:', { email: currentEmail, otp: formData.otp });
      const response = await backendAPI.register({
        ...normalizedData,
        email: currentEmail,
        otp: formData.otp,
      });
      console.log('✅ Registration successful:', response);
      login(response.user);
      clearOtpState();
      onSuccess();
    } catch (err) {
      console.error('❌ OTP verification error:', err);
      setError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setResendSuccess(false);
    setResendLoading(true);
    try {
      await backendAPI.sendOTP(currentEmail);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000); // Show message for 5 seconds
    } catch (err) {
      setError(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  if (step === 'role') {
    return (
      <div className="auth-container">
        <div className="auth-box">
          {onGoBack && (
            <button className="back-btn" onClick={onGoBack} title="Go back">
              ← Back
            </button>
          )}
          <h1 className="auth-title">FixIt Hostel</h1>
          <h2 className="auth-subtitle">Register</h2>
          <p className="role-description">Select your role to continue</p>

          <div className="role-selector">
            <button
              className={`role-card ${role === 'student' ? 'active' : ''}`}
              onClick={() => handleRoleSelect('student')}
            >
              <div className="role-icon">👨‍🎓</div>
              <div className="role-name">Student</div>
              <div className="role-desc">Report and track issues</div>
            </button>
            <button
              className={`role-card ${role === 'management' ? 'active' : ''}`}
              onClick={() => handleRoleSelect('management')}
            >
              <div className="role-icon">👨‍💼</div>
              <div className="role-name">Management</div>
              <div className="role-desc">Oversee all issues</div>
            </button>
            <button
              className={`role-card ${role === 'caretaker' ? 'active' : ''}`}
              onClick={() => handleRoleSelect('caretaker')}
            >
              <div className="role-icon">🔧</div>
              <div className="role-name">Caretaker</div>
              <div className="role-desc">Resolve issues</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'details') {
    return (
      <div className="auth-container">
        <div className="auth-box auth-box-large">
          <button className="back-btn" onClick={() => setStep('role')}>
            ← Back
          </button>
          <h2 className="auth-subtitle">
            {role.charAt(0).toUpperCase() + role.slice(1)} Registration
          </h2>

          {error && <div className="error-message">{error}</div>}

          <Form
            fields={getFieldsByRole()}
            onSubmit={handleDetailSubmit}
            submitText={loading ? 'Sending OTP...' : 'Register'}
            isSubmitting={loading}
            title=""
          />

          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <button className="link-btn" onClick={onSwitchToLogin}>
                Login here
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // OTP verification step
  return (
    <div className="auth-container">
      <div className="auth-box">
        <button className="back-btn" onClick={() => setStep('details')}>
          ← Back
        </button>
        <h2 className="auth-subtitle">Verify Email</h2>
        <p className="email-display">Email: {currentEmail}</p>

        {error && <div className="error-message">{error}</div>}

        <Form
          fields={[
            {
              name: 'otp',
              label: '6-Digit OTP Code',
              type: 'text',
              placeholder: 'Enter the OTP from your email',
              required: true,
            },
          ]}
          onSubmit={handleVerifyOTP}
          submitText={loading ? 'Verifying...' : 'Verify'}
          isSubmitting={loading}
          title=""
        />

        <div className="otp-info">
          <p className="otp-info-title">🔐 Complete Your Registration</p>
          <p>Enter the 6-digit code sent to your email to complete registration.</p>
          <p style={{ fontSize: '14px', margin: '10px 0' }}>
            <strong>📧 Check your email:</strong> Please look in your inbox or spam/junk folder for an email from <strong>FixIt Hostel</strong> with your 6-digit OTP code.
          </p>
          
          <div style={{
            marginTop: '15px',
            paddingTop: '15px',
            borderTop: '1px solid #e0e0e0'
          }}>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>
              💡 <strong>Didn't receive the email?</strong>
            </p>
            <button
              onClick={handleResendOTP}
              disabled={resendLoading}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f0f0f0',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: resendLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                color: '#333',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              {resendLoading ? '⏳ Resending...' : '🔄 Resend OTP'}
            </button>
            <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
              Check your spam/junk folder first before requesting a new code.
            </p>
          </div>

          {resendSuccess && (
            <div style={{
              marginTop: '10px',
              padding: '10px',
              backgroundColor: '#d4edda',
              color: '#155724',
              borderRadius: '4px',
              border: '1px solid #c3e6cb',
              fontSize: '13px',
              textAlign: 'center'
            }}>
              ✅ OTP resent successfully! Check your email.
            </div>
          )}
          
          <p className="demo-note" style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
            💡 Tip: If you don't see the email, check your spam/junk folder and mark it as "not spam"
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
