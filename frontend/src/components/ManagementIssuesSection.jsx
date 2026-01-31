import React, { useState, useEffect } from 'react';
import '../styles/ManagementIssuesSection.css';
import * as managementService from '../services/supabaseManagementService';

const ManagementIssuesSection = ({ managementId, onActionComplete }) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [caretakers, setCaretakers] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    hostel: '',
  });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedCaretaker, setSelectedCaretaker] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);

  useEffect(() => {
    loadIssues();
    loadCaretakers();
  }, [managementId]);

  const loadIssues = async () => {
    setLoading(true);
    const result = await managementService.getAllIssues(managementId);
    if (result.success) {
      setIssues(result.issues || []);
    }
    setLoading(false);
  };

  const loadCaretakers = async () => {
    const result = await managementService.getAllCaretakers(managementId);
    if (result.success) {
      setCaretakers(result.caretakers || []);
    }
  };

  const handleAssignClick = (issue) => {
    setSelectedIssue(issue);
    setShowAssignModal(true);
  };

  const handleStatusClick = (issue) => {
    setSelectedIssue(issue);
    setShowStatusModal(true);
  };

  const handleAssignToCaretaker = async () => {
    if (!selectedCaretaker) {
      alert('Please select a caretaker');
      return;
    }

    const result = await managementService.assignIssueToCaret aker(
      selectedIssue.id,
      selectedCaretaker,
      managementId
    );

    if (result.success) {
      alert('Issue assigned successfully');
      setShowAssignModal(false);
      loadIssues();
      if (onActionComplete) onActionComplete();
    } else {
      alert(`Error: ${result.message}`);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedStatus) {
      alert('Please select a status');
      return;
    }

    const result = await managementService.updateIssueStatus(
      selectedIssue.id,
      selectedStatus,
      managementId
    );

    if (result.success) {
      alert('Issue status updated successfully');
      setShowStatusModal(false);
      loadIssues();
      if (onActionComplete) onActionComplete();
    } else {
      alert(`Error: ${result.message}`);
    }
  };

  const filteredIssues = issues.filter(issue => {
    return (
      (!filters.status || issue.status === filters.status) &&
      (!filters.priority || issue.priority === filters.priority) &&
      (!filters.hostel || issue.hostel === filters.hostel)
    );
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Reported':
        return '#ff6b6b';
      case 'Assigned':
        return '#ffd93d';
      case 'Under Construction':
        return '#6c5ce7';
      case 'Repaired':
        return '#00b894';
      case 'Closed':
        return '#636e72';
      default:
        return '#667eea';
    }
  };

  return (
    <div className="management-issues-section">
      <h2>🔧 Issue Management</h2>

      {/* Filters */}
      <div className="filters">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="filter-select"
        >
          <option value="">All Statuses</option>
          <option value="Reported">Reported</option>
          <option value="Assigned">Assigned</option>
          <option value="Under Construction">Under Construction</option>
          <option value="Repaired">Repaired</option>
          <option value="Closed">Closed</option>
        </select>

        <select
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          className="filter-select"
        >
          <option value="">All Priorities</option>
          <option value="Low">Low</option>
          <option value="Normal">Normal</option>
          <option value="High">High</option>
          <option value="Urgent">Urgent</option>
        </select>
      </div>

      {/* Issues List */}
      {loading ? (
        <p className="loading">Loading issues...</p>
      ) : filteredIssues.length === 0 ? (
        <p className="no-data">No issues found</p>
      ) : (
        <div className="issues-list">
          {filteredIssues.map((issue) => (
            <div key={issue.id} className="issue-card">
              <div className="issue-header">
                <h3>{issue.title}</h3>
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(issue.status) }}
                >
                  {issue.status}
                </span>
              </div>

              <p className="issue-description">{issue.description}</p>

              <div className="issue-details">
                <p>
                  <strong>Category:</strong> {issue.category}
                </p>
                <p>
                  <strong>Priority:</strong> {issue.priority}
                </p>
                {issue.hostel && (
                  <p>
                    <strong>Location:</strong> {issue.hostel}
                    {issue.block && ` - Block ${issue.block}`}
                    {issue.room_no && ` - Room ${issue.room_no}`}
                  </p>
                )}
                {issue.user && (
                  <p>
                    <strong>Reported by:</strong> {issue.user.name} ({issue.user.email})
                  </p>
                )}
                {issue.assigned_to_caretaker && (
                  <p>
                    <strong>Assigned to:</strong> {issue.assigned_to_caretaker.name}
                  </p>
                )}
              </div>

              {issue.image_url && (
                <div className="issue-images">
                  <h4>📸 Attached Image</h4>
                  <div className="images-gallery">
                    <div 
                      className="image-thumbnail"
                      onClick={() => setSelectedImageUrl(issue.image_url)}
                    >
                      <img src={issue.image_url} alt="Issue" />
                      <span className="image-count">1</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="issue-actions">
                <button
                  onClick={() => handleAssignClick(issue)}
                  className="btn-assign"
                  disabled={issue.status === 'Closed'}
                >
                  👤 Assign to Caretaker
                </button>
                <button
                  onClick={() => handleStatusClick(issue)}
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
            <img src={selectedImageUrl} alt="Issue Preview" />
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Assign Issue to Caretaker</h3>
            <p>
              <strong>Issue:</strong> {selectedIssue?.title}
            </p>

            <select
              value={selectedCaretaker}
              onChange={(e) => setSelectedCaretaker(e.target.value)}
              className="modal-select"
            >
              <option value="">Select a caretaker...</option>
              {caretakers.map((caretaker) => (
                <option key={caretaker.id} value={caretaker.id}>
                  {caretaker.name} ({caretaker.email})
                </option>
              ))}
            </select>

            <div className="modal-actions">
              <button onClick={handleAssignToCaretaker} className="btn-primary">
                Assign
              </button>
              <button
                onClick={() => setShowAssignModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Update Issue Status</h3>
            <p>
              <strong>Issue:</strong> {selectedIssue?.title}
            </p>
            <p>
              <strong>Current Status:</strong> {selectedIssue?.status}
            </p>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="modal-select"
            >
              <option value="">Select new status...</option>
              <option value="Reported">Reported</option>
              <option value="Assigned">Assigned</option>
              <option value="Under Construction">Under Construction</option>
              <option value="Repaired">Repaired</option>
              <option value="Closed">Closed</option>
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

export default ManagementIssuesSection;
