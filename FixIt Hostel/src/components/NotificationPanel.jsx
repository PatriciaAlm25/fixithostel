import React from 'react';
import '../styles/NotificationPanel.css';
import { formatDateTime } from '../utils/helpers';

const NotificationPanel = ({ notifications, onClose, onMarkAsRead }) => {
  return (
    <div className="notification-panel">
      <div className="notification-header">
        <h3>Notifications</h3>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="notification-list">
        {notifications.length === 0 ? (
          <p className="empty-message">No notifications</p>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`notification-item ${notif.read ? 'read' : 'unread'}`}
              onClick={() => onMarkAsRead(notif.id)}
            >
              <div className="notification-content">
                <p className="notification-message">{notif.message}</p>
                <small className="notification-time">
                  {formatDateTime(notif.createdAt)}
                </small>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
