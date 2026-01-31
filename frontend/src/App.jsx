import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { IssueProvider } from './context/IssueContext';
import { LostFoundProvider } from './context/LostFoundContext';
import { useAuth } from './hooks/useCustom';
import Homepage from './pages/Homepage';
import Login from './pages/Login';
import Register from './pages/Register';
import CameraDiagnostics from './pages/CameraDiagnostics';
import CameraTest from './pages/CameraTest';
import SimpleCameraTest from './pages/SimpleCameraTest';
import StudentDashboard from './pages/StudentDashboard';
import ManagementDashboard from './pages/ManagementDashboard';
import CaretakerDashboard from './pages/CaretakerDashboard';
import './services/testImageFlow'; // Load test utilities
import './App.css';

function AppContent() {
  const { isAuthenticated, user, loading, logout } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // Check if user wants to access diagnostics or camera test
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('diagnostics') === 'camera') {
    return <CameraDiagnostics />;
  }
  if (urlParams.get('test') === 'camera') {
    return <CameraTest />;
  }
  if (urlParams.get('test') === 'simple-camera') {
    return <SimpleCameraTest />;
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: '1.2rem', color: '#667eea' }}>
        Loading...
      </div>
    );
  }

  // Not authenticated - show login/register or homepage
  if (!isAuthenticated) {
    if (showRegister) {
      return (
        <Register
          onSuccess={() => {
            setShowRegister(false);
            setShowLogin(false);
          }}
          onSwitchToLogin={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
          onGoBack={() => {
            setShowRegister(false);
            setShowLogin(false);
          }}
        />
      );
    }

    if (showLogin) {
      return (
        <Login
          onSuccess={() => {
            setShowLogin(false);
            setShowRegister(false);
          }}
          onSwitchToRegister={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
          onGoBack={() => {
            setShowLogin(false);
            setShowRegister(false);
          }}
        />
      );
    }

    // Show homepage by default
    return (
      <Homepage
        onReportClick={() => setShowRegister(true)}
        onLoginClick={() => setShowLogin(true)}
      />
    );
  }

  // Authenticated - Show dashboard based on role
  const handleGoBack = () => {
    logout();
  };

  switch (user?.role) {
    case 'student':
      return <StudentDashboard onGoBack={handleGoBack} />;
    case 'management':
      return <ManagementDashboard onGoBack={handleGoBack} />;
    case 'caretaker':
      return <CaretakerDashboard onGoBack={handleGoBack} />;
    default:
      return <StudentDashboard onGoBack={handleGoBack} />;
  }
}

function App() {
  return (
    <AuthProvider>
      <IssueProvider>
        <LostFoundProvider>
          <AppContent />
        </LostFoundProvider>
      </IssueProvider>
    </AuthProvider>
  );
}

export default App;
