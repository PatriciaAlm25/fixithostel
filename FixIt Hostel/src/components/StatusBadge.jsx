import React, { useState } from 'react';

const StatusBadge = ({ status, size = 'medium' }) => {
  const getStatusStyle = (status) => {
    const styles = {
      'Reported': { bg: '#fff3e0', color: '#ff9800', label: '📝 Reported' },
      'Assigned': { bg: '#e3f2fd', color: '#2196f3', label: '👤 Assigned' },
      'In Progress': { bg: '#f3e5f5', color: '#9c27b0', label: '⚙️ In Progress' },
      'Resolved': { bg: '#e8f5e9', color: '#4caf50', label: '✅ Resolved' },
      'Closed': { bg: '#eceff1', color: '#607d8b', label: '🏁 Closed' },
    };
    return styles[status] || { bg: '#f5f5f5', color: '#757575', label: status };
  };

  const style = getStatusStyle(status);

  const sizeClasses = {
    small: 'badge-small',
    medium: 'badge-medium',
    large: 'badge-large',
  };

  return (
    <span
      className={`status-badge ${sizeClasses[size]}`}
      style={{
        backgroundColor: style.bg,
        color: style.color,
      }}
    >
      {style.label}
    </span>
  );
};

export default StatusBadge;
