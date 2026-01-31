import React, { useState, useEffect } from 'react';
import * as firebaseDataService from '../services/firebaseDataService';
import '../styles/MergeIssuesDialog.css';

const MergeIssuesDialog = ({ primaryIssue, allIssues, onMerge, onCancel }) => {
  const [selectedIssues, setSelectedIssues] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter: exclude primary issue and already merged issues
  const availableIssues = allIssues.filter(
    issue =>
      issue.id !== primaryIssue.id &&
      issue.status !== 'Merged' &&
      issue.status !== 'Resolved'
  );

  const handleToggleIssue = (issueId) => {
    const newSelected = new Set(selectedIssues);
    if (newSelected.has(issueId)) {
      newSelected.delete(issueId);
    } else {
      newSelected.add(issueId);
    }
    setSelectedIssues(newSelected);
  };

  const handleMerge = async () => {
    if (selectedIssues.size === 0) {
      alert('Please select at least one issue to merge');
      return;
    }

    if (!window.confirm(
      `Merge ${selectedIssues.size} issue(s) into this primary issue? All reporters will be notified of status updates.`
    )) {
      return;
    }

    setIsSubmitting(true);
    try {
      const linkedIds = Array.from(selectedIssues);
      await firebaseDataService.mergeIssues(primaryIssue.id, linkedIds, 'current-user-id');
      alert('✅ Issues merged successfully!');
      onMerge?.();
    } catch (error) {
      console.error('Error merging issues:', error);
      alert('Failed to merge issues: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="merge-dialog-overlay">
      <div className="merge-dialog">
        <div className="dialog-header">
          <h3>🔗 Merge Duplicate Issues</h3>
          <button className="close-btn" onClick={onCancel}>✕</button>
        </div>

        <div className="dialog-content">
          <div className="primary-issue-section">
            <h4>Primary Issue (Keep this one)</h4>
            <div className="primary-issue-card">
              <h5>{primaryIssue.title}</h5>
              <p>{primaryIssue.description}</p>
              <span className="status-badge">{primaryIssue.status}</span>
            </div>
          </div>

          <div className="duplicate-issues-section">
            <h4>Select Duplicate Issues to Merge ({selectedIssues.size})</h4>
            {availableIssues.length === 0 ? (
              <p className="no-issues">No duplicate issues available to merge</p>
            ) : (
              <div className="issues-checklist">
                {availableIssues.map(issue => (
                  <label key={issue.id} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedIssues.has(issue.id)}
                      onChange={() => handleToggleIssue(issue.id)}
                    />
                    <div className="issue-info">
                      <h5>{issue.title}</h5>
                      <p className="issue-meta">
                        Reported by {issue.reportedBy} on{' '}
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </p>
                      <span className="status-badge">{issue.status}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="merge-info-box">
            <p>ℹ️ When issues are merged:</p>
            <ul>
              <li>All original reporters are preserved</li>
              <li>The primary issue becomes the single tracking point</li>
              <li>All reporters get notified when primary issue status changes</li>
              <li>Duplicate issues show as "Merged" for reference</li>
              <li>Issues can be unmerged later if needed</li>
            </ul>
          </div>
        </div>

        <div className="dialog-actions">
          <button className="cancel-btn" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
          <button
            className="merge-btn"
            onClick={handleMerge}
            disabled={isSubmitting || selectedIssues.size === 0}
          >
            {isSubmitting ? '⏳ Merging...' : `🔗 Merge ${selectedIssues.size} Issue(s)`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MergeIssuesDialog;
