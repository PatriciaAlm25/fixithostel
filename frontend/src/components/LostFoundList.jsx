import React, { useState } from 'react';
import LostFoundCard from './LostFoundCard';

const LostFoundList = ({
  items,
  onClaim,
  onDetails,
  onDelete,
  userId,
  userRole,
}) => {
  const [filterType, setFilterType] = useState('all'); // all, lost, found
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, claimed, resolved
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = items.filter(item => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesType && matchesStatus && matchesSearch;
  });

  return (
    <div className="lost-found-list-container">
      <div className="list-header">
        <h2>Lost & Found Items</h2>
        <p className="item-count">Total Items: {filteredItems.length}</p>
      </div>

      <div className="list-filters">
        <div className="filter-group">
          <label htmlFor="searchInput">Search:</label>
          <input
            id="searchInput"
            type="text"
            placeholder="Search by item name, category..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="typeFilter">Type:</label>
          <select
            id="typeFilter"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Items</option>
            <option value="lost">Lost Items</option>
            <option value="found">Found Items</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="statusFilter">Status:</label>
          <select
            id="statusFilter"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="claimed">Claimed</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="empty-state">
          <p>📭 No items found</p>
          {filterType !== 'all' || filterStatus !== 'all' || searchTerm ? (
            <p className="empty-state-hint">Try adjusting your filters</p>
          ) : (
            <p className="empty-state-hint">Be the first to post a lost or found item</p>
          )}
        </div>
      ) : (
        <div className="lost-found-grid">
          {filteredItems.map(item => (
            <LostFoundCard
              key={item.id}
              item={item}
              onClaim={onClaim}
              onDetails={onDetails}
              onDelete={onDelete}
              isOwner={item.reportedBy === userId}
              userRole={userRole}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LostFoundList;
