import React, { useState } from 'react';
import CameraInput from './CameraInput';

const StatusUpdateModal = ({ issue, currentUser, onSubmit, onCancel }) => {
  const [newStatus, setNewStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [proofImages, setProofImages] = useState([]);

  // Determine available next statuses based on current status and user role
  const getAvailableStatuses = () => {
    const currentStatus = issue.status || 'Reported';
    const statusFlow = {
      'Reported': ['Assigned'],
      'Assigned': ['In Progress', 'Reported'],
      'In Progress': ['Resolved', 'Assigned'],
      'Resolved': ['Closed', 'In Progress'],
      'Closed': [],
    };

    return statusFlow[currentStatus] || [];
  };

  const canUpdateStatus = () => {
    const isStudent = currentUser.role === 'student';
    const isCaretaker = currentUser.role === 'caretaker';
    const isManagement = currentUser.role === 'management';

    // Students: can only view
    if (isStudent) return false;

    // Caretakers: can update to In Progress and Resolved
    if (isCaretaker) {
      return ['In Progress', 'Resolved'].includes(newStatus);
    }

    // Management: can update to any next status and assign
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!newStatus) {
      alert('Please select a new status');
      return;
    }

    if (!remarks.trim()) {
      alert('Please add remarks for the status update');
      return;
    }

    if (!canUpdateStatus()) {
      alert('You do not have permission to update to this status');
      return;
    }

    const updateData = {
      status: newStatus,
      remarks,
      timestamp: new Date(),
      updatedBy: currentUser.name,
      updatedByRole: currentUser.role,
    };

    if (assignedTo && newStatus === 'Assigned') {
      updateData.assignedTo = assignedTo;
    }

    if (proofImages.length > 0) {
      updateData.proofImages = proofImages;
    }

    onSubmit(updateData);
  };

  const availableStatuses = getAvailableStatuses();
  const caretakers = ['John Doe (Plumber)', 'Jane Smith (Electrician)', 'Mike Johnson (Carpenter)'];

  return (
    <div className="status-update-modal-overlay" onClick={onCancel}>
      <div className="status-update-modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Update Issue Status</h2>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>

        <div className="modal-body">
          <div className="issue-info">
            <h3>{issue.description}</h3>
            <p>Current Status: <strong>{issue.status}</strong></p>
          </div>

          <form onSubmit={handleSubmit} className="status-update-form">
            {/* Status Selection */}
            <div className="form-section">
              <h4>Change Status</h4>
              <div className="form-group">
                <label htmlFor="newStatus">Select New Status *</label>
                <select
                  id="newStatus"
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  required
                >
                  <option value="">-- Select Status --</option>
                  {availableStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Assignment Section (Management Only) */}
            {currentUser.role === 'management' && newStatus === 'Assigned' && (
              <div className="form-section">
                <h4>Assign To</h4>
                <div className="form-group">
                  <label htmlFor="assignedTo">Select Caretaker/Team *</label>
                  <select
                    id="assignedTo"
                    value={assignedTo}
                    onChange={e => setAssignedTo(e.target.value)}
                    required={newStatus === 'Assigned'}
                  >
                    <option value="">-- Select Caretaker --</option>
                    {caretakers.map(caretaker => (
                      <option key={caretaker} value={caretaker}>{caretaker}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Remarks Section */}
            <div className="form-section">
              <h4>Remarks & Notes</h4>
              <div className="form-group">
                <label htmlFor="remarks">
                  Add remarks about this status update *
                  <span className="help-text">(Required)</span>
                </label>
                <textarea
                  id="remarks"
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder={`E.g., ${
                    newStatus === 'Assigned'
                      ? 'Issue assigned to maintenance team'
                      : newStatus === 'In Progress'
                      ? 'Currently working on the issue'
                      : newStatus === 'Resolved'
                      ? 'Issue has been fixed and tested'
                      : 'Issue is now closed'
                  }`}
                  rows="4"
                  required
                />
                <div className="char-count">{remarks.length}/500</div>
              </div>
            </div>

            {/* Proof Images (for Resolved/Closed) */}
            {['Resolved', 'Closed'].includes(newStatus) && (
              <div className="form-section">
                <h4>Proof of Resolution</h4>
                <div className="form-group">
                  <label>Upload completion photos (Optional)</label>
                  <CameraInput
                    onImagesSelected={setProofImages}
                    maxImages={3}
                    required={false}
                  />
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Update Status
              </button>
              <button type="button" className="btn btn-secondary" onClick={onCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StatusUpdateModal;
