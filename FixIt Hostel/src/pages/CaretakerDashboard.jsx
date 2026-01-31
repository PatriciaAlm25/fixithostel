import React, { useState, useEffect } from 'react';
import { useAuth, useIssues } from '../hooks/useCustom';
import Navigation from '../components/Navigation';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import IssueCard from '../components/IssueCard';
import Modal from '../components/Modal';
import Form from '../components/Form';
import AnnouncementList from '../components/AnnouncementList';
import { statuses } from '../services/mockData';
import * as supabaseIssues from '../services/supabaseIssues';
import * as supabaseLostFound from '../services/supabaseLostFound';
import '../styles/Dashboard.css';

const CaretakerDashboard = ({ onGoBack }) => {
  const { user } = useAuth();
  const { issues, setIssues, updateIssueStatus, addNotification } = useIssues();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [assignedIssues, setAssignedIssues] = useState([]);
  const [allIssues, setAllIssues] = useState([]);
  const [lostFoundItems, setLostFoundItems] = useState([]);
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLostFound, setIsLoadingLostFound] = useState(false);
  const [announcementRefreshKey, setAnnouncementRefreshKey] = useState(0);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Subscribe to assigned issues from Supabase
  useEffect(() => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const loadAssignedIssues = async () => {
        const result = await supabaseIssues.getAllIssues();
        if (result.success) {
          const assigned = result.issues.filter((issue) => issue.assigned_to === user.id);
          setAssignedIssues(assigned);
        }
        setIsLoading(false);
      };

      loadAssignedIssues();
    } catch (error) {
      console.error('Error loading assigned issues:', error);
      setIsLoading(false);
    }
  }, [user?.id]);

  // Load all issues for Reports tab
  useEffect(() => {
    if (activeTab === 'reports') {
      setIsLoading(true);
      const loadAllIssues = async () => {
        const result = await supabaseIssues.getAllIssues();
        if (result.success) {
          setAllIssues(result.issues || []);
        }
        setIsLoading(false);
      };
      loadAllIssues();
    }
  }, [activeTab]);

  // Load lost & found items
  useEffect(() => {
    if (activeTab === 'lost-found') {
      setIsLoadingLostFound(true);
      const loadLostFound = async () => {
        const result = await supabaseLostFound.getAllLostFoundItems();
        if (result.success) {
          setLostFoundItems(result.items || []);
        }
        setIsLoadingLostFound(false);
      };
      loadLostFound();
    }
  }, [activeTab]);

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'reports', label: 'Reports', icon: '📋' },
    { id: 'announcements', label: 'Announcements', icon: '📢' },
    { id: 'lost-found', label: 'Lost & Found', icon: '🔍' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  const handleAddRemark = async (formData) => {
    if (selectedIssue) {
      setUpdatingStatus(true);
      try {
        const result = await supabaseIssues.updateIssueStatus(
          selectedIssue.id,
          formData.status,
          formData.remarks
        );

        if (result.success) {
          addNotification({
            message: `Issue status updated to ${formData.status}`,
          });

          // Update local state
          setAssignedIssues(
            assignedIssues.map((issue) =>
              issue.id === selectedIssue.id
                ? { ...issue, status: formData.status }
                : issue
            )
          );
          setAllIssues(
            allIssues.map((issue) =>
              issue.id === selectedIssue.id
                ? { ...issue, status: formData.status }
                : issue
            )
          );

          setShowRemarkModal(false);
          setSelectedIssue(null);
        }
      } catch (error) {
        addNotification({
          message: `Error updating status: ${error.message}`,
        });
      } finally {
        setUpdatingStatus(false);
      }
    }
  };

  const remarkFields = [
    {
      name: 'status',
      label: 'Work Status',
      type: 'select',
      options: ['Assigned', 'In Progress', 'Done'],
      required: true,
    },
    {
      name: 'remarks',
      label: 'Status Update/Details',
      type: 'textarea',
      placeholder: 'Describe the current status or work done...',
      required: true,
    },
  ];

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
                <p>Caretaker Dashboard</p>
              </div>

              <div className="stats-grid">
                <Card title="Assigned Issues">
                  <div className="stat-number">{assignedIssues.length}</div>
                </Card>
                <Card title="Completed">
                  <div className="stat-number">
                    {assignedIssues.filter((i) => i.status === 'Resolved').length}
                  </div>
                </Card>
                <Card title="In Progress">
                  <div className="stat-number">
                    {assignedIssues.filter((i) => i.status === 'In Progress').length}
                  </div>
                </Card>
              </div>

              <Card title="Recent Assignments">
                {assignedIssues.length > 0 ? (
                  <div className="issues-list">
                    {assignedIssues.slice(0, 3).map((issue) => (
                      <IssueCard key={issue.id} issue={issue} />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state-content">
                    <div className="empty-icon">📭</div>
                    <p className="empty-title">No Assignments Yet</p>
                    <p className="empty-subtitle">Issues will be assigned to you here by management. Check back later!</p>
                  </div>
                )}
              </Card>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="reports-section">
              <h2>📋 Reports</h2>
              
              <div className="reports-container">
                {/* Assigned to Me Section */}
                <div className="reports-subsection">
                  <h3>👤 Assigned to Me</h3>
                  {isLoading ? (
                    <Card><div className="loading-state">⏳ Loading...</div></Card>
                  ) : assignedIssues.length > 0 ? (
                    <div className="issues-list">
                      {assignedIssues.map((issue) => (
                        <Card key={issue.id} className="issue-report-card">
                          <div className="report-item">
                            <div className="report-header">
                              <h4>{issue.title}</h4>
                              <span className={`status-badge status-${issue.status?.toLowerCase()}`}>
                                {issue.status}
                              </span>
                            </div>
                            <p><strong>Description:</strong> {issue.description}</p>
                            <p><strong>Location:</strong> {issue.location}</p>
                            <p><strong>Priority:</strong> {issue.priority}</p>
                            <button
                              className="update-btn"
                              onClick={() => {
                                setSelectedIssue(issue);
                                setShowRemarkModal(true);
                              }}
                            >
                              Update Status
                            </button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <div className="empty-state-content">
                        <div className="empty-icon">🎯</div>
                        <p>No issues assigned to you yet</p>
                      </div>
                    </Card>
                  )}
                </div>

                {/* All Reports Section */}
                <div className="reports-subsection">
                  <h3>📋 All Reports Available</h3>
                  {isLoading ? (
                    <Card><div className="loading-state">⏳ Loading...</div></Card>
                  ) : allIssues.length > 0 ? (
                    <div className="issues-list">
                      {allIssues.map((issue) => (
                        <Card key={issue.id} className="issue-report-card">
                          <div className="report-item">
                            <div className="report-header">
                              <h4>{issue.title}</h4>
                              <span className={`status-badge status-${issue.status?.toLowerCase()}`}>
                                {issue.status}
                              </span>
                            </div>
                            <p><strong>Description:</strong> {issue.description}</p>
                            <p><strong>Location:</strong> {issue.location}</p>
                            <p><strong>Priority:</strong> {issue.priority}</p>
                            <p><strong>Assigned to:</strong> {issue.assigned_to ? 'Caretaker' : 'Unassigned'}</p>
                            {issue.assigned_to !== user?.id && (
                              <button
                                className="volunteer-btn"
                                onClick={async () => {
                                  try {
                                    const result = await supabaseIssues.assignIssueToCaretaker(issue.id, user.id);
                                    if (result.success) {
                                      setAllIssues(
                                        allIssues.map((i) =>
                                          i.id === issue.id
                                            ? { ...i, assigned_to: user.id }
                                            : i
                                        )
                                      );
                                      setAssignedIssues([
                                        ...assignedIssues,
                                        { ...issue, assigned_to: user.id },
                                      ]);
                                      addNotification({
                                        message: `✅ Work assigned to you!`,
                                      });
                                    }
                                  } catch (error) {
                                    addNotification({
                                      message: `Error: ${error.message}`,
                                    });
                                  }
                                }}
                              >
                                ✋ Take This Work
                              </button>
                            )}
                            {issue.assigned_to === user?.id && (
                              <button
                                className="update-btn"
                                onClick={() => {
                                  setSelectedIssue(issue);
                                  setShowRemarkModal(true);
                                }}
                              >
                                Update Status
                              </button>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <div className="empty-state-content">
                        <div className="empty-icon">📭</div>
                        <p>No reports available</p>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="announcements-section">
              <h2>📢 Announcements</h2>
              <AnnouncementList
                key={announcementRefreshKey}
                showForm={false}
                user={user}
                isManagement={false}
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
                    <label>Specialization:</label>
                    <span>{user?.specialization}</span>
                  </div>
                  <div className="info-row">
                    <label>Assigned Hostel:</label>
                    <span>{user?.hostel}</span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'lost-found' && (
            <div className="lost-found-section">
              <h2>🔍 Lost & Found</h2>
              {isLoadingLostFound ? (
                <Card>
                  <div className="loading-state">⏳ Loading items...</div>
                </Card>
              ) : lostFoundItems.length > 0 ? (
                <div className="lost-found-items">
                  {lostFoundItems.map((item) => (
                    <Card key={item.id} className="lost-found-item-card">
                      <div className="lost-found-item-content">
                        <div className="item-header">
                          <h4>{item.item_name}</h4>
                          <span className={`status-badge status-${item.status?.toLowerCase()}`}>
                            {item.status}
                          </span>
                        </div>
                        <p><strong>Category:</strong> {item.item_type}</p>
                        <p><strong>Description:</strong> {item.description}</p>
                        <p><strong>Location:</strong> {item.location_found || item.location_lost}</p>
                        <p><strong>Posted by:</strong> {item.posted_by}</p>
                        {item.image_urls && item.image_urls.length > 0 && (
                          <div className="item-images">
                            {item.image_urls.map((img, idx) => (
                              <img key={idx} src={img} alt={`Item ${idx + 1}`} className="item-thumbnail" />
                            ))}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <div className="empty-state-content">
                    <div className="empty-icon">🔍</div>
                    <p className="empty-title">No Lost & Found Items</p>
                    <p className="empty-subtitle">No items have been posted yet.</p>
                  </div>
                </Card>
              )}
            </div>
          )}
        </main>
      </div>

      <Modal
        isOpen={showRemarkModal}
        onClose={() => {
          setShowRemarkModal(false);
          setSelectedIssue(null);
        }}
        title="Update Issue Progress"
      >
        <Form
          fields={remarkFields}
          onSubmit={handleAddRemark}
          submitText="Update"
          title=""
        />
      </Modal>
    </div>
  );
};

export default CaretakerDashboard;
