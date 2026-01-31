import React, { useState } from 'react';
import { announcementService } from '../services/apiService';
import '../styles/Announcement.css';

const AnnouncementForm = ({ user, onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitMessage('');

    // Only management can post announcements
    if (user?.role !== 'management') {
      setSubmitError('❌ Only management can post announcements');
      console.warn('⚠️ Unauthorized: Only management can create announcements');
      return;
    }

    // Validation
    if (!formData.title.trim()) {
      setSubmitError('Please enter an announcement title');
      return;
    }

    if (!formData.description.trim()) {
      setSubmitError('Please enter a description');
      return;
    }

    setIsSubmitting(true);

    try {
      await announcementService.createAnnouncement({
        title: formData.title,
        description: formData.description,
        content: formData.content,
        userRole: user?.role || 'management',
        userId: user?.id || 'system',
        userName: user?.name || 'Management',
      });

      setSubmitMessage('✅ Announcement posted successfully!');
      setFormData({
        title: '',
        description: '',
        content: '',
      });

      if (onSuccess) {
        onSuccess();
      }

      // Clear message after 3 seconds
      setTimeout(() => {
        setSubmitMessage('');
      }, 3000);
    } catch (error) {
      const errorMsg = error.message || 'Failed to post announcement';
      setSubmitError(`❌ ${errorMsg}`);
      console.error('Error posting announcement:', error);
      
      if (onError) {
        onError(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="announcement-form-container">
      <form onSubmit={handleSubmit} className="announcement-form">
        <div className="form-group">
          <label htmlFor="title">📢 Announcement Title</label>
          <input
            id="title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Hostel Maintenance Notice"
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <input
            id="description"
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Brief description of the announcement"
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">Detailed Content (Optional)</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="Add more details about the announcement..."
            className="form-textarea"
            rows="5"
          />
        </div>

        {submitError && (
          <div className="form-error">
            {submitError}
          </div>
        )}

        {submitMessage && (
          <div className="form-success">
            {submitMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="form-button"
        >
          {isSubmitting ? '⏳ Posting...' : '📤 Post Announcement'}
        </button>
      </form>
    </div>
  );
};

export default AnnouncementForm;
