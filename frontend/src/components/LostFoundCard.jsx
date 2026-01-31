import React from 'react';

const LostFoundCard = ({ item, onClaim, onDetails, onDelete, isOwner, userRole }) => {
  // Handle both backend field names (type, title) and potential frontend field names
  const itemType = item.type || item.itemType;
  const itemTitle = item.title || item.itemName;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-active">Active</span>;
      case 'claimed':
        return <span className="badge badge-claimed">Claimed</span>;
      case 'resolved':
        return <span className="badge badge-resolved">Resolved</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const getTypeBadge = (type) => {
    return type === 'lost' ? (
      <span className="badge badge-lost">Lost</span>
    ) : (
      <span className="badge badge-found">Found</span>
    );
  };

  return (
    <div className="lost-found-card">
      <div className="card-image-section">
        {item.images && item.images.length > 0 ? (
          <img src={item.images[0]} alt={itemTitle} className="card-image" />
        ) : (
          <div className="card-image-placeholder">📷 No Image</div>
        )}
        <div className="card-badges">
          {getTypeBadge(itemType)}
          {getStatusBadge(item.status)}
        </div>
      </div>

      <div className="card-content">
        <div className="card-header">
          <h3>{itemTitle}</h3>
          <span className="card-category">{item.category}</span>
        </div>

        <p className="card-description">{item.description}</p>

        <div className="card-details">
          <div className="detail-item">
            <span className="detail-label">📍 Location:</span>
            <span className="detail-value">{item.location}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">📅 Date:</span>
            <span className="detail-value">
              {new Date(item.date).toLocaleDateString()}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">👤 Posted by:</span>
            <span className="detail-value">{item.reportedBy}</span>
          </div>
        </div>

        {item.claimRequests && item.claimRequests.length > 0 && (
          <div className="claim-info">
            <span className="claim-count">
              {item.claimRequests.length} claim request(s)
            </span>
          </div>
        )}

        <div className="card-actions">
          {!isOwner && item.status === 'active' && (
            <button className="btn btn-sm btn-primary" onClick={() => onClaim(item)}>
              Claim Item
            </button>
          )}

          <button className="btn btn-sm btn-secondary" onClick={() => onDetails(item)}>
            View Details
          </button>

          {isOwner && (
            <button className="btn btn-sm btn-danger" onClick={() => onDelete(item.id)}>
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LostFoundCard;
