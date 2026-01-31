import React from 'react';
import '../styles/Homepage.css';

const Homepage = ({ onReportClick, onLoginClick }) => {
  return (
    <div className="homepage">
      {/* Navigation Bar */}
      <nav className="homepage-nav">
        <div className="nav-container">
          <h1 className="nav-logo">🏠 FixIt Hostel</h1>
          <button className="nav-login-btn" onClick={onLoginClick}>
            Login / Register
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">FixIt Hostel</h1>
          <p className="hero-subtitle">Smart Hostel Issue Tracking & Resolution System</p>
          <p className="hero-description">
            Report, track, and resolve hostel maintenance issues efficiently
          </p>
          <button className="cta-button" onClick={onReportClick}>
            Report an Issue
          </button>
        </div>
        <div className="hero-image">
          <div className="hero-icon">🔧</div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Key Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3>Easy Issue Reporting</h3>
            <p>Report hostel issues with details like category, priority, and location</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Track Issues</h3>
            <p>Real-time tracking of your reported issues from reporting to resolution</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Team Management</h3>
            <p>Dedicated caretakers assigned to resolve issues in your hostel</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Analytics</h3>
            <p>View comprehensive analytics and resolution statistics</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔐</div>
            <h3>Secure Authentication</h3>
            <p>Email-verified OTP authentication for secure access</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Fast Resolution</h3>
            <p>Quick issue resolution with priority-based management</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Register</h3>
            <p>Create your account with email verification</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Report</h3>
            <p>Report any hostel issues with details</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Track</h3>
            <p>Monitor the status of your issues</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Resolve</h3>
            <p>Issues resolved by dedicated staff</p>
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section className="roles-section">
        <h2 className="section-title">User Roles</h2>
        <div className="roles-grid">
          <div className="role-card">
            <div className="role-icon">👨‍🎓</div>
            <h3>Student</h3>
            <ul className="role-features">
              <li>📝 Report issues</li>
              <li>🔍 Track status</li>
              <li>💬 Receive updates</li>
              <li>⭐ Rate resolutions</li>
            </ul>
          </div>

          <div className="role-card">
            <div className="role-icon">👨‍💼</div>
            <h3>Management</h3>
            <ul className="role-features">
              <li>📊 View analytics</li>
              <li>🔧 Assign tasks</li>
              <li>📋 Manage all issues</li>
              <li>📢 Post announcements</li>
            </ul>
          </div>

          <div className="role-card">
            <div className="role-icon">🔧</div>
            <h3>Caretaker</h3>
            <ul className="role-features">
              <li>📋 View assigned issues</li>
              <li>✅ Update progress</li>
              <li>📝 Add remarks</li>
              <li>✨ Mark as resolved</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Ready to Get Started?</h2>
        <p>Join thousands of students using FixIt Hostel to improve hostel maintenance</p>
        <button className="primary-cta-button" onClick={onReportClick}>
          Report Your First Issue
        </button>
      </section>

      {/* Footer */}
      <footer className="homepage-footer">
        <p>&copy; 2026 FixIt Hostel. All rights reserved.</p>
        <p>Smart Issue Tracking for Better Hostel Living</p>
      </footer>
    </div>
  );
};

export default Homepage;
