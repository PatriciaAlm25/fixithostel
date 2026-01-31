import React, { useState, useEffect } from 'react';
import * as firebaseDataService from '../services/firebaseDataService';
import '../styles/MergedIssuesPanel.css';

const MergedIssuesPanel = ({ issue, onUnmerge }) => {
  const [mergeInfo, setMergeInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMergeInfo = async () => {
      if (issue.mergeId) {
        try {
          const info = await firebaseDataService.getLinkedIssues(issue.mergeId);
          setMergeInfo(info);
        } catch (error) {
          console.error('Error fetching merge info:', error);
        }
      }
    };

    fetchMergeInfo();
  }, [issue.mergeId]);

  const handleUnmerge = async () => {
    if (!window.confirm('Unmerge these issues? They will return to separate tracking.')) return;

    setLoading(true);
    try {
      await firebaseDataService.unmergeIssues(issue.mergeId);
      onUnmerge?.();
    } catch (error) {
      console.error('Error unmerging:', error);
      alert('Failed to unmerge issues');
    } finally {
      setLoading(false);
    }
  };

  if (!mergeInfo) return null;

  return (
    <div className="merged-issues-panel">
      <div className="merge-header">
        <h4>🔗 Merged Issues ({mergeInfo.linkedIssueIds.length})</h4>
        <span className="merge-badge">Primary Issue</span>
      </div>

      <div className="merge-info">
        <p>
          <strong>Status:</strong> This is the primary issue for {mergeInfo.linkedIssueIds.length} duplicate issue(s)
        </p>
        <p>
          <strong>All Reporters:</strong> {mergeInfo.allReporters.length} unique reporter(s)
        </p>
        <p>
          <strong>Merged At:</strong> {new Date(mergeInfo.mergedAt).toLocaleDateString()}
        </p>
      </div>

      <div className="linked-issues-list">
        <h5>Linked Duplicate Issues:</h5>
        {Object.entries(mergeInfo.linkedIssueDetails).map(([issueId, details]) => (
          <div key={issueId} className="linked-issue-item">
            <div className="issue-item-header">
              <span className="issue-id">{issueId.substring(0, 12)}...</span>
              <span className="reporter-label">Reported by: {details.reportedBy}</span>
            </div>
            <p className="issue-title">{details.title}</p>
            <span className="issue-date">
              {new Date(details.createdAt).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>

      <div className="merge-actions">
        <p className="merge-note">
          ℹ️ All reporters are notified when this primary issue status updates.
        </p>
        <button 
          className="unmerge-btn"
          onClick={handleUnmerge}
          disabled={loading}
        >
          {loading ? '⏳ Processing...' : '🔓 Unmerge Issues'}
        </button>
      </div>
    </div>
  );
};

export default MergedIssuesPanel;
