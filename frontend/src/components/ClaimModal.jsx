import React, { useState } from 'react';

const ClaimModal = ({ item, onSubmit, onCancel, userInfo }) => {
  // Handle both backend field names (type, title) and potential frontend field names
  const itemTitle = item.title || item.itemName;

  const [claimData, setClaimData] = useState({
    claimerName: userInfo?.name || '',
    claimerEmail: userInfo?.email || '',
    claimerPhone: userInfo?.phone || '',
    studentId: userInfo?.id || '',
    roomNo: userInfo?.roomNo || '',
    hostel: userInfo?.hostel || '',
    proofDescription: '',
    additionalInfo: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setClaimData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!claimData.proofDescription.trim()) {
      alert('Please describe how the item is yours');
      return;
    }

    onSubmit(claimData);
  };

  return (
    <div className="claim-modal-overlay" onClick={onCancel}>
      <div className="claim-modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Claim Item: {itemTitle}</h2>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="claim-form">
          <div className="form-section">
            <h3>Your Information</h3>
            
            <div className="form-group">
              <label htmlFor="claimerName">Full Name</label>
              <input
                id="claimerName"
                type="text"
                name="claimerName"
                value={claimData.claimerName}
                onChange={handleChange}
                readOnly
                className="form-input-readonly"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="claimerEmail">Email</label>
                <input
                  id="claimerEmail"
                  type="email"
                  name="claimerEmail"
                  value={claimData.claimerEmail}
                  onChange={handleChange}
                  readOnly
                  className="form-input-readonly"
                />
              </div>
              <div className="form-group">
                <label htmlFor="claimerPhone">Phone</label>
                <input
                  id="claimerPhone"
                  type="tel"
                  name="claimerPhone"
                  value={claimData.claimerPhone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="hostel">Hostel</label>
                <input
                  id="hostel"
                  type="text"
                  name="hostel"
                  value={claimData.hostel}
                  onChange={handleChange}
                  readOnly
                  className="form-input-readonly"
                />
              </div>
              <div className="form-group">
                <label htmlFor="roomNo">Room No.</label>
                <input
                  id="roomNo"
                  type="text"
                  name="roomNo"
                  value={claimData.roomNo}
                  onChange={handleChange}
                  readOnly
                  className="form-input-readonly"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Proof of Ownership</h3>
            
            <div className="form-group">
              <label htmlFor="proofDescription">
                How do you identify this item as yours? *
                <span className="help-text">(Describe specific features, marks, or distinguishing characteristics)</span>
              </label>
              <textarea
                id="proofDescription"
                name="proofDescription"
                value={claimData.proofDescription}
                onChange={handleChange}
                placeholder="e.g., 'My name is engraved on the back of the laptop', 'Has a broken hinge on the left side', etc."
                rows="4"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="additionalInfo">Additional Information (Optional)</label>
              <textarea
                id="additionalInfo"
                name="additionalInfo"
                value={claimData.additionalInfo}
                onChange={handleChange}
                placeholder="Any other relevant information about the item..."
                rows="3"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Submit Claim
            </button>
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClaimModal;
