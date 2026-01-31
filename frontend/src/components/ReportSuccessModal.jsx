import React, { useEffect } from 'react';
import '../styles/ReportSuccessModal.css';

const ReportSuccessModal = ({ isOpen, onClose, issueData }) => {
  useEffect(() => {
    if (isOpen) {
      // Auto close after 6 seconds
      const timer = setTimeout(onClose, 6000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="report-success-modal-overlay">
      <div className="report-success-modal-content">
        <div className="success-icon-container">
          <div className="success-checkmark">✓</div>
        </div>
        
        <h2 className="success-title">Issue Reported Successfully! 🎉</h2>
        
        <p className="success-subtitle">
          Your issue has been submitted and is now visible to our management and caretaking team.
        </p>

        {issueData && (
          <div className="issue-summary">
            <div className="summary-item">
              <label>Issue Title:</label>
              <p>{issueData.description}</p>
            </div>
            
            <div className="summary-item">
              <label>Category:</label>
              <p className="category-badge">{issueData.category}</p>
            </div>

            <div className="summary-item">
              <label>Priority Level:</label>
              <p className={`priority-badge priority-${issueData.priority?.toLowerCase()}`}>
                {issueData.priority}
              </p>
            </div>

            <div className="summary-item">
              <label>Location:</label>
              <p>{issueData.locationText}</p>
            </div>

            <div className="summary-item">
              <label>GPS Coordinates:</label>
              <p className="gps-coordinates">
                Lat: {issueData.gpsLocation?.latitude?.toFixed(6)}, 
                Lon: {issueData.gpsLocation?.longitude?.toFixed(6)}
              </p>
            </div>

            {issueData.images && issueData.images.length > 0 && (
              <div className="summary-item">
                <label>Photos Uploaded:</label>
                <p>{issueData.images.length} photo(s) attached</p>
              </div>
            )}
          </div>
        )}

        <div className="success-actions">
          <p className="next-steps">
            📋 You can track this issue in <strong>"My Issues"</strong> section
          </p>
          <button className="success-button" onClick={onClose}>
            Got it! Close
          </button>
        </div>

        <div className="auto-close-message">
          This window will close automatically in 6 seconds...
        </div>
      </div>
    </div>
  );
};

export default ReportSuccessModal;
