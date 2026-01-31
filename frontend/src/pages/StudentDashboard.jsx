import React, { useState, useEffect } from 'react';
import { useAuth, useIssues } from '../hooks/useCustom';
import Navigation from '../components/Navigation';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import IssueCard from '../components/IssueCard';
import Modal from '../components/Modal';
import ReportSuccessModal from '../components/ReportSuccessModal';
import Form from '../components/Form';
import LostFoundForm from '../components/LostFoundForm';
import AnnouncementList from '../components/AnnouncementList';
import ReportedItemsDisplay from '../components/ReportedItemsDisplay';
import { issueCategories, priorities, hostels, blocks } from '../services/mockData';
import * as supabaseLostFound from '../services/supabaseLostFound';
import * as supabaseIssues from '../services/supabaseIssues';
import '../styles/Dashboard.css';

const StudentDashboard = ({ onGoBack }) => {
  const { user } = useAuth();
  const { addNotification } = useIssues();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showLostFoundModal, setShowLostFoundModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successIssueData, setSuccessIssueData] = useState(null);
  const [studentIssues, setStudentIssues] = useState([]);
  const [allIssues, setAllIssues] = useState([]);
  const [lostFoundItems, setLostFoundItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [refreshLostFound, setRefreshLostFound] = useState(false);

  // Function to refresh lost & found items
  const refreshLostFoundItems = async () => {
    try {
      console.log('🔄 Refreshing lost & found items...');
      setLoadingItems(true);
      const result = await supabaseLostFound.getAllLostFoundItems();
      console.log('📊 Fetch result:', result);
      if (result.success) {
        console.log(`✅ Successfully fetched ${result.items.length} items`);
        setLostFoundItems(result.items);
        console.log('✅ Lost & Found items refreshed:', result.items.length);
      } else {
        console.error('❌ Failed to fetch items:', result.error);
        alert(`Error loading items: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error refreshing lost & found items:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoadingItems(false);
    }
  };

  // Subscribe to all issues for real-time updates
  useEffect(() => {
    console.log('📡 Setting up real-time subscription to issues...');
    try {
      const subscription = supabaseIssues.subscribeToIssues(() => {
        // When issues update, fetch all issues
        loadAllIssues();
      });

      return () => {
        if (subscription && subscription.unsubscribe) {
          subscription.unsubscribe();
        }
      };
    } catch (error) {
      console.error('Error setting up subscription:', error);
    }
  }, []);

  // Initial load of issues
  useEffect(() => {
    loadAllIssues();
  }, []);

  // Filter issues reported by current user (for "My Issues")
  useEffect(() => {
    const filtered = allIssues.filter((issue) => {
      const isReportedByUser = issue.reported_by && (issue.reported_by === user?.id || issue.reported_by?.id === user?.id || String(issue.reported_by) === String(user?.id));
      const isUserIdMatch = issue.user_id && (issue.user_id === user?.id || issue.user_id?.id === user?.id || String(issue.user_id) === String(user?.id));
      return isReportedByUser || isUserIdMatch;
    });
    console.log('📋 My Issues filter:', {
      userID: user?.id,
      totalIssues: allIssues.length,
      filtered: filtered.length,
      filteredIssues: filtered.map(i => ({
        id: i.id,
        description: i.description,
        images_count: Array.isArray(i.images) ? i.images.length : 0,
        images: i.images
      }))
    });
    setStudentIssues(filtered);
  }, [allIssues, user?.id]);

  // Function to determine which issues user can see based on role and visibility
  const getVisibleIssues = () => {
    if (!user) return [];

    return allIssues.filter((issue) => {
      // Management and cleaners can see all issues (both public and private)
      if (user.role === 'management' || user.role === 'caretaker') {
        return true;
      }

      // Students can only see:
      // 1. Their own issues (regardless of visibility)
      // 2. Public issues from others
      const isOwnIssue = String(issue.reported_by || issue.user_id) === String(user?.id);
      if (isOwnIssue) {
        return true; // Show own issues
      }

      if (issue.visibility === 'Public' || issue.visibility === 'public') {
        return true; // Show public issues
      }

      return false;
    });
  };

  const visibleIssues = getVisibleIssues();

  const loadAllIssues = async () => {
    try {
      const result = await supabaseIssues.getAllIssues();
      if (result.success) {
        console.log('📊 Loaded issues from getAllIssues:', {
          count: result.issues?.length || 0,
          issues: result.issues?.map(i => ({
            id: i.id,
            description: i.description,
            images: i.images,
            images_type: typeof i.images,
            images_is_array: Array.isArray(i.images),
          })) || []
        });
        setAllIssues(result.issues || []);
      }
    } catch (error) {
      console.error('Error loading issues:', error);
    }
  };

  useEffect(() => {
    // Subscribe to lost & found items when tab is opened
    if (activeTab === 'lost-found') {
      console.log('📂 Lost & Found tab opened');
      setLoadingItems(true);
      let unsubscribeFunc = null;
      
      const setupSubscription = async () => {
        try {
          console.log('⏳ Setting up lost & found subscription...');
          
          // First, load all items
          await refreshLostFoundItems();
          
          // Then set up real-time subscription
          const subscription = await supabaseLostFound.subscribeToLostFound((items) => {
            console.log('🔄 Real-time update received, updating items:', items.length);
            setLostFoundItems(items);
            setLoadingItems(false);
          });
          
          unsubscribeFunc = subscription;
          console.log('✅ Subscription set up successfully');
        } catch (error) {
          console.error('❌ Error setting up subscription:', error);
          setLoadingItems(false);
        }
      };

      setupSubscription();
      
      // Cleanup function
      return () => {
        if (unsubscribeFunc && unsubscribeFunc.unsubscribe) {
          console.log('🔌 Unsubscribing from lost & found updates');
          unsubscribeFunc.unsubscribe();
        }
      };
    }
  }, [activeTab]);

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'issues', label: 'My Issues', icon: '📋' },
    ...(user?.role === 'management' || user?.role === 'caretaker' ? [{ id: 'all-issues', label: 'All Issues', icon: '📑' }] : []),
    { id: 'lost-found', label: 'Lost & Found', icon: '🔍' },
    { id: 'announcements', label: 'Announcements', icon: '📢' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  const handleReportIssue = async (formData) => {
    console.log('🎯 handleReportIssue called with formData:', {
      keys: Object.keys(formData),
      images: formData.images,
      images_type: typeof formData.images,
      images_is_array: Array.isArray(formData.images),
      images_length: formData.images?.length || 0,
    });

    // Check if images are uploaded
    if (!formData.images || formData.images.length === 0) {
      alert('📷 Please take at least one photo of the issue before reporting.');
      return;
    }

    // Check if location is provided
    if (!formData.locationText || formData.locationText.trim() === '') {
      alert('📍 Please provide the location details where the issue is located.');
      return;
    }

    // Check if GPS location is available
    if (!formData.gpsLocation) {
      alert('🗺️ GPS location is required. Please enable location services and try again.');
      return;
    }

    setIsSubmittingIssue(true);

    try {
      // Simply use images as-is without strict validation
      const imagesToUse = Array.isArray(formData.images) ? formData.images : [];
      
      console.log('✅ Using images:', {
        count: imagesToUse.length,
        details: imagesToUse.map((img, i) => ({
          index: i,
          type: typeof img,
          keys: img ? Object.keys(img).slice(0, 10) : 'null',
          name: img?.name || 'unknown',
          size: img?.size || 'unknown',
        }))
      });

      if (imagesToUse.length === 0) {
        throw new Error('No images captured. Please take photos and try again.');
      }

      const newIssueData = {
        title: `${formData.category} - ${formData.description.substring(0, 30)}`,
        user_id: user.id,
        category: formData.category,
        priority: formData.priority,
        description: formData.description,
        location: formData.locationText,
        location_text: formData.locationText,
        gps_coordinates: formData.gpsLocation,
        visibility: formData.visibility,
        reported_by: user.id,
        hostel: user.hostel,
        block: user.block,
        room_no: user.roomNo,
        status: 'Reported',
        images: imagesToUse, // Pass images as captured
        created_at: new Date().toISOString(),
      };

      console.log('📝 Submitting issue with:', {
        category: newIssueData.category,
        imageCount: imagesToUse.length,
        hasLocation: !!newIssueData.gps_coordinates,
      });

      // Create issue with images
      const result = await supabaseIssues.createIssue(newIssueData);

      if (result.success) {
        // Show success notification
        const successMsg = `✅ Your issue "${formData.description}" has been reported successfully!`;
        setSuccessMessage(successMsg);
        
        addNotification({
          message: successMsg,
        });

        // Store the issue data for the success modal
        setSuccessIssueData(formData);

        // Close the report modal
        setShowReportModal(false);

        // Show success modal
        setShowSuccessModal(true);

        // Reload issues with a small delay to ensure database has been updated
        console.log('⏳ Waiting 500ms before refreshing issues...');
        setTimeout(async () => {
          console.log('🔄 Refreshing issues after submission...');
          await loadAllIssues();
          console.log('✅ Issues refreshed');
        }, 500);
      } else {
        const errorMsg = result.error || 'Unknown error';
        console.error('❌ Issue creation failed:', errorMsg);
        alert(`❌ Error reporting issue: ${errorMsg}`);
      }
    } catch (error) {
      console.error('❌ Error reporting issue:', error);
      alert(`❌ ${error.message || 'Error reporting issue. Please try again.'}`);
    } finally {
      setIsSubmittingIssue(false);
    }
  };

  const reportIssueFields = [
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      options: issueCategories,
      required: true,
    },
    {
      name: 'priority',
      label: 'Priority',
      type: 'select',
      options: priorities,
      required: true,
    },
    {
      name: 'description',
      label: 'Problem Description',
      type: 'textarea',
      placeholder: 'Describe the issue in detail...',
      required: true,
    },
    {
      name: 'locationText',
      label: '📍 Location (Text Description)',
      type: 'textarea',
      placeholder: 'e.g., Second floor corridor near Room 201, West Wing...',
      required: true,
      helpText: 'Provide specific location details of the issue',
    },
    {
      name: 'gpsLocation',
      label: '🗺️ GPS Location',
      type: 'location',
      required: true,
      helpText: 'Click to get your exact GPS coordinates (required)',
    },
    {
      name: 'visibility',
      label: 'Visibility',
      type: 'select',
      options: ['Public', 'Private'],
      required: true,
    },
    {
      name: 'images',
      label: '📷 Issue Photos (Camera Only)',
      type: 'camera',
      required: true,
      maxImages: 5,
      cameraOnly: true,
    },
  ];

  // Handle status update for management/caretakers
  const handleStatusUpdate = async (issueId, newStatus) => {
    try {
      const result = await supabaseIssues.updateIssueStatus(issueId, newStatus);
      if (result.success) {
        addNotification({
          message: `✅ Issue status updated to "${newStatus}"`,
        });
        await loadAllIssues();
      } else {
        alert(`❌ Error updating status: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert(`❌ Error updating status: ${error.message}`);
    }
  };

  return (
    <div className="dashboard">
      <Navigation />
      {onGoBack && (
        <button className="dashboard-back-btn" onClick={onGoBack} title="Go back to homepage">
          ← Back to Home
        </button>
      )}
      <div className="dashboard-container">
        <Sidebar items={sidebarItems} active={activeTab} onSelect={setActiveTab} />
        <main className="dashboard-content">
          {activeTab === 'dashboard' && (
            <div className="dashboard-main">
              <div className="greeting-section">
                <h1>Welcome, {user?.name}!</h1>
                <p>FixIt Hostel Issue Tracking System</p>
              </div>

              <div className="stats-grid">
                <Card title="Total Issues Reported">
                  <div className="stat-number">{studentIssues.length}</div>
                </Card>
                <Card title="Resolved Issues">
                  <div className="stat-number">
                    {studentIssues.filter((i) => i.status === 'Resolved').length}
                  </div>
                </Card>
                <Card title="Pending Issues">
                  <div className="stat-number">
                    {studentIssues.filter((i) => ['Reported', 'Assigned', 'In Progress'].includes(i.status)).length}
                  </div>
                </Card>
              </div>

              <div className="action-section">
                <button className="primary-btn" onClick={() => setShowReportModal(true)}>
                  + Report New Issue
                </button>
              </div>

              <Card title="Recent Issues">
                {studentIssues.length > 0 ? (
                  <div className="issues-list">
                    {studentIssues.slice(0, 3).map((issue) => (
                      <IssueCard key={issue.id} issue={issue} />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state-content">
                    <div className="empty-icon">📝</div>
                    <p className="empty-title">No Issues Yet</p>
                    <p className="empty-subtitle">You haven't reported any issues yet. Start by reporting a new issue to get support from our caretakers.</p>
                  </div>
                )}
              </Card>

              <ReportedItemsDisplay type="issues" />
            </div>
          )}

          {activeTab === 'issues' && (
            <div className="issues-section">
              <h2>My Issues</h2>
              {studentIssues.length > 0 ? (
                <div className="issues-list">
                  {studentIssues.map((issue) => (
                    <div key={issue.id} className="issue-card-wrapper">
                      <IssueCard issue={issue} />
                      {(user?.role === 'management' || user?.role === 'caretaker') && (
                        <div className="status-controls">
                          <button className="status-btn in-progress" onClick={() => handleStatusUpdate(issue.id, 'In Progress')}>
                            In Progress
                          </button>
                          <button className="status-btn resolved" onClick={() => handleStatusUpdate(issue.id, 'Resolved')}>
                            Resolved
                          </button>
                          <button className="status-btn closed" onClick={() => handleStatusUpdate(issue.id, 'Closed')}>
                            Closed
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Card>
                  <div className="empty-state-content">
                    <div className="empty-icon">🗂️</div>
                    <p className="empty-title">No Issues Found</p>
                    <p className="empty-subtitle">Start by reporting a new issue when you encounter any problems.</p>
                    <button className="primary-btn" style={{ marginTop: '1rem' }} onClick={() => setShowReportModal(true)}>
                      Report Your First Issue
                    </button>
                  </div>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'all-issues' && (user?.role === 'management' || user?.role === 'caretaker') && (
            <div className="issues-section">
              <h2>All Issues {`(${visibleIssues.length})`}</h2>
              <div className="issues-filters">
                <p className="issues-info">📋 Showing all public and private issues in the hostel</p>
              </div>
              {visibleIssues.length > 0 ? (
                <div className="issues-list">
                  {visibleIssues.map((issue) => (
                    <div key={issue.id} className="issue-card-wrapper">
                      <IssueCard issue={issue} />
                      <div className="status-controls">
                        <button className="status-btn in-progress" onClick={() => handleStatusUpdate(issue.id, 'In Progress')}>
                          In Progress
                        </button>
                        <button className="status-btn resolved" onClick={() => handleStatusUpdate(issue.id, 'Resolved')}>
                          Resolved
                        </button>
                        <button className="status-btn closed" onClick={() => handleStatusUpdate(issue.id, 'Closed')}>
                          Closed
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Card>
                  <div className="empty-state-content">
                    <div className="empty-icon">✨</div>
                    <p className="empty-title">No Issues</p>
                    <p className="empty-subtitle">All issues have been resolved!</p>
                  </div>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'lost-found' && (
            <div className="lost-found-section">
              <h2>🔍 Lost & Found</h2>
              <button className="primary-btn" onClick={() => setShowLostFoundModal(true)}>
                + Post Lost/Found Item
              </button>
              {loadingItems ? (
                <Card>
                  <div className="loading-state">⏳ Loading items...</div>
                </Card>
              ) : lostFoundItems.length > 0 ? (
                <div className="lost-found-items">
                  {lostFoundItems.map((item) => {
                    const itemType = item.type || item.item_type || 'unknown';
                    const itemTitle = item.title || item.item_name || 'Untitled';
                    const itemCategory = item.category || 'Unknown';
                    const itemDescription = item.description || 'No description';
                    const itemLocation = item.location || 'Location not specified';
                    const itemDate = item.dateReported || item.created_at || 'Unknown date';
                    const itemStatus = item.status || 'Open';
                    const itemImages = item.images || item.lost_found_images || [];
                    
                    console.log('🎯 Rendering lost & found item:', {
                      id: item.id,
                      title: itemTitle,
                      images: itemImages,
                      imageCount: itemImages.length,
                      imageTypes: itemImages.map(img => typeof img),
                    });
                    
                    return (
                      <Card 
                        key={item.id} 
                        title={`${itemType === 'lost' ? '❌ Lost' : '✅ Found'} - ${itemTitle}`}
                      >
                        <div className="lost-found-item-content">
                          <div className="item-details">
                            <p><strong>Type:</strong> {itemType === 'lost' ? 'Lost Item' : 'Found Item'}</p>
                            <p><strong>Category:</strong> {itemCategory}</p>
                            <p><strong>Description:</strong> {itemDescription}</p>
                            <p><strong>Location:</strong> {itemLocation}</p>
                            <p><strong>Date Reported:</strong> {new Date(itemDate).toLocaleDateString()}</p>
                            <p><strong>Status:</strong> <span className="status-badge">{itemStatus}</span></p>
                          </div>
                          
                          {itemImages && itemImages.length > 0 && (
                            <div className="item-images-container">
                              <h4>📸 Images ({itemImages.length}):</h4>
                              <div className="item-images">
                                {itemImages.map((img, idx) => {
                                  console.log(`📷 Image ${idx}:`, img);
                                  return img ? (
                                    <div key={idx} className="image-wrapper">
                                      <img 
                                        src={img} 
                                        alt={`${itemTitle} ${idx + 1}`} 
                                        className="item-thumbnail"
                                        onError={(e) => {
                                          console.warn('❌ Image failed to load:', img);
                                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999" font-size="14"%3EImage not available%3C/text%3E%3C/svg%3E';
                                        }}
                                        onLoad={() => {
                                          console.log('✅ Image loaded successfully:', img);
                                        }}
                                      />
                                    </div>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <div className="empty-state-content">
                    <div className="empty-icon">🔍</div>
                    <p className="empty-title">No Lost & Found Items</p>
                    <p className="empty-subtitle">No items have been posted yet. Be the first to post!</p>
                    <button className="primary-btn" style={{ marginTop: '1rem' }} onClick={() => setShowLostFoundModal(true)}>
                      Post Your First Item
                    </button>
                  </div>
                </Card>
              )}

              <ReportedItemsDisplay type="lostfound" />
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="announcements-section">
              <h2>📢 Announcements</h2>
              <AnnouncementList
                isManagement={false}
                user={user}
              />
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="profile-section">
              <h2>Profile Information</h2>
              <Card>
                <div className="profile-info">
                  <div className="info-row">
                    <label>Name:</label>
                    <span>{user?.name}</span>
                  </div>
                  <div className="info-row">
                    <label>Email:</label>
                    <span>{user?.email}</span>
                  </div>
                  <div className="info-row">
                    <label>Department:</label>
                    <span>{user?.department}</span>
                  </div>
                  <div className="info-row">
                    <label>Hostel:</label>
                    <span>{user?.hostel}</span>
                  </div>
                  <div className="info-row">
                    <label>Room:</label>
                    <span>{user?.roomNo}</span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>

      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Report New Issue"
      >
        <Form
          fields={reportIssueFields}
          onSubmit={handleReportIssue}
          submitText="Report Issue"
          title=""
          isSubmitting={isSubmittingIssue}
        />
      </Modal>

      <Modal
        isOpen={showLostFoundModal}
        onClose={() => setShowLostFoundModal(false)}
        title="Post Lost or Found Item"
      >
        <LostFoundForm
          onSubmit={() => {
            setShowLostFoundModal(false);
            // Refresh lost & found items after posting
            setTimeout(() => {
              refreshLostFoundItems();
            }, 500);
          }}
          onCancel={() => setShowLostFoundModal(false)}
          currentUser={user}
        />
      </Modal>

      <ReportSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        issueData={successIssueData}
      />
    </div>
  );
};

export default StudentDashboard;
