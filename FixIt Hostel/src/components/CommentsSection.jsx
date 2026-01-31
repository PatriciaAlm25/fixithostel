import React, { useState, useEffect } from 'react';
import * as firebaseDataService from '../services/firebaseDataService';
import '../styles/CommentsSection.css';

const CommentsSection = ({ issueId, currentUser, isPublicIssue = true }) => {
  const [comments, setComments] = useState([]);
  const [reactions, setReactions] = useState({ like: [], agree: [], urgent: [] });
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState(new Set());

  // Subscribe to comments and reactions
  useEffect(() => {
    if (!isPublicIssue) return;

    const unsubscribeComments = firebaseDataService.subscribeToCommentsForIssue(issueId, setComments);
    const unsubscribeReactions = firebaseDataService.subscribeToReactionsForIssue(issueId, setReactions);

    return () => {
      unsubscribeComments();
      unsubscribeReactions();
    };
  }, [issueId, isPublicIssue]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await firebaseDataService.addComment(issueId, currentUser.id, newComment.trim());
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddReaction = async (reactionType) => {
    try {
      const reactionId = `${reactionType}_${currentUser.id}`;
      
      // Check if already reacted with this type
      if (reactions[reactionType]?.some(r => r.userId === currentUser.id)) {
        // Remove reaction
        await firebaseDataService.removeReaction(issueId, reactionId, 'issue');
      } else {
        // Add reaction
        await firebaseDataService.addReaction(issueId, currentUser.id, reactionType, issueId, 'issue');
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      await firebaseDataService.deleteComment(issueId, commentId, currentUser.id);
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    }
  };

  const userHasReacted = (reactionType) => {
    return reactions[reactionType]?.some(r => r.userId === currentUser.id) || false;
  };

  // Group comments by thread (parentCommentId)
  const mainComments = comments.filter(c => !c.parentCommentId);
  const getThreadReplies = (commentId) => comments.filter(c => c.parentCommentId === commentId);

  if (!isPublicIssue) {
    return (
      <div className="comments-section">
        <p className="private-notice">💬 Comments disabled for private issues</p>
      </div>
    );
  }

  return (
    <div className="comments-section">
      <h3 className="comments-title">💬 Community Interaction ({comments.length})</h3>

      {/* Reactions Bar */}
      <div className="reactions-bar">
        <button
          className={`reaction-btn ${userHasReacted('like') ? 'active' : ''}`}
          onClick={() => handleAddReaction('like')}
          title="Like this issue"
        >
          👍 Like ({reactions.like.length})
        </button>
        <button
          className={`reaction-btn ${userHasReacted('agree') ? 'active' : ''}`}
          onClick={() => handleAddReaction('agree')}
          title="Agree with this issue"
        >
          ✓ Agree ({reactions.agree.length})
        </button>
        <button
          className={`reaction-btn urgent ${userHasReacted('urgent') ? 'active' : ''}`}
          onClick={() => handleAddReaction('urgent')}
          title="Mark as urgent"
        >
          🔴 Urgent ({reactions.urgent.length})
        </button>
      </div>

      {/* Add Comment Form */}
      <form className="comment-form" onSubmit={handleAddComment}>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Share your thoughts or updates..."
          rows="3"
          disabled={isSubmitting}
        />
        <button type="submit" disabled={isSubmitting || !newComment.trim()}>
          {isSubmitting ? '⏳ Posting...' : '📝 Post Comment'}
        </button>
      </form>

      {/* Comments List */}
      <div className="comments-list">
        {mainComments.length === 0 ? (
          <p className="no-comments">No comments yet. Be the first to share your thoughts!</p>
        ) : (
          mainComments.map(comment => (
            <div key={comment.id} className="comment-thread">
              <div className="comment">
                <div className="comment-header">
                  <strong>{comment.userId}</strong>
                  <span className="comment-date">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="comment-text">{comment.text}</p>
                <div className="comment-actions">
                  {currentUser?.id === comment.userId && (
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      Delete
                    </button>
                  )}
                  <span className="reply-count">
                    {getThreadReplies(comment.id).length > 0 && `${getThreadReplies(comment.id).length} replies`}
                  </span>
                </div>
              </div>

              {/* Threaded Replies */}
              {getThreadReplies(comment.id).length > 0 && (
                <div className="replies-section">
                  {getThreadReplies(comment.id).map(reply => (
                    <div key={reply.id} className="reply">
                      <div className="comment-header">
                        <strong>{reply.userId}</strong>
                        <span className="comment-date">
                          {new Date(reply.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="comment-text">{reply.text}</p>
                      {currentUser?.id === reply.userId && (
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteComment(reply.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentsSection;
