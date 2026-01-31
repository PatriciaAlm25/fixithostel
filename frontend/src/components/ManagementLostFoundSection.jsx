import React, { useState, useEffect } from 'react';
import '../styles/ManagementLostFoundSection.css';
import * as managementService from '../services/supabaseManagementService';

const ManagementLostFoundSection = ({ managementId, onActionComplete }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    itemType: '',
  });
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);

  useEffect(() => {
    loadItems();
  }, [managementId]);

  const loadItems = async () => {
    setLoading(true);
    const result = await managementService.getAllLostFoundItems(managementId);
    if (result.success) {
      setItems(result.items || []);
    }
    setLoading(false);
  };

  const handleStatusClick = (item) => {
    setSelectedItem(item);
    setSelectedStatus(item.status);
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedStatus) {
      alert('Please select a status');
      return;
    }

    const result = await managementService.updateLostFoundStatus(
      selectedItem.id,
      selectedStatus,
      managementId
    );

    if (result.success) {
      alert('Item status updated successfully');
      setShowStatusModal(false);
      loadItems();
      if (onActionComplete) onActionComplete();
    } else {
      alert(`Error: ${result.message}`);
    }
  };

  const filteredItems = items.filter(item => {
    return (
      (!filters.status || item.status === filters.status) &&
      (!filters.itemType || item.item_type === filters.itemType)
    );
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Lost':
        return '#ff6b6b';
      case 'Found':
        return '#00b894';
      case 'Claimed':
        return '#0984e3';
      case 'Not Found':
        return '#636e72';
      default:
        return '#667eea';
    }
  };

  return (
    <div className="management-lost-found-section">
      <h2>📦 Lost & Found Management</h2>

      {/* Filters */}
      <div className="filters">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="filter-select"
        >
          <option value="">All Statuses</option>
          <option value="Lost">Lost</option>
          <option value="Found">Found</option>
          <option value="Claimed">Claimed</option>
          <option value="Not Found">Not Found</option>
        </select>

        <select
          value={filters.itemType}
          onChange={(e) => setFilters({ ...filters, itemType: e.target.value })}
          className="filter-select"
        >
          <option value="">All Types</option>
          <option value="Keys">Keys</option>
          <option value="Documents">Documents</option>
          <option value="Electronics">Electronics</option>
          <option value="Clothing">Clothing</option>
          <option value="Accessories">Accessories</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Items List */}
      {loading ? (
        <p className="loading">Loading items...</p>
      ) : filteredItems.length === 0 ? (
        <p className="no-data">No lost & found items found</p>
      ) : (
        <div className="items-list">
          {filteredItems.map((item) => (
            <div key={item.id} className="item-card">
              <div className="item-header">
                <h3>{item.item_name}</h3>
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(item.status) }}
                >
                  {item.status}
                </span>
              </div>

              <p className="item-description">{item.description}</p>

              <div className="item-details">
                <p>
                  <strong>Type:</strong> {item.item_type}
                </p>
                {item.location && (
                  <p>
                    <strong>Last Seen:</strong> {item.location}
                  </p>
                )}
                {item.user && (
                  <p>
                    <strong>Reported by:</strong> {item.user.name} ({item.user.email})
                  </p>
                )}
                <p>
                  <strong>Reported On:</strong>{' '}
                  {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>

              {item.image_url && (
                <div className="item-images">
                  <h4>📸 Attached Image</h4>
                  <div className="images-gallery">
                    <div 
                      className="image-thumbnail"
                      onClick={() => setSelectedImageUrl(item.image_url)}
                    >
                      <img src={item.image_url} alt="Item" />
                      <span className="image-count">1</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="item-actions">
                <button
                  onClick={() => handleStatusClick(item)}
                  className="btn-status"
                >
                  ✅ Update Status
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImageUrl && (
        <div className="image-modal-overlay" onClick={() => setSelectedImageUrl(null)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="image-modal-close"
              onClick={() => setSelectedImageUrl(null)}
            >
              ✕
            </button>
            <img src={selectedImageUrl} alt="Item Preview" />
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Update Item Status</h3>
            <p>
              <strong>Item:</strong> {selectedItem?.item_name}
            </p>
            <p>
              <strong>Current Status:</strong> {selectedItem?.status}
            </p>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="modal-select"
            >
              <option value="Lost">Lost</option>
              <option value="Found">Found</option>
              <option value="Claimed">Claimed</option>
              <option value="Not Found">Not Found</option>
            </select>

            <div className="modal-actions">
              <button onClick={handleUpdateStatus} className="btn-primary">
                Update Status
              </button>
              <button
                onClick={() => setShowStatusModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagementLostFoundSection;
