/**
 * Lost & Found Routes for FixIt Hostel Backend
 * Handles lost and found item reporting with images
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
 * POST /api/lost-found
 * Create lost/found item with image
 */
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { item_type, item_name, description, category, location, hostel, block, room_no, user_id } = req.body;

    console.log('📝 Creating lost/found item:', { item_type, item_name, user_id });

    if (!item_type || !item_name || !user_id || !['Lost', 'Found'].includes(item_type)) {
      return res.status(400).json({
        success: false,
        message: 'Item type (Lost/Found), name, and user_id are required',
      });
    }

    let imageUrl = null;
    let imagePath = null;

    if (req.file) {
      console.log(`📤 Uploading item image: ${req.file.originalname}`);
      
      const uploadResult = await uploadImage(
        req.file.buffer,
        req.file.originalname,
        'lost-found-images',
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
      console.log(`✅ Item image uploaded`);
    }

    const { data: item, error } = await supabase
      .from('lost_found_items')
      .insert([{
        user_id,
        item_type,
        item_name,
        description: description || '',
        category: category || null,
        location: location || null,
        hostel: hostel || null,
        block: block || null,
        room_no: room_no || null,
        image_url: imageUrl,
        image_path: imagePath,
        status: 'Open',
      }])
      .select();

    if (error) {
      console.error('❌ Error creating lost/found item:', error);
      throw error;
    }

    console.log(`✅ Lost/Found item created: ${item[0].id}`);

    res.status(201).json({
      success: true,
      message: 'Item reported successfully',
      item: item[0],
    });
  } catch (error) {
    console.error('❌ Error in POST /lost-found:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/lost-found
 * Get all lost/found items
 */
router.get('/', async (req, res) => {
  try {
    const { item_type, status, hostel } = req.query;

    console.log(`📋 Fetching lost/found items - type: ${item_type || 'all'}, status: ${status || 'all'}`);

    // Use a plain select here to avoid relying on DB foreign-key relationships
    // (some Supabase schemas may not have FK relations configured).
    let query = supabase
      .from('lost_found_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (item_type) query = query.eq('item_type', item_type);
    if (status) query = query.eq('status', status);
    if (hostel) query = query.eq('hostel', hostel);

    const { data: items, error } = await query;

    if (error) {
      console.error('❌ Error fetching items:', error);
      throw error;
    }

    console.log(`✅ Fetched ${items?.length || 0} lost/found items`);

    res.json({
      success: true,
      items: items || [],
      count: items?.length || 0,
    });
  } catch (error) {
    console.error('❌ Error in GET /lost-found:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch items',
    });
  }
});

/**
 * GET /api/lost-found/:id
 * Get single item
 */
router.get('/:id', async (req, res) => {
  try {
    // Return the raw item record; do not attempt FK-based joins here.
    const { data: item, error } = await supabase
      .from('lost_found_items')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Item not found',
        });
      }
      throw error;
    }

    res.json({
      success: true,
      item,
    });
  } catch (error) {
    console.error('❌ Error fetching item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch item',
    });
  }
});

/**
 * PUT /api/lost-found/:id/status
 * Assign status (Management only)
 */
router.put('/:id/status', async (req, res) => {
  try {
    const { status, management_id } = req.body;

    console.log(`🔄 Updating item ${req.params.id} status to ${status}`);

    if (!status || !management_id) {
      return res.status(400).json({
        success: false,
        message: 'Status and management_id are required',
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
        message: 'Only management can update status',
      });
    }

    const { data: item, error } = await supabase
      .from('lost_found_items')
      .update({
        status,
        assigned_to: management_id,
        assigned_at: new Date().toISOString(),
        resolved_at: status !== 'Open' ? new Date().toISOString() : null,
      })
      .eq('id', req.params.id)
      .select();

    if (error) throw error;

    console.log(`✅ Item status updated to ${status}`);

    res.json({
      success: true,
      message: 'Status updated',
      item: item[0],
    });
  } catch (error) {
    console.error('❌ Error updating item status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
    });
  }
});

/**
 * DELETE /api/lost-found/:id
 * Delete item (user only can delete their own)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { user_id } = req.body;

    console.log(`🗑️  Deleting item ${req.params.id}`);

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id is required',
      });
    }

    const { data: item } = await supabase
      .from('lost_found_items')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (item.user_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: 'Can only delete your own items',
      });
    }

    if (item.image_path) {
      await deleteImage('lost-found-images', item.image_path);
    }

    const { error } = await supabase
      .from('lost_found_items')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    console.log(`✅ Item deleted`);

    res.json({
      success: true,
      message: 'Item deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete item',
    });
  }
});

module.exports = router;
