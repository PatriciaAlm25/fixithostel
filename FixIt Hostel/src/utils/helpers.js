export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

export const validatePhone = (phone) => {
  const re = /^[0-9]{10}$/;
  return re.test(phone.replace(/\D/g, ''));
};

export const capitalizeWords = (str) => {
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getInitials = (name) => {
  return name
    .split(' ')
    .map((n) => n.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
};

export const getStatusColor = (status) => {
  const colors = {
    Reported: '#3b82f6',
    Assigned: '#f59e0b',
    'In Progress': '#8b5cf6',
    Resolved: '#10b981',
    Closed: '#6b7280',
  };
  return colors[status] || '#6b7280';
};

export const getPriorityColor = (priority) => {
  const colors = {
    Low: '#10b981',
    Medium: '#f59e0b',
    High: '#ef4444',
    Emergency: '#dc2626',
  };
  return colors[priority] || '#6b7280';
};
