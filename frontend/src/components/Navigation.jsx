import React from 'react';
import { useAuth } from '../hooks/useCustom';
import '../styles/Navigation.css';

const Navigation = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <h1>FixIt Hostel</h1>
        </div>
        <div className="navbar-center">
          <span className="navbar-title">Hostel Issue Tracking System</span>
        </div>
        <div className="navbar-right">
          {user && (
            <div className="user-section">
              <span className="user-name">{user.name}</span>
              <span className="user-role">{user.role}</span>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
