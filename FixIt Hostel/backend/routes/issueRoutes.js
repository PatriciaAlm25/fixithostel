/**
 * Issue Routes for FixIt Hostel Backend
 * Handles issue creation, updates, and image storage in Supabase
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

// Configure multer for image upload (in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images allowed'));
    }
  },
});
/**
 * POST /api/issues
 * Create a new issue with image
 */
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { title, description, category, priority, hostel, block, room_no, user_id } = req.body;

    console.log('📨 Creating issue:', { title, category, user_id });

    // Validate required fields
    if (!title || !category || !user_id) {
      return res.status(400).json({
        success: false,
        message: 'Title, category, and user_id are required',
      });
    }

    let imageUrl = null;
    let imagePath = null;

    // Upload image if provided
    if (req.file) {
      console.log(`📤 Uploading issue image: ${req.file.originalname}`);
      
      const uploadResult = await uploadImage(
        req.file.buffer,
        req.file.originalname,
        'issue-images',
        user_id
      );

      if (!uploadResult.success) {
        return res.status(400).json({
          success: false,
          message: `Image upload failed: ${uploadResult.error}`,
        });
      }

      imageUrl = uploadResult.imageUrl;
      imagePath = uploadResult.imagePath;
      console.log(`✅ Issue image uploaded`);
    }

    // Create issue in Supabase
    const { data: issue, error } = await supabase
      .from('issues')
      .insert([{
        user_id,
        title,
        description: description || '',
        category,
        priority: priority || 'Normal',
        status: 'Reported',
        hostel: hostel || null,
        block: block || null,
        room_no: room_no || null,
        image_url: imageUrl,
        image_path: imagePath,
      }])
      .select();

    if (error) {
      console.error('❌ Error creating issue in Supabase:', error);
      throw error;
    }

    console.log(`✅ Issue created successfully: ${issue[0].id}`);

    res.status(201).json({
      success: true,
      message: 'Issue reported successfully',
      issue: issue[0],
    });
  } catch (error) {
    console.error('❌ Error creating issue:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create issue',
    });
  }
});

/**
 * GET /api/issues
 * Get all issues (visible to all users)
 */
router.get('/', async (req, res) => {
  try {
    const { status, hostel } = req.query;

    console.log(`📋 Fetching issues - status: ${status || 'all'}, hostel: ${hostel || 'all'}`);

    let query = supabase
      .from('issues')
      .select(`
        *,
        users:user_id(id, name, email, role),
        caretaker:assigned_to(id, name, email)
      `)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (hostel) query = query.eq('hostel', hostel);

    const { data: issues, error } = await query;

    if (error) {
      console.error('❌ Error fetching issues:', error);
      throw error;
    }

    console.log(`✅ Fetched ${issues?.length || 0} issues`);

    res.json({
      success: true,
      issues: issues || [],
      count: issues?.length || 0,
    });
  } catch (error) {
    console.error('❌ Error in GET /issues:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch issues',
    });
  }
});

/**
 * GET /api/issues/:id
 * Get single issue by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { data: issue, error } = await supabase
      .from('issues')
      .select(`
        *,
        users:user_id(id, name, email, role),
        caretaker:assigned_to(id, name, email)
      `)
      .eq('id', req.params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Issue not found',
        });
      }
      throw error;
    }

    res.json({
      success: true,
      issue,
    });
  } catch (error) {
    console.error('❌ Error fetching issue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch issue',
    });
  }
});

/**
 * PUT /api/issues/:id/assign
 * Assign issue to caretaker (Management only)
 */
router.put('/:id/assign', async (req, res) => {
  try {
    const { management_id, caretaker_id } = req.body;

    console.log(`📌 Assigning issue ${req.params.id} to caretaker ${caretaker_id}`);

    if (!management_id || !caretaker_id) {
      return res.status(400).json({
        success: false,
        message: 'Management ID and Caretaker ID are required',
      });
    }

    // Verify management user
    const { data: mgmtUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', management_id)
      .single();

    if (!mgmtUser || mgmtUser.role !== 'management') {
      return res.status(403).json({
        success: false,
        message: 'Only management can assign issues',
      });
    }

    // Update issue
    const { data: issue, error } = await supabase
      .from('issues')
      .update({
        assigned_to: caretaker_id,
        assigned_by: management_id,
        assigned_at: new Date().toISOString(),
        status: 'Assigned',
      })
      .eq('id', req.params.id)
      .select();

    if (error) throw error;

    console.log(`✅ Issue assigned successfully`);

    res.json({
      success: true,
      message: 'Issue assigned successfully',
      issue: issue[0],
    });
  } catch (error) {
    console.error('❌ Error assigning issue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign issue',
    });
  }
});

/**
 * PUT /api/issues/:id/status
 * Update issue status (Caretaker/Management)
 */
router.put('/:id/status', async (req, res) => {
  try {
    const { status, user_id } = req.body;

    console.log(`🔄 Updating issue ${req.params.id} status to ${status}`);

    if (!status || !user_id) {
      return res.status(400).json({
        success: false,
        message: 'Status and user_id are required',
      });
    }

    const validStatuses = ['Reported', 'Assigned', 'In Progress', 'Resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    // Verify user is caretaker or management
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', user_id)
      .single();

    if (!user || !['caretaker', 'management'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only caretaker or management can update issue status',
      });
    }

    const updateData = { status };
    if (status === 'Resolved') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { data: issue, error } = await supabase
      .from('issues')
      .update(updateData)
      .eq('id', req.params.id)
      .select();

    if (error) throw error;

    console.log(`✅ Issue status updated to ${status}`);

    res.json({
      success: true,
      message: 'Issue status updated',
      issue: issue[0],
    });
  } catch (error) {
    console.error('❌ Error updating issue status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
    });
  }
});

/**
 * DELETE /api/issues/:id
 * Delete issue (user only can delete their own)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { user_id } = req.body;

    console.log(`🗑️  Deleting issue ${req.params.id}`);

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id is required',
      });
    }

    // Get issue to verify ownership and check for image
    const { data: issue } = await supabase
      .from('issues')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (issue.user_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: 'Can only delete your own issues',
      });
    }

    // Delete image from storage if exists
    if (issue.image_path) {
      await deleteImage('issue-images', issue.image_path);
    }

    // Delete issue from database
    const { error } = await supabase
      .from('issues')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    console.log(`✅ Issue deleted successfully`);

    res.json({
      success: true,
      message: 'Issue deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting issue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete issue',
    });
  }
})

module.exports = router;
