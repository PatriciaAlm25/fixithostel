import React, { useState } from 'react';
import { useIssues } from '../hooks/useCustom';
import Navigation from '../components/Navigation';
import StatusBadge from '../components/StatusBadge';
import StatusTimeline from '../components/StatusTimeline';
import StatusUpdateModal from '../components/StatusUpdateModal';
import '../styles/IssueStatus.css';
import { formatDate } from '../utils/helpers';

const IssueDetailPage = ({ issueId, currentUser, onGoBack }) => {
  const { issues, updateIssueStatus } = useIssues();
  const [showStatusModal, setShowStatusModal] = useState(false);
  const issue = issues.find(i => i.id === parseInt(issueId));

  if (!issue) {
    return (
      <div className="issue-detail-container">
        <p>Issue not found</p>
        {onGoBack && <button onClick={onGoBack}>Go Back</button>}
      </div>
    );
  }

  const canUpdateStatus = () => {
    if (!currentUser) return false;
    if (currentUser.role === 'student') return false;
    if (currentUser.role === 'caretaker' && issue.assignedTo === currentUser.id) return true;
    if (currentUser.role === 'management') return true;
    return false;
  };

  const handleStatusUpdate = (statusUpdate) => {
    updateIssueStatus(issue.id, statusUpdate);
    setShowStatusModal(false);
  };

  return (
    <div className="page-container">
      <Navigation />
      {onGoBack && (
        <button className="back-button" onClick={onGoBack}>
          ← Back
        </button>
      )}

      <div className="issue-detail-container">
        {/* Issue Header */}
        <div className="detail-header">
          <div className="header-title">
            <h1>{issue.description}</h1>
            <div className="header-badges">
              <StatusBadge status={issue.status || 'Reported'} size="large" />
              <span
                className="priority-badge"
                style={{
                  backgroundColor:
                    issue.priority === 'High'
                      ? '#ff5252'
                      : issue.priority === 'Medium'
                      ? '#ff9800'
                      : '#4caf50',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontWeight: '600',
                  fontSize: '13px',
                  textTransform: 'uppercase',
                }}
              >
                {issue.priority} Priority
              </span>
            </div>
          </div>
          {canUpdateStatus() && (
            <button
              className="btn btn-primary"
              onClick={() => setShowStatusModal(true)}
              style={{ marginTop: '15px' }}
            >
              Update Status
            </button>
          )}
        </div>

        <div className="detail-grid">
          {/* Issue Information */}
          <div className="detail-section">
            <h2>Issue Information</h2>
            <div className="info-table">
              <div className="info-row">
                <span className="info-label">Category:</span>
                <span className="info-value">{issue.category}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Priority:</span>
                <span className="info-value">{issue.priority}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Location:</span>
                <span className="info-value">{issue.location}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Reported By:</span>
                <span className="info-value">{issue.reportedBy}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Reported On:</span>
                <span className="info-value">{formatDate(issue.createdAt)}</span>
              </div>
              {issue.assignedTo && (
                <div className="info-row">
                  <span className="info-label">Assigned To:</span>
                  <span className="info-value">{issue.assignedTo}</span>
                </div>
              )}
              <div className="info-row">
                <span className="info-label">Visibility:</span>
                <span className="info-value">{issue.visibility || 'Public'}</span>
              </div>
            </div>
          </div>

          {/* Issue Description */}
          <div className="detail-section">
            <h2>Description</h2>
            <div className="description-box">
              <p>{issue.description}</p>
            </div>
          </div>

          {/* Issue Images */}
          {issue.images && issue.images.length > 0 && (
            <div className="detail-section">
              <h2>Issue Photos ({issue.images.length})</h2>
              <div className="images-grid">
                {issue.images.map((image, index) => (
                  <div key={index} className="image-item">
                    <img src={image} alt={`Issue photo ${index + 1}`} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resolution Images */}
          {issue.resolutionImages && issue.resolutionImages.length > 0 && (
            <div className="detail-section">
              <h2>Resolution Photos ({issue.resolutionImages.length})</h2>
              <div className="images-grid">
                {issue.resolutionImages.map((image, index) => (
                  <div key={index} className="image-item">
                    <img src={image} alt={`Resolution photo ${index + 1}`} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Status Timeline */}
        <StatusTimeline statusHistory={issue.statusHistory || []} />
      </div>

      {showStatusModal && (
        <StatusUpdateModal
          issue={issue}
          currentUser={currentUser}
          onSubmit={handleStatusUpdate}
          onCancel={() => setShowStatusModal(false)}
        />
      )}
    </div>
  );
};

export default IssueDetailPage;
