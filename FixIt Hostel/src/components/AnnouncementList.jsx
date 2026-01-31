import React, { useState, useEffect } from 'react';
import { announcementService } from '../services/apiService';
import Card from './Card';
import '../styles/Announcement.css';

const AnnouncementList = ({ showForm = false, user = null, isManagement = false }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await announcementService.getAnnouncements();
      const announcementList = Array.isArray(data) ? data : [];
      // Sort by creation date (newest first)
      announcementList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAnnouncements(announcementList);
    } catch (err) {
      setError('Failed to load announcements');
      console.error('Error fetching announcements:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!isManagement || !user) return;

    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      await announcementService.deleteAnnouncement(id);
      setAnnouncements(announcements.filter((a) => a.id !== id));
      setSelectedAnnouncement(null);
    } catch (err) {
      console.error('Error deleting announcement:', err);
      setError('Failed to delete announcement');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <div className="loading-state">⏳ Loading announcements...</div>
      </Card>
    );
  }

  return (
    <div className="announcement-list-container">
      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {announcements.length === 0 ? (
        <Card>
          <div className="empty-state-content">
            <div className="empty-icon">📢</div>
            <p className="empty-title">No Announcements Yet</p>
            <p className="empty-subtitle">
              {isManagement
                ? 'Post your first announcement to notify all users'
                : 'Check back later for announcements from management'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="announcement-cards">
          {announcements.map((announcement) => (
            <Card
              key={announcement.id}
              title={`📌 ${announcement.title}`}
              className="announcement-card"
            >
              <div className="announcement-content">
                <p className="announcement-description">
                  {announcement.description}
                </p>

                {announcement.content && (
                  <div className="announcement-details">
                    <p>{announcement.content}</p>
                  </div>
                )}

                <div className="announcement-meta">
                  <span className="meta-item">
                    📅 {formatDate(announcement.createdAt)}
                  </span>
                  <span className="meta-item">
                    👤 {announcement.postedBy || 'Management'}
                  </span>
                  {announcement.views !== undefined && (
                    <span className="meta-item">
                      👁️ {announcement.views} views
                    </span>
                  )}
                </div>

                {isManagement && user && (
                  <div className="announcement-actions">
                    <button
                      className="action-button delete-button"
                      onClick={() => handleDeleteAnnouncement(announcement.id)}
                      title="Delete this announcement"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnnouncementList;
