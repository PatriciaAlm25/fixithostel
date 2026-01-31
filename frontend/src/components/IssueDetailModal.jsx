import React, { useState } from 'react';
import CommentsSection from './CommentsSection';
import MergedIssuesPanel from './MergedIssuesPanel';
import '../styles/IssueDetailModal.css';

const IssueDetailModal = ({ issue, currentUser, onClose, onStatusUpdate, onMergeClick }) => {
  if (!issue) return null;

  const isPublicIssue = issue.visibility === 'Public';
  const isPrimaryMergedIssue = !!issue.mergeId;

  return (
    <div className="issue-detail-overlay" onClick={onClose}>
      <div className="issue-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="detail-header">
          <div className="detail-title-section">
            <h2>{issue.description}</h2>
            <div className="detail-badges">
              {issue.priority && (
                <span className="badge priority">{issue.priority}</span>
              )}
              <span className="badge status">{issue.status || 'Reported'}</span>
              {isPublicIssue && (
                <span className="badge public">🔓 Public</span>
              )}
              {isPrimaryMergedIssue && (
                <span className="badge merged">🔗 Merged</span>
              )}
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Scrollable Content */}
        <div className="detail-content">
          {/* Issue Information */}
          <div className="detail-section">
            <h3>Issue Details</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Category</label>
                <p>{issue.category}</p>
              </div>
              <div className="detail-item">
                <label>Location</label>
                <p>{issue.location}</p>
              </div>
              <div className="detail-item">
                <label>Reported By</label>
                <p>{issue.reportedBy}</p>
              </div>
              <div className="detail-item">
                <label>Date</label>
                <p>{new Date(issue.createdAt).toLocaleDateString()}</p>
              </div>
              {issue.assignedTo && (
                <div className="detail-item">
                  <label>Assigned To</label>
                  <p>{issue.assignedTo}</p>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {issue.description && (
            <div className="detail-section">
              <h3>Description</h3>
              <p className="description-text">{issue.description}</p>
            </div>
          )}

          {/* Images */}
          {issue.images && issue.images.length > 0 && (
            <div className="detail-section">
              <h3>Issue Photos ({issue.images.length})</h3>
              <div className="images-grid">
                {issue.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Issue photo ${idx + 1}`}
                    className="detail-image"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Resolution Images */}
          {issue.resolutionImages && issue.resolutionImages.length > 0 && (
            <div className="detail-section">
              <h3>Resolution Photos ({issue.resolutionImages.length})</h3>
              <div className="images-grid">
                {issue.resolutionImages.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Resolution photo ${idx + 1}`}
                    className="detail-image"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Remarks */}
          {issue.remarks && issue.remarks.length > 0 && (
            <div className="detail-section">
              <h3>Remarks ({issue.remarks.length})</h3>
              <div className="remarks-list">
                {issue.remarks.map((remark, idx) => (
                  <div key={idx} className="remark-item">
                    <div className="remark-header">
                      <span className="remark-author">{remark.author || 'Unknown'}</span>
                      <span className="remark-date">
                        {new Date(remark.timestamp || remark.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="remark-text">{remark.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Merged Issues Panel */}
          {isPrimaryMergedIssue && (
            <div className="detail-section">
              <MergedIssuesPanel issue={issue} onUnmerge={onClose} />
            </div>
          )}

          {/* Comments Section */}
          <div className="detail-section">
            <CommentsSection
              issueId={issue.id}
              currentUser={currentUser}
              isPublicIssue={isPublicIssue}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="detail-actions">
          {onStatusUpdate && (
            <button className="action-btn primary" onClick={() => onStatusUpdate(issue)}>
              Update Status
            </button>
          )}
          {onMergeClick && (
            <button className="action-btn secondary" onClick={() => onMergeClick(issue)}>
              🔗 Mark as Duplicate
            </button>
          )}
          <button className="action-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default IssueDetailModal;
