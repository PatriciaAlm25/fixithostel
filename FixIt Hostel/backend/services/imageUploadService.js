const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;

const initSupabase = () => {
  if (supabase) return supabase;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials for image upload service');
    return null;
  }

  supabase = createClient(supabaseUrl, supabaseServiceKey);
  console.log('✅ Supabase initialized for image uploads');
  return supabase;
};

/**
 * Upload image to Supabase storage
 * @param {Buffer} fileBuffer - Image file buffer
 * @param {string} fileName - Original file name
 * @param {string} bucketName - Bucket name (issue-images, lost-found-images, etc)
 * @param {string} userId - User ID for folder organization
 * @returns {Promise<Object>} - {success, imageUrl, imagePath, error}
 */
exports.uploadImage = async (fileBuffer, fileName, bucketName, userId) => {
  try {
    const client = initSupabase();
    if (!client) {
      throw new Error('Supabase not configured');
    }

    // Validate inputs
    if (!fileBuffer || !fileName || !bucketName || !userId) {
      throw new Error('Missing required parameters');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (fileBuffer.length > maxSize) {
      throw new Error('File size exceeds 10MB limit');
    }

    // Validate file type (only images)
    const fileExt = path.extname(fileName).toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    
    if (!validExtensions.includes(fileExt)) {
      throw new Error('Invalid file type. Only images allowed (jpg, png, webp, gif)');
    }

    // Generate unique file name with timestamp
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const baseFileName = path.basename(fileName, path.extname(fileName));
    const newFileName = `${baseFileName}-${timestamp}-${randomStr}${fileExt}`;
    
    // Create path: bucket/userId/fileName
    const filePath = `${userId}/${newFileName}`;

    console.log(`📤 Uploading image to ${bucketName}/${filePath}`);

    // Upload to Supabase
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType: `image/*`,
        upsert: false,
      });

    if (error) {
      console.error('❌ Supabase upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: publicData } = supabase
      .storage
      .from(bucketName)
      .getPublicUrl(filePath);

    const imageUrl = publicData?.publicUrl || '';

    console.log(`✅ Image uploaded successfully: ${filePath}`);
    console.log(`   Public URL: ${imageUrl}`);

    return {
      success: true,
      imageUrl: imageUrl,
      imagePath: filePath,
      fileName: newFileName,
    };
  } catch (error) {
    console.error('❌ Image upload error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Delete image from Supabase storage
 */
exports.deleteImage = async (bucketName, imagePath) => {
  try {
    const client = initSupabase();
    if (!client) {
      throw new Error('Supabase not configured');
    }

    if (!bucketName || !imagePath) {
      throw new Error('Missing bucket or image path');
    }

    console.log(`🗑️  Deleting image: ${bucketName}/${imagePath}`);

    const { error } = await supabase
      .storage
      .from(bucketName)
      .remove([imagePath]);

    if (error) {
      throw new Error(error.message);
    }

    console.log(`✅ Image deleted: ${imagePath}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Image delete error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Get image URL
 */
exports.getImageUrl = (bucketName, imagePath) => {
  try {
    const client = initSupabase();
    if (!client) return '';

    const { data } = supabase
      .storage
      .from(bucketName)
      .getPublicUrl(imagePath);

    return data?.publicUrl || '';
  } catch (error) {
    console.error('Error getting image URL:', error.message);
    return '';
  }
};

module.exports.initSupabase = initSupabase;
