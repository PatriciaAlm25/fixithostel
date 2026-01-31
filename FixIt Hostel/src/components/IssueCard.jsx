import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import StatusUpdateModal from './StatusUpdateModal';
import { parseImages } from '../utils/imageParser';
import '../styles/IssueCard.css';
import '../styles/IssueStatus.css';
import { formatDate, getPriorityColor } from '../utils/helpers';

const IssueCard = ({ issue, onClick, currentUser, onStatusUpdate }) => {
  const [showStatusModal, setShowStatusModal] = useState(false);
  
  // Debug log
  console.log('🎯 IssueCard received issue:', {
    id: issue.id,
    description: issue.description,
    images_raw: issue.images,
    images_type: typeof issue.images,
    images_isArray: Array.isArray(issue.images),
    images_length: issue.images?.length || 0,
  });
  
  // Parse images using utility function
  const images = parseImages(issue.images || []);
  console.log('🖼️ IssueCard parsed images:', { 
    raw: issue.images, 
    parsed: images, 
    count: images.length,
    isEmpty: !images || images.length === 0
  });
  
  // Handle both naming conventions (camelCase and snake_case)
  const resolutionImages = issue.resolutionImages || issue.resolution_images || [];
  const hasImages = images && images.length > 0;
  const hasResolutionImages = resolutionImages && resolutionImages.length > 0;
  const assignedTo = issue.assignedTo || issue.assigned_to;
  const createdAt = issue.createdAt || issue.created_at;

  const canUpdateStatus = () => {
    if (!currentUser) return false;
    if (currentUser.role === 'student') return false;
    if (currentUser.role === 'caretaker' && assignedTo === currentUser.id) return true;
    if (currentUser.role === 'management') return true;
    return false;
  };

  const handleStatusUpdate = (statusUpdate) => {
    if (onStatusUpdate) {
      onStatusUpdate(issue.id, statusUpdate);
    }
    setShowStatusModal(false);
  };

  return (
    <>
      <div className="issue-card" onClick={onClick}>
        <div className="issue-header">
          <div className="issue-title">{issue.description}</div>
          <div className="issue-badges">
            <span
              className="badge priority-badge"
              style={{ backgroundColor: getPriorityColor(issue.priority) }}
            >
              {issue.priority}
            </span>
            <StatusBadge status={issue.status || 'Reported'} size="small" />
          </div>
        </div>
        <div className="issue-meta">
          <span className="category">{issue.category}</span>
          <span className="location">{issue.location || issue.location_text}</span>
        </div>

        {assignedTo && (
          <div className="issue-assigned">
            👤 Assigned to: {assignedTo}
          </div>
        )}

        <div className="issue-images">
          {hasImages && (
            <div className="images-container">
              <div className="image-indicator" title="Issue photos attached">
                📷 {images.length} photo{images.length > 1 ? 's' : ''}
              </div>
              <div className="image-thumbnails">
                {images.map((imageUrl, index) => (
                  <img
                    key={index}
                    src={imageUrl}
                    alt={`Issue photo ${index + 1}`}
                    className="image-thumbnail"
                    onError={(e) => {
                      console.warn(`Failed to load image: ${imageUrl}`);
                      e.target.style.display = 'none';
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          {hasResolutionImages && (
            <span className="image-indicator resolved" title="Resolution photos attached">
              ✓ {resolutionImages.length} resolution photo{resolutionImages.length > 1 ? 's' : ''}
            </span>
          )}
          {issue.mergeId && (
            <span className="image-indicator merged" title="This is a merged issue">
              🔗 Merged Issue
            </span>
          )}
        </div>
        <div className="issue-footer">
          <span className="date">{formatDate(createdAt)}</span>
          {issue.visibility && (
            <span className={`visibility ${issue.visibility.toLowerCase()}`}>
              {issue.visibility}
            </span>
          )}
          {canUpdateStatus() && (
            <button
              className="status-update-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowStatusModal(true);
              }}
              title="Update issue status"
            >
              Update Status
            </button>
          )}
        </div>
      </div>

      {showStatusModal && (
        <StatusUpdateModal
          issue={issue}
          currentUser={currentUser}
          onSubmit={handleStatusUpdate}
          onCancel={() => setShowStatusModal(false)}
        />
      )}
    </>
  );
};

export default IssueCard;
