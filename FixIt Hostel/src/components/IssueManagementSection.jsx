import React, { useState, useEffect } from 'react';
import * as supabaseManagement from '../services/supabaseManagement';
import '../styles/Dashboard.css';

const IssueManagementSection = ({ issues = [], onStatusChange, onAssign }) => {
  const [expandedIssue, setExpandedIssue] = useState(null);
  const [caretakers, setCaretakers] = useState([]);
  const [loadingCaretakers, setLoadingCaretakers] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    hostel: '',
    assignmentStatus: '', // 'unassigned', 'assigned'
  });

  // Load caretakers on mount
  useEffect(() => {
    const loadCaretakers = async () => {
      setLoadingCaretakers(true);
      try {
        const result = await supabaseManagement.getAllCaretakers();
        if (result.success) {
          setCaretakers(result.caretakers || []);
          console.log('✅ Loaded caretakers:', result.caretakers?.length);
        }
      } catch (error) {
        console.error('Error loading caretakers:', error);
      } finally {
        setLoadingCaretakers(false);
      }
    };

    loadCaretakers();
  }, []);

  // Filter issues
  const filteredIssues = issues.filter((issue) => {
    if (filters.status && issue.status !== filters.status) return false;
    if (filters.priority && issue.priority !== filters.priority) return false;
    if (filters.hostel && issue.hostel !== filters.hostel) return false;
    if (filters.assignmentStatus === 'unassigned' && issue.assigned_to) return false;
    if (filters.assignmentStatus === 'assigned' && !issue.assigned_to) return false;
    return true;
  });

  const priorityColor = (priority) => {
    const colors = {
      'Emergency': '#dc3545',
      'High': '#fd7e14',
      'Medium': '#ffc107',
      'Low': '#28a745',
    };
    return colors[priority] || '#6c757d';
  };

  const statusColor = (status) => {
    const colors = {
      'Open': '#e7f3ff',
      'Assigned': '#fff3cd',
      'In Progress': '#cfe2ff',
      'Pending': '#f8d7da',
      'Repaired': '#d4edda',
      'Completed': '#d4edda',
      'Rejected': '#f8d7da',
    };
    return colors[status] || '#e9ecef';
  };

  return (
    <div className="issue-management-section">
      <div className="management-filters">
        <div className="filter-group">
          <label>Status:</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="Open">Open</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Repaired">Repaired</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Priority:</label>
          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            className="filter-select"
          >
            <option value="">All Priority</option>
            <option value="Emergency">Emergency</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Assignment:</label>
          <select
            value={filters.assignmentStatus}
            onChange={(e) => setFilters({ ...filters, assignmentStatus: e.target.value })}
            className="filter-select"
          >
            <option value="">All</option>
            <option value="unassigned">Unassigned</option>
            <option value="assigned">Assigned</option>
          </select>
        </div>
      </div>

      <div className="issues-management-list">
        {filteredIssues.length > 0 ? (
          filteredIssues.map((issue) => (
            <div key={issue.id} className="management-issue-card">
              <div 
                className="issue-header"
                onClick={() => setExpandedIssue(expandedIssue === issue.id ? null : issue.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="issue-info">
                  <h4>{issue.title}</h4>
                  <div className="issue-meta">
                    <span 
                      className="badge-priority"
                      style={{ backgroundColor: priorityColor(issue.priority) }}
                    >
                      {issue.priority}
                    </span>
                    <span 
                      className="badge-status"
                      style={{ backgroundColor: statusColor(issue.status) }}
                    >
                      {issue.status}
                    </span>
                    <span className="issue-location">
                      📍 {issue.hostel} {issue.block ? `- ${issue.block}` : ''} {issue.room_no ? `- ${issue.room_no}` : ''}
                    </span>
                  </div>
                </div>
                <div className="issue-actions-toggle">
                  <span>{expandedIssue === issue.id ? '▼' : '▶'}</span>
                </div>
              </div>

              {expandedIssue === issue.id && (
                <div className="issue-details">
                  <div className="details-content">
                    <p><strong>Description:</strong> {issue.description}</p>
                    <p><strong>Category:</strong> {issue.category}</p>
                    <p><strong>Date Created:</strong> {new Date(issue.created_at).toLocaleDateString()}</p>
                    <p>
                      <strong>Posted by:</strong> {issue.users?.name || 'Unknown'} ({issue.users?.email || 'N/A'})
                      <br />
                      <span style={{ fontSize: '0.9rem', color: '#666' }}>
                        Room: {issue.users?.room_no || 'N/A'} | Hostel: {issue.users?.hostel || 'N/A'}
                      </span>
                    </p>
                    {issue.assigned_to && (
                      <p><strong>Assigned to:</strong> {issue.assigned_to}</p>
                    )}
                    {issue.images && issue.images.length > 0 && (
                      <div className="issue-images-preview">
                        <strong>Images ({issue.images.length}):</strong>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
                          {issue.images.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Issue ${idx + 1}`}
                              style={{
                                width: '100%',
                                height: '80px',
                                objectFit: 'cover',
                                borderRadius: '4px',
                                cursor: 'pointer',
                              }}
                              onClick={() => window.open(img, '_blank')}
                              title="Click to open in new tab"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="issue-management-controls">
                    {!issue.assigned_to && (
                      <div className="assign-control">
                        <label>Assign to Caretaker:</label>
                        <select
                          className="caretaker-select"
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) {
                              onAssign?.(issue.id, e.target.value);
                              e.target.value = '';
                            }
                          }}
                        >
                          <option value="">-- Select Caretaker --</option>
                          {caretakers.map((caretaker) => (
                            <option key={caretaker.id} value={caretaker.id}>
                              {caretaker.name} ({caretaker.email})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="status-control">
                      <label>Update Status:</label>
                      <select
                        className="status-select"
                        value={issue.status}
                        onChange={(e) => onStatusChange?.(issue.id, e.target.value)}
                      >
                        <option value="Open">Open</option>
                        <option value="Assigned">Assigned</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Repaired">Repaired</option>
                        <option value="Completed">Completed</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: '#666',
            background: '#f8f9fa',
            borderRadius: '4px',
            marginTop: '1rem'
          }}>
            <p style={{ fontSize: '3rem' }}>📭</p>
            <p>No issues found matching the filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueManagementSection;
