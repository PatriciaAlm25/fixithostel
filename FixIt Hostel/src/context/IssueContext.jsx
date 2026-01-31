import React, { createContext, useState, useCallback, useEffect } from 'react';
import * as supabaseIssues from '../services/supabaseIssues';
import { uploadIssueImages, deleteIssueImages } from '../services/supabaseStorage';

export const IssueContext = createContext();

export const IssueProvider = ({ children }) => {
  const [issues, setIssues] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  let unsubscribeIssues = null;

  // Subscribe to Supabase issues on initialization
  useEffect(() => {
    setIsLoading(true);
    try {
      // Subscribe and on any event re-fetch the latest issues list
      const subscription = supabaseIssues.subscribeToIssues(async () => {
        try {
          const result = await supabaseIssues.getAllIssues();
          if (result.success) {
            setIssues(result.issues || []);
            setError(null);
          }
        } catch (e) {
          console.error('Error reloading issues after event:', e);
        } finally {
          setIsLoading(false);
        }
      });
      unsubscribeIssues = subscription;
    } catch (err) {
      console.error('Error subscribing to issues:', err);
      setError(err.message);
      setIsLoading(false);
    }

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribeIssues) {
        if (typeof unsubscribeIssues.unsubscribe === 'function') {
          unsubscribeIssues.unsubscribe();
        } else if (typeof unsubscribeIssues === 'function') {
          unsubscribeIssues();
        }
      }
    };
  }, []);

  const createIssue = useCallback(async (issueData) => {
    try {
      setIsLoading(true);

      // Upload images to Supabase Storage
      let imageURLs = [];
      if (issueData.images && issueData.images.length > 0) {
        const uploadResults = await uploadIssueImages(issueData.images);
        imageURLs = uploadResults.imageURLs || [];
      }

      // Create issue in Supabase
      const newIssue = await supabaseIssues.createIssue({
        ...issueData,
        images: imageURLs,
      });

      setError(null);
      return newIssue;
    } catch (err) {
      console.error('Error creating issue:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateIssueStatus = useCallback(async (issueId, status, remarks, images = []) => {
    try {
      setIsLoading(true);

      // Upload new images if provided
      let imageURLs = [];
      if (images && images.length > 0) {
        const uploadResults = await uploadIssueImages(images);
        imageURLs = uploadResults.imageURLs || [];
      }

      // Update issue status in Supabase
      await supabaseIssues.updateIssueStatus(issueId, status, 'caretaker', imageURLs);

      setError(null);
    } catch (err) {
      console.error('Error updating issue status:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);


  const getIssuesByUser = useCallback(
    (userId) => {
      return issues.filter((issue) => issue.reportedBy === userId);
    },
    [issues]
  );

  const getAssignedIssues = useCallback(
    (caretakerId) => {
      return issues.filter((issue) => issue.assignedTo === caretakerId);
    },
    [issues]
  );

  const getIssueById = useCallback(
    (issueId) => {
      return issues.find((issue) => issue.id === issueId);
    },
    [issues]
  );

  const getIssuesByStatus = useCallback(
    (status) => {
      return issues.filter((issue) => issue.status === status);
    },
    [issues]
  );

  const deleteIssue = useCallback(async (issueId) => {
    try {
      setIsLoading(true);

      // Get issue to access images
      const issue = issues.find((i) => i.id === issueId);
      if (issue && issue.images && issue.images.length > 0) {
        await deleteIssueImages(issue.images);
      }

      // Delete issue from Supabase
      await supabaseIssues.deleteIssue(issueId);

      setError(null);
    } catch (err) {
      console.error('Error deleting issue:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [issues]);

  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now(),
      createdAt: new Date(),
      read: false,
      ...notification,
    };
    setNotifications((prev) => [newNotification, ...prev]);
  }, []);

  const markNotificationAsRead = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  }, []);

  const value = {
    issues,
    notifications,
    createIssue,
    updateIssueStatus,
    deleteIssue,
    getIssuesByUser,
    getAssignedIssues,
    getIssueById,
    getIssuesByStatus,
    addNotification,
    markNotificationAsRead,
    setIssues,
    isLoading,
    error,
  };

  return <IssueContext.Provider value={value}>{children}</IssueContext.Provider>;
};
