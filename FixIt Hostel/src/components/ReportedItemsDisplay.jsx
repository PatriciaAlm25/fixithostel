import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import '../styles/ReportedItemsDisplay.css';

const ReportedItemsDisplay = ({ type = 'issues' }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedItem, setExpandedItem] = useState(null);

  useEffect(() => {
    loadItems();
  }, [type]);

  const loadItems = async () => {
    try {
      setLoading(true);
      setError('');

      if (type === 'issues') {
        const { data, error: err } = await supabase
          .from('issues')
          .select('*')
          .order('created_at', { ascending: false });

        if (err) throw err;

        // Parse images for each issue
        const itemsWithImages = await Promise.all(
          (data || []).map(async (issue) => {
            const images = await fetchIssueImages(issue.id);
            return {
              ...issue,
              images,
              displayImages: images || [],
            };
          })
        );

        setItems(itemsWithImages);
      } else if (type === 'lostfound') {
        const { data, error: err } = await supabase
          .from('lost_found_items')
          .select('*')
          .order('created_at', { ascending: false });

        if (err) throw err;

        // Fetch images for each lost & found item
        const itemsWithImages = await Promise.all(
          (data || []).map(async (item) => {
            const images = await fetchLostFoundImages(item.id);
            return {
              ...item,
              images,
              displayImages: images || [],
            };
          })
        );

        setItems(itemsWithImages);
      }
    } catch (err) {
      console.error('Error loading items:', err);
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const fetchIssueImages = async (issueId) => {
    try {
      const { data, error } = await supabase
        .from('issue_images')
        .select('image_url')
        .eq('issue_id', issueId);

      if (error) throw error;
      return data ? data.map((img) => img.image_url).filter(Boolean) : [];
    } catch (err) {
      console.warn('Error fetching issue images:', err);
      return [];
    }
  };

  const fetchLostFoundImages = async (itemId) => {
    try {
      const { data, error } = await supabase
        .from('lost_found_images')
        .select('image_url')
        .eq('item_id', itemId);

      if (error) throw error;
      return data ? data.map((img) => img.image_url).filter(Boolean) : [];
    } catch (err) {
      console.warn('Error fetching lost & found images:', err);
      return [];
    }
  };

  const getPublicImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;

    // Try to construct Supabase public URL
    const bucket = type === 'issues' ? 'issue-images' : 'lost-found-images';
    return `${supabase.storageUrl}/object/public/${bucket}/${imagePath}`;
  };

  if (loading) {
    return <div className="reported-items-container loading">Loading items...</div>;
  }

  if (error) {
    return <div className="reported-items-container error">{error}</div>;
  }

  if (!items || items.length === 0) {
    return <div className="reported-items-container empty">No {type === 'issues' ? 'issues' : 'lost & found items'} reported yet</div>;
  }

  return (
    <div className="reported-items-container">
      <h3 className="reported-items-title">
        {type === 'issues' ? '📋 Reported Issues' : '📦 Lost & Found Items'}
      </h3>
      <div className="reported-items-grid">
        {items.map((item) => (
          <div
            key={item.id}
            className={`reported-item-card ${expandedItem === item.id ? 'expanded' : ''}`}
            onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
          >
            {/* Title Section */}
            <div className="item-title-section">
              <h4 className="item-title">
                {type === 'issues' ? item.title || item.description?.substring(0, 50) : item.item_name || 'Unnamed Item'}
              </h4>
              {type === 'lostfound' && item.item_type && (
                <span className={`item-type-badge ${item.item_type.toLowerCase()}`}>
                  {item.item_type.charAt(0).toUpperCase() + item.item_type.slice(1)}
                </span>
              )}
            </div>

            {/* Details Section */}
            <div className="item-details">
              {type === 'issues' ? (
                <>
                  {item.description && (
                    <p className="item-description">{item.description}</p>
                  )}
                  {item.category && <p className="item-meta">📌 Category: {item.category}</p>}
                  {item.priority && <p className="item-meta">⚠️ Priority: {item.priority}</p>}
                  {item.status && <p className="item-meta">✓ Status: {item.status}</p>}
                  {item.location && <p className="item-meta">📍 Location: {item.location}</p>}
                </>
              ) : (
                <>
                  {item.description && (
                    <p className="item-description">{item.description}</p>
                  )}
                  {item.category && <p className="item-meta">🏷️ Category: {item.category}</p>}
                  {item.location && <p className="item-meta">📍 Location: {item.location}</p>}
                  {item.hostel && <p className="item-meta">🏢 Hostel: {item.hostel}</p>}
                  {item.status && <p className="item-meta">✓ Status: {item.status}</p>}
                </>
              )}
            </div>

            {/* Images Section */}
            {item.displayImages && item.displayImages.length > 0 && (
              <div className="item-images-section">
                <p className="images-count">📸 {item.displayImages.length} image(s)</p>
                <div className="item-images-grid">
                  {item.displayImages.map((imageUrl, idx) => (
                    <div key={idx} className="image-container">
                      <img
                        src={imageUrl}
                        alt={`${type === 'issues' ? 'Issue' : 'Item'} ${idx + 1}`}
                        className="item-image"
                        onError={(e) => {
                          console.warn('Image load error:', imageUrl);
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="Arial" font-size="14"%3EImage not available%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamp */}
            {item.created_at && (
              <div className="item-timestamp">
                📅 {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportedItemsDisplay;
