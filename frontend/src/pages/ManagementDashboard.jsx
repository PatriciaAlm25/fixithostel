import React, { useState, useEffect } from 'react';
import { useAuth, useIssues } from '../hooks/useCustom';
import Navigation from '../components/Navigation';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import IssueCard from '../components/IssueCard';
import Modal from '../components/Modal';
import Form from '../components/Form';
import AnnouncementForm from '../components/AnnouncementForm';
import AnnouncementList from '../components/AnnouncementList';
import IssueManagementSection from '../components/IssueManagementSection';
import ReportedItemsDisplay from '../components/ReportedItemsDisplay';
import { hostels, blocks, statuses } from '../services/mockData';
import { analyticsService } from '../services/apiService';
import * as supabaseIssues from '../services/supabaseIssues';
import * as supabaseLostFound from '../services/supabaseLostFound';
import * as supabaseManagement from '../services/supabaseManagement';
import '../styles/Dashboard.css';
import '../styles/ManagementDashboard.css';

const ManagementDashboard = ({ onGoBack }) => {
  const { user, updateUserProfile } = useAuth();
  const { issues, setIssues, updateIssueStatus, assignIssue, addNotification } =
    useIssues();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [analytics, setAnalytics] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);
  const [isLoadingLostFound, setIsLoadingLostFound] = useState(false);
  const [lostFoundItems, setLostFoundItems] = useState([]);
  const [announcementRefreshKey, setAnnouncementRefreshKey] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    hostel: '',
  });

  // Lost & found status update states
  const [selectedLostItem, setSelectedLostItem] = useState(null);
  const [showLostFoundStatusModal, setShowLostFoundStatusModal] = useState(false);
  const [lostFoundStatusUpdate, setLostFoundStatusUpdate] = useState('');
  const [updatingLostFound, setUpdatingLostFound] = useState(false);

  // Announcement form state
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);

  // Load all issues from Supabase (real-time)
  useEffect(() => {
    setIsLoadingIssues(true);
    
    // First load all issues
    const loadIssues = async () => {
      try {
        const result = await supabaseIssues.getAllIssues();
        if (result.success) {
          setIssues(result.issues || []);
        }
      } catch (error) {
        console.error('Error loading issues:', error);
      } finally {
        setIsLoadingIssues(false);
      }
    };

    loadIssues();

    // Then subscribe to real-time updates
    try {
      const subscription = supabaseIssues.subscribeToIssues(() => {
        // Reload all issues when changes occur
        loadIssues();
      });

      return () => {
        if (subscription && subscription.unsubscribe) {
          subscription.unsubscribe();
        }
      };
    } catch (error) {
      console.error('Error subscribing to issues:', error);
      setIsLoadingIssues(false);
    }
  }, [setIssues]);

  // Subscribe to lost & found items
  useEffect(() => {
    setIsLoadingLostFound(true);
    // Initial fetch
    const fetchItems = async () => {
      const result = await supabaseLostFound.getAllLostFoundItems();
      if (result.success) {
        setLostFoundItems(result.items || []);
      }
      setIsLoadingLostFound(false);
    };
    fetchItems();

    // Subscribe to real-time updates
    let subscription;
    try {
      const setupSubscription = async () => {
        subscription = await supabaseLostFound.subscribeToLostFound(() => {
          fetchItems();
        });
      };
      setupSubscription();
      return () => {
        if (subscription && subscription.unsubscribe) subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Error subscribing to lost & found items:', error);
      setIsLoadingLostFound(false);
    }
  }, []);

  useEffect(() => {
    // Calculate analytics from actual issues
    analyticsService.getAnalytics(issues).then(setAnalytics);
  }, [issues]);

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'issues', label: 'All Issues', icon: '📋' },
    { id: 'lost-found', label: 'Lost & Found', icon: '🔍' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'announcements', label: 'Announcements', icon: '📢' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  const filteredIssues = issues.filter((issue) => {
    if (filters.status && issue.status !== filters.status) return false;
    if (filters.priority && issue.priority !== filters.priority) return false;
    if (filters.hostel && issue.hostel !== filters.hostel) return false;
    return true;
  });

  const handleAssignIssue = (formData) => {
    if (selectedIssue) {
      assignIssue(selectedIssue.id, formData.caretakerId);
      addNotification({
        message: `Issue has been assigned successfully.`,
      });
      setShowAssignModal(false);
      setSelectedIssue(null);
    }
  };

  const assignFields = [
    {
      name: 'caretakerId',
      label: 'Assign to Caretaker',
      type: 'select',
      options: ['Caretaker A', 'Caretaker B', 'Caretaker C', 'Caretaker D'],
      required: true,
    },
    {
      name: 'remarks',
      label: 'Internal Remarks',
      type: 'textarea',
      placeholder: 'Add any internal notes...',
    },
  ];

  const handleStatusUpdate = async (issueId, newStatus) => {
    try {
      const result = await supabaseIssues.updateIssueStatus(issueId, newStatus);
      if (result.success) {
        setIssues(
          issues.map((issue) =>
            issue.id === issueId ? { ...issue, status: newStatus } : issue
          )
        );
        addNotification({
          message: `✅ Issue status updated to ${newStatus}`,
        });
      }
    } catch (error) {
      addNotification({
        message: `Error updating status: ${error.message}`,
      });
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
              <h1>Management Dashboard</h1>
              <div className="stats-grid">
                <Card title="Total Issues">
                  <div className="stat-number">{analytics?.totalIssues || 0}</div>
                </Card>
                <Card title="Resolved">
                  <div className="stat-number">{analytics?.resolvedIssues || 0}</div>
                </Card>
                <Card title="Pending">
                  <div className="stat-number">{analytics?.pendingIssues || 0}</div>
                </Card>
                <Card title="Emergency">
                  <div className="stat-number">{analytics?.emergencyIssues || 0}</div>
                </Card>
              </div>

              <div className="two-col-grid">
                <Card title="Issues by Category">
                  {analytics?.issuesByCategory && (
                    <div className="category-list">
                      {Object.entries(analytics.issuesByCategory).map(
                        ([category, count]) => (
                          <div key={category} className="category-item">
                            <span>{category}</span>
                            <span className="count">{count}</span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </Card>
                <Card title="Hostel-wise Issues">
                  {analytics?.hostelWiseIssues && (
                    <div className="hostel-list">
                      {Object.entries(analytics.hostelWiseIssues).map(
                        ([hostel, count]) => (
                          <div key={hostel} className="hostel-item">
                            <span>{hostel}</span>
                            <span className="count">{count}</span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'issues' && (
            <div className="issues-section">
              <h2>📋 All Issues - Management Control</h2>
              <IssueManagementSection
                issues={issues}
                onStatusChange={(issueId, newStatus) => {
                  handleStatusUpdate(issueId, newStatus);
                }}
                onAssign={async (issueId, caretakerId) => {
                  try {
                    const result = await supabaseIssues.assignIssueToCaretaker(issueId, caretakerId);
                    if (result.success) {
                      setIssues(
                        issues.map((issue) =>
                          issue.id === issueId
                            ? { ...issue, assigned_to: caretakerId }
                            : issue
                        )
                      );
                      addNotification({
                        message: `✅ Issue assigned successfully`,
                      });
                    }
                  } catch (error) {
                    addNotification({
                      message: `Error assigning issue: ${error.message}`,
                    });
                  }
                }}
              />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="analytics-section">
              <h2>Analytics & Reports</h2>
              {analytics && (
                <div className="analytics-grid">
                  <Card title="Average Resolution Time">
                    <div className="stat-big">{analytics.avgResolutionTime}</div>
                  </Card>
                  <Card title="Success Rate">
                    <div className="stat-big">
                      {(
                        (analytics.resolvedIssues / analytics.totalIssues) *
                        100
                      ).toFixed(1)}
                      %
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}

          {activeTab === 'lost-found' && (
            <div className="lost-found-management-section">
              <h2>🔍 Lost & Found Management</h2>
              <div className="items-controls">
                <button 
                  className="secondary-btn" 
                  onClick={async () => {
                    setIsLoadingLostFound(true);
                    const result = await supabaseLostFound.getAllLostFoundItems();
                    if (result.success) {
                      setLostFoundItems(result.items || []);
                    }
                    setIsLoadingLostFound(false);
                  }}
                >
                  🔄 Refresh Items
                </button>
              </div>
              
              {isLoadingLostFound ? (
                <Card>
                  <div className="loading-state">⏳ Loading items...</div>
                </Card>
              ) : lostFoundItems.length > 0 ? (
                <div className="lost-found-management-list">
                  {lostFoundItems.map((item) => (
                    <Card key={item.id} className="item-management-card">
                      <div className="item-header">
                        <h3>{item.item_name || 'Unknown Item'}</h3>
                        <span className={`item-type-badge ${(item.item_type || 'lost').toLowerCase()}`}>
                          {item.item_type === 'lost' ? '❌ LOST' : '✅ FOUND'}
                        </span>
                        <span className={`status-badge status-${(item.status || 'open').toLowerCase().replace(' ', '_')}`}>
                          {item.status || 'Open'}
                        </span>
                      </div>

                      <div className="item-details">
                        <p><strong>Category:</strong> {item.category || 'N/A'}</p>
                        <p><strong>Description:</strong> {item.description}</p>
                        <p><strong>Location:</strong> {item.location || 'N/A'}</p>
                        <p><strong>Hostel/Block:</strong> {item.hostel || 'N/A'} {item.block ? `/ Block ${item.block}` : ''}</p>
                        <p><strong>Posted:</strong> {new Date(item.created_at).toLocaleDateString()}</p>
                      </div>

                      <div className="item-management-actions">
                        <div className="action-group">
                          <label>Update Status:</label>
                          <select
                            value={item.status || ''}
                            onChange={(e) => {
                              setSelectedLostItem(item);
                              setLostFoundStatusUpdate(e.target.value);
                              setShowLostFoundStatusModal(true);
                            }}
                            className="status-select"
                          >
                            <option value="">Select Status</option>
                            <option value="Open">Open - Still Searching</option>
                            <option value="Found">✅ Found</option>
                            <option value="Not Found">❌ Not Found</option>
                            <option value="Claimed">Claimed</option>
                            <option value="Returned">Returned</option>
                          </select>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <div className="empty-state">
                    <p>No lost & found items yet</p>
                  </div>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="announcements-management-section">
              <h2>📢 Announcements</h2>
              <div className="announcements-controls">
                <button className="primary-btn" onClick={() => setShowAnnouncementForm(true)}>
                  + Create New Announcement
                </button>
              </div>

              {showAnnouncementForm && (
                <Card title="Create Announcement">
                  <AnnouncementForm
                    user={user}
                    onSuccess={() => {
                      setShowAnnouncementForm(false);
                      setAnnouncementRefreshKey((prev) => prev + 1);
                    }}
                    onError={(error) => {
                      addNotification({
                        message: `Error creating announcement: ${error.message}`,
                      });
                    }}
                  />
                </Card>
              )}

              <AnnouncementList
                key={announcementRefreshKey}
                showForm={false}
                user={user}
                isManagement={true}
              />
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="profile-section">
              <h2>Profile</h2>
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
                    <label>Role:</label>
                    <span>{user?.role}</span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>

      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedIssue(null);
        }}
        title="Assign Issue"
      >
        <Form
          fields={assignFields}
          onSubmit={handleAssignIssue}
          submitText="Assign"
          title=""
        />
      </Modal>

      <Modal
        isOpen={showLostFoundStatusModal}
        onClose={() => {
          setShowLostFoundStatusModal(false);
          setSelectedLostItem(null);
          setLostFoundStatusUpdate('');
        }}
        title="Update Lost & Found Item Status"
      >
        <div className="status-update-modal-content">
          {selectedLostItem && (
            <>
              <div className="item-info">
                <strong>Item:</strong> {selectedLostItem.item_name || 'Unknown Item'}
              </div>
              <div className="current-status">
                <strong>Current Status:</strong> {selectedLostItem.status || 'Open'}
              </div>
              <div className="form-group">
                <label>New Status:</label>
                <select
                  value={lostFoundStatusUpdate}
                  onChange={(e) => setLostFoundStatusUpdate(e.target.value)}
                  className="form-select"
                >
                  <option value="">-- Select Status --</option>
                  <option value="Open">Open - Still Searching</option>
                  <option value="Found">✅ Found</option>
                  <option value="Not Found">❌ Not Found</option>
                  <option value="Claimed">Claimed</option>
                  <option value="Returned">Returned</option>
                </select>
              </div>
              <div className="modal-actions">
                <button
                  className="primary-btn"
                  onClick={async () => {
                    if (!lostFoundStatusUpdate) {
                      alert('Please select a status');
                      return;
                    }
                    
                    setUpdatingLostFound(true);
                    try {
                      const result = await supabaseLostFound.updateItemStatus(
                        selectedLostItem.id,
                        lostFoundStatusUpdate
                      );
                      if (result.success) {
                        addNotification({
                          message: `✅ Item status updated to "${lostFoundStatusUpdate}"`,
                        });
                        const updatedItems = lostFoundItems.map(i =>
                          i.id === selectedLostItem.id ? { ...i, status: lostFoundStatusUpdate } : i
                        );
                        setLostFoundItems(updatedItems);
                        setShowLostFoundStatusModal(false);
                        setSelectedLostItem(null);
                        setLostFoundStatusUpdate('');
                      } else {
                        alert(`Error: ${result.error || 'Unknown error'}`);
                      }
                    } catch (error) {
                      console.error('Error updating status:', error);
                      alert(`Error: ${error.message}`);
                    } finally {
                      setUpdatingLostFound(false);
                    }
                  }}
                  disabled={updatingLostFound || !lostFoundStatusUpdate}
                >
                  {updatingLostFound ? '⏳ Updating...' : '✓ Update Status'}
                </button>
                <button
                  className="secondary-btn"
                  onClick={() => {
                    setShowLostFoundStatusModal(false);
                    setSelectedLostItem(null);
                    setLostFoundStatusUpdate('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ManagementDashboard;
