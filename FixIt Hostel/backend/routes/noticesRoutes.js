/**
 * Notices Routes
 * Management can post notices visible to all users
 */

const path = require('path');
const fs = require('fs');
const { getAllNotices, addNotice, getNoticeById, deleteNotice, updateNotice } = require('../database');

/**
 * POST /api/notices - Create a new notice (Management only)
 */
const createNoticeHandler = async (req, res) => {
  try {
    console.log('[createNoticeHandler] Entry point - req.body:', req.body);
    
    const { title, description, content, userRole, userId, userName } = req.body;
    console.log('[createNoticeHandler] Extracted fields - title:', title, 'userRole:', userRole);

    // Validate required fields
    if (!title || !description) {
      console.log('[createNoticeHandler] Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Title and description are required',
      });
    }

    // Check if user is management
    if (userRole !== 'management' && userRole !== 'admin') {
      console.log('[createNoticeHandler] User role check failed:', userRole);
      return res.status(403).json({
        success: false,
        message: 'Only management can post notices',
      });
    }

    console.log('[createNoticeHandler] Creating notice object...');
    
    // Create notice object
    const notice = {
      id: `notice_${Date.now()}`,
      title,
      description,
      content: content || '',
      postedBy: userName || 'Management',
      userId: userId || 'system',
      role: userRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 0,
      archived: false,
    };

    console.log('[createNoticeHandler] Notice object created:', notice.id);
    console.log('[createNoticeHandler] Calling addNotice...');
    
    // Add notice to database
    const result = await addNotice(notice);

    console.log('[createNoticeHandler] ✅ Notice saved:', notice.id);

    res.status(201).json({
      success: true,
      message: 'Notice posted successfully',
      notice: result,
    });
  } catch (error) {
    console.error('[createNoticeHandler] ❌ Error:', error.message, error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create notice',
    });
  }
};

/**
 * GET /api/notices - Get all notices (All users can read)
 */
const getNoticesHandler = async (req, res) => {
  try {
    const { archived } = req.query;
    
    const notices = await getAllNotices();
    
    // Filter by archived status if specified
    let filteredNotices = notices;
    if (archived === 'false') {
      filteredNotices = notices.filter(n => !n.archived);
    } else if (archived === 'true') {
      filteredNotices = notices.filter(n => n.archived);
    }

    // Sort by date (newest first)
    filteredNotices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    console.log(`📋 Retrieved ${filteredNotices.length} notices`);

    res.status(200).json({
      success: true,
      count: filteredNotices.length,
      notices: filteredNotices,
    });
  } catch (error) {
    console.error('❌ Error retrieving notices:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve notices',
    });
  }
};

/**
 * GET /api/notices/:id - Get single notice
 */
const getNoticeByIdHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const notice = await getNoticeById(id);

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found',
      });
    }

    // Increment view count
    notice.views = (notice.views || 0) + 1;
    await updateNotice(id, notice);

    console.log(`📖 Notice viewed: ${id}`);

    res.status(200).json({
      success: true,
      notice: notice,
    });
  } catch (error) {
    console.error('❌ Error retrieving notice:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve notice',
    });
  }
};

/**
 * PUT /api/notices/:id - Update notice (Management only)
 */
const updateNoticeHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, content, userRole } = req.body;

    // Check if user is management
    if (userRole !== 'management' && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only management can update notices',
      });
    }

    const notice = await getNoticeById(id);

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found',
      });
    }

    // Update fields
    if (title) notice.title = title;
    if (description) notice.description = description;
    if (content !== undefined) notice.content = content;
    notice.updatedAt = new Date().toISOString();

    await updateNotice(id, notice);

    console.log('✅ Notice updated:', id);

    res.status(200).json({
      success: true,
      message: 'Notice updated successfully',
      notice: notice,
    });
  } catch (error) {
    console.error('❌ Error updating notice:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update notice',
    });
  }
};

/**
 * DELETE /api/notices/:id - Delete/Archive notice (Management only)
 */
const deleteNoticeHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { userRole, archive } = req.body;

    // Check if user is management
    if (userRole !== 'management' && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only management can delete notices',
      });
    }

    const notice = await getNoticeById(id);

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found',
      });
    }

    if (archive === true) {
      // Archive instead of delete
      notice.archived = true;
      notice.updatedAt = new Date().toISOString();
      await updateNotice(id, notice);
      console.log('📦 Notice archived:', id);
    } else {
      // Permanent delete
      await deleteNotice(id);
      console.log('🗑️ Notice deleted:', id);
    }

    res.status(200).json({
      success: true,
      message: archive ? 'Notice archived successfully' : 'Notice deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting notice:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete notice',
    });
  }
};

module.exports = {
  createNoticeHandler,
  getNoticesHandler,
  getNoticeByIdHandler,
  updateNoticeHandler,
  deleteNoticeHandler,
};
