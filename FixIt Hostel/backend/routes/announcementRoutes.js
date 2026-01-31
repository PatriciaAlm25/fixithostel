/**
 * Announcement Routes for FixIt Hostel Backend
 * Handles announcements (management only creation, visible to all)
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const { uploadImage, deleteImage } = require('../services/imageUploadService');

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    cb(null, allowedMimes.includes(file.mimetype));
  },
});

/**
 * POST /api/announcements
 * Create announcement (Management only)
 */
router.post('/', upload.single('attachment'), async (req, res) => {
  try {
    const { title, content, hostel, priority, management_id } = req.body;

    console.log('📢 Creating announcement:', { title, hostel, priority });

    if (!title || !content || !management_id) {
      return res.status(400).json({
        success: false,
        message: 'Title, content, and management_id are required',
      });
    }

    // Verify management user
    const { data: mgmt } = await supabase
      .from('users')
      .select('role, id')
      .eq('id', management_id)
      .single();

    if (!mgmt || mgmt.role !== 'management') {
      return res.status(403).json({
        success: false,
        message: 'Only management can create announcements',
      });
    }

    let attachmentUrl = null;
    let attachmentPath = null;

    if (req.file) {
      console.log(`📎 Uploading announcement attachment: ${req.file.originalname}`);
      
      const uploadResult = await uploadImage(
        req.file.buffer,
        req.file.originalname,
        'announcement-attachments',
        management_id
      );

      if (!uploadResult.success) {
        return res.status(400).json({
          success: false,
          message: `File upload failed: ${uploadResult.error}`,
        });
      }

      attachmentUrl = uploadResult.imageUrl;
      attachmentPath = uploadResult.imagePath;
      console.log(`✅ Attachment uploaded`);
    }

    const { data: announcement, error } = await supabase
      .from('announcements')
      .insert([{
        management_id,
        title,
        content,
        hostel: hostel || null,
        priority: priority || 'Normal',
        attachment_url: attachmentUrl,
        attachment_path: attachmentPath,
        published: true,
        published_at: new Date().toISOString(),
      }])
      .select();

    if (error) {
      console.error('❌ Error creating announcement:', error);
      throw error;
    }

    console.log(`✅ Announcement created: ${announcement[0].id}`);

    res.status(201).json({
      success: true,
      message: 'Announcement published successfully',
      announcement: announcement[0],
    });
  } catch (error) {
    console.error('❌ Error in POST /announcements:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/announcements
 * Get all published announcements
 */
router.get('/', async (req, res) => {
  try {
    const { hostel, priority } = req.query;

    console.log(`📋 Fetching announcements - hostel: ${hostel || 'all'}, priority: ${priority || 'all'}`);

    let query = supabase
      .from('announcements')
      .select(`
        *,
        management:management_id(id, name, email)
      `)
      .eq('published', true)
      .order('published_at', { ascending: false });

    if (hostel && hostel !== 'all') query = query.eq('hostel', hostel);
    if (priority && priority !== 'all') query = query.eq('priority', priority);

    const { data: announcements, error } = await query;

    if (error) {
      console.error('❌ Error fetching announcements:', error);
      throw error;
    }

    console.log(`✅ Fetched ${announcements?.length || 0} announcements`);

    res.json({
      success: true,
      announcements: announcements || [],
      count: announcements?.length || 0,
    });
  } catch (error) {
    console.error('❌ Error in GET /announcements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcements',
    });
  }
});

/**
 * GET /api/announcements/:id
 * Get single announcement
 */
router.get('/:id', async (req, res) => {
  try {
    const { data: announcement, error } = await supabase
      .from('announcements')
      .select(`
        *,
        management:management_id(id, name, email)
      `)
      .eq('id', req.params.id)
      .eq('published', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Announcement not found',
        });
      }
      throw error;
    }

    res.json({
      success: true,
      announcement,
    });
  } catch (error) {
    console.error('❌ Error fetching announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcement',
    });
  }
});

/**
 * PUT /api/announcements/:id
 * Update announcement (Management only)
 */
router.put('/:id', upload.single('attachment'), async (req, res) => {
  try {
    const { title, content, hostel, priority, management_id } = req.body;

    console.log(`🔄 Updating announcement ${req.params.id}`);

    if (!management_id) {
      return res.status(400).json({
        success: false,
        message: 'management_id is required',
      });
    }

    // Verify management user
    const { data: mgmt } = await supabase
      .from('users')
      .select('role')
      .eq('id', management_id)
      .single();

    if (!mgmt || mgmt.role !== 'management') {
      return res.status(403).json({
        success: false,
        message: 'Only management can update announcements',
      });
    }

    let attachmentUrl = null;
    let attachmentPath = null;

    if (req.file) {
      // Delete old attachment if exists
      const { data: oldAnnouncement } = await supabase
        .from('announcements')
        .select('attachment_path')
        .eq('id', req.params.id)
        .single();

      if (oldAnnouncement?.attachment_path) {
        await deleteImage('announcement-attachments', oldAnnouncement.attachment_path);
      }

      const uploadResult = await uploadImage(
        req.file.buffer,
        req.file.originalname,
        'announcement-attachments',
        management_id
      );

      if (!uploadResult.success) {
        return res.status(400).json({
          success: false,
          message: `File upload failed: ${uploadResult.error}`,
        });
      }

      attachmentUrl = uploadResult.imageUrl;
      attachmentPath = uploadResult.imagePath;
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (hostel) updateData.hostel = hostel;
    if (priority) updateData.priority = priority;
    if (attachmentUrl) updateData.attachment_url = attachmentUrl;
    if (attachmentPath) updateData.attachment_path = attachmentPath;

    const { data: announcement, error } = await supabase
      .from('announcements')
      .update(updateData)
      .eq('id', req.params.id)
      .select();

    if (error) throw error;

    console.log(`✅ Announcement updated`);

    res.json({
      success: true,
      message: 'Announcement updated successfully',
      announcement: announcement[0],
    });
  } catch (error) {
    console.error('❌ Error updating announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update announcement',
    });
  }
});

/**
 * DELETE /api/announcements/:id
 * Delete announcement (Management only)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { management_id } = req.body;

    console.log(`🗑️  Deleting announcement ${req.params.id}`);

    if (!management_id) {
      return res.status(400).json({
        success: false,
        message: 'management_id is required',
      });
    }

    // Verify management user
    const { data: mgmt } = await supabase
      .from('users')
      .select('role')
      .eq('id', management_id)
      .single();

    if (!mgmt || mgmt.role !== 'management') {
      return res.status(403).json({
        success: false,
        message: 'Only management can delete announcements',
      });
    }

    const { data: announcement } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (announcement?.attachment_path) {
      await deleteImage('announcement-attachments', announcement.attachment_path);
    }

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    console.log(`✅ Announcement deleted`);

    res.json({
      success: true,
      message: 'Announcement deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete announcement',
    });
  }
});

module.exports = router;
