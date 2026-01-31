import React from 'react';

const StatusTimeline = ({ statusHistory = [] }) => {
  const statusOrder = ['Reported', 'Assigned', 'In Progress', 'Resolved', 'Closed'];

  const getStatusIcon = (status) => {
    const icons = {
      'Reported': '📝',
      'Assigned': '👤',
      'In Progress': '⚙️',
      'Resolved': '✅',
      'Closed': '🏁',
    };
    return icons[status] || '📌';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Reported': '#ff9800',
      'Assigned': '#2196f3',
      'In Progress': '#9c27b0',
      'Resolved': '#4caf50',
      'Closed': '#607d8b',
    };
    return colors[status] || '#757575';
  };

  const sortedStatusHistory = [...statusHistory].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );

  const completedStatuses = sortedStatusHistory.map(s => s.status);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="status-timeline-container">
      <h3 className="timeline-title">Issue Status Timeline</h3>

      {/* Timeline Steps */}
      <div className="timeline-stepper">
        {statusOrder.map((status, index) => {
          const isCompleted = completedStatuses.includes(status);
          const statusData = sortedStatusHistory.find(s => s.status === status);

          return (
            <div key={status} className="timeline-step">
              <div className={`step-indicator ${isCompleted ? 'completed' : 'pending'}`}
                   style={{ borderColor: getStatusColor(status) }}>
                <span className="step-icon">{getStatusIcon(status)}</span>
              </div>

              <div className="step-content">
                <div className="step-status">{status}</div>
                {statusData && (
                  <div className="step-info">
                    <div className="step-timestamp">
                      {formatDate(statusData.timestamp)}
                    </div>
                    {statusData.assignedTo && (
                      <div className="step-assigned">Assigned to: {statusData.assignedTo}</div>
                    )}
                    {statusData.remarks && (
                      <div className="step-remarks">{statusData.remarks}</div>
                    )}
                  </div>
                )}
              </div>

              {index < statusOrder.length - 1 && (
                <div className={`step-connector ${isCompleted ? 'completed' : 'pending'}`}
                     style={{ borderColor: isCompleted ? getStatusColor(status) : '#ddd' }}></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Status Summary */}
      {sortedStatusHistory.length > 0 && (
        <div className="timeline-summary">
          <div className="summary-stat">
            <span className="summary-label">Total Updates:</span>
            <span className="summary-value">{sortedStatusHistory.length}</span>
          </div>
          <div className="summary-stat">
            <span className="summary-label">Current Status:</span>
            <span className="summary-value" style={{ color: getStatusColor(sortedStatusHistory[sortedStatusHistory.length - 1]?.status) }}>
              {sortedStatusHistory[sortedStatusHistory.length - 1]?.status}
            </span>
          </div>
          {sortedStatusHistory.length > 1 && (
            <div className="summary-stat">
              <span className="summary-label">Duration:</span>
              <span className="summary-value">
                {Math.ceil(
                  (new Date(sortedStatusHistory[sortedStatusHistory.length - 1]?.timestamp) -
                    new Date(sortedStatusHistory[0]?.timestamp)) /
                    (1000 * 60 * 60)
                )}{' '}
                hours
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StatusTimeline;
