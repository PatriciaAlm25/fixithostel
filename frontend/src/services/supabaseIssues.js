import { supabase } from './supabaseClient';

/**
 * Validate if a string is a valid URL
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid URL
 */
const isValidUrl = (url) => {
  if (typeof url !== 'string') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Parse issue images from storage or JSON string
 * @param {*} imageData - Can be string, array, or null
 * @returns {Array<string>} - Array of image URLs
 */
const parseIssueImages = (imageData) => {
  console.log('🔍 parseIssueImages input:', { type: typeof imageData, isArray: Array.isArray(imageData), data: imageData });
  
  if (!imageData) {
    console.log('ℹ️ No image data provided');
    return [];
  }
  
  // Already an array of valid URLs
  if (Array.isArray(imageData)) {
    console.log('✅ Images already an array, filtering:', imageData);
    const filtered = imageData.filter(img => img && typeof img === 'string' && img.trim().length > 0 && isValidUrl(img));
    console.log('✅ Filtered images count:', filtered.length, 'URLs:', filtered.slice(0, 2));
    return filtered;
  }
  
  // String that might be JSON
  if (typeof imageData === 'string') {
    // Skip empty strings
    if (!imageData.trim()) {
      console.log('ℹ️ Empty string provided');
      return [];
    }
    
    console.log('📝 Image data is string, attempting JSON parse:', imageData.substring(0, 100));
    try {
      const parsed = JSON.parse(imageData);
      console.log('✅ Successfully parsed JSON:', parsed);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter(img => img && typeof img === 'string' && img.trim().length > 0 && isValidUrl(img));
        console.log('✅ Filtered parsed images count:', filtered.length);
        return filtered;
      }
    } catch (e) {
      // Not JSON, return empty
      console.warn('⚠️ Could not parse image data as JSON:', e.message);
      return [];
    }
  }
  
  console.warn('⚠️ Image data is unexpected type:', typeof imageData);
  return [];
};

/**
 * Create a new issue with images
 * @param {Object} issueData
 * @returns {Promise<Object>} - {success, issue, error}
 */
export const createIssue = async (issueData) => {
  try {
    console.log('📝 Creating issue...');
    console.log('📸 Issue data images:', {
      hasImages: !!issueData.images,
      imageLength: issueData.images?.length || 0,
      imageType: typeof issueData.images,
      isArray: Array.isArray(issueData.images),
    });

    // Separate images from issue data - IMPORTANT: remove images before inserting
    const images = issueData.images || [];
    const { images: _, ...dataWithoutImages } = issueData;

    // Validate and prepare data for insertion
    // DO NOT include the 'images' field in the insert - it will be added after upload
    const insertData = {
      ...dataWithoutImages,
      created_at: new Date().toISOString(),
      images: null, // Initialize images field to null - will be updated after upload if needed
      // Explicitly exclude the images field to prevent "malformed array literal" error
    };

    console.log('📋 Data to insert into database:', {
      keys: Object.keys(insertData),
      hasImages: 'images' in insertData,
    });

    // First, create the issue record
    const { data, error } = await supabase
      .from('issues')
      .insert([insertData])
      .select();

    if (error) {
      console.error('❌ Error creating issue in Supabase:', error);
      throw new Error(`Failed to create issue: ${error.message}`);
    }

    const issueId = data[0].id;
    console.log('✅ Issue created:', issueId);

    // Then upload images if any
    let imageURLs = [];
    let finalIssueData = { ...data[0], images: imageURLs };
    
    if (images && Array.isArray(images) && images.length > 0) {
      console.log(`📸 Processing ${images.length} images...`);
      const uploadResults = await uploadIssueImages(issueId, images);
      
      if (uploadResults.success) {
        imageURLs = uploadResults.imageURLs || [];
        console.log('📸 Image URLs to save:', imageURLs);
        
        // Update issue with image URLs only if there are any
        if (imageURLs.length > 0) {
          const imageJsonString = JSON.stringify(imageURLs);
          console.log('📝 Updating issue with images JSON:', imageJsonString);
          
          const { data: updateData, error: updateError } = await supabase
            .from('issues')
            .update({ images: imageJsonString })
            .eq('id', issueId)
            .select();

          if (updateError) {
            console.error('❌ Error updating images:', updateError);
            console.error('Update error details:', {
              message: updateError.message,
              code: updateError.code,
              details: updateError.details,
              hint: updateError.hint
            });
            // Don't throw - issue is already created, just log the warning
            // Use the imageURLs array we have
            finalIssueData = { ...data[0], images: imageJsonString };
          } else {
            console.log('✅ Images saved to issue:', updateData);
            // Use the updated data from database
            finalIssueData = updateData[0];
          }
        } else {
          console.log('⚠️ No image URLs returned from upload');
          finalIssueData = { ...data[0], images: null };
        }
      } else {
        console.warn('⚠️ Image upload had issues:', uploadResults.error);
        // Continue anyway - issue is created
        finalIssueData = { ...data[0], images: null };
      }
    } else {
      console.log('ℹ️ No images to upload', { images: images?.length || 0 });
      finalIssueData = { ...data[0], images: null };
    }

    console.log('📤 Returning issue data:', { id: finalIssueData.id, images: finalIssueData.images });
    
    // Ensure images is always an array in the returned data
    const issueWithParsedImages = {
      ...finalIssueData,
      images: parseIssueImages(finalIssueData.images || [])
    };
    
    console.log('📤 Final issue with parsed images:', { 
      id: issueWithParsedImages.id, 
      images: issueWithParsedImages.images,
      imageCount: issueWithParsedImages.images.length
    });
    return { success: true, issue: issueWithParsedImages };
  } catch (error) {
    console.error('❌ Error creating issue:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Upload multiple issue images to Supabase storage
 * @param {string} issueId
 * @param {Array<File>} imageFiles
 * @returns {Promise<Object>} - {success, imageURLs, error}
 */
export const uploadIssueImages = async (issueId, imageFiles) => {
  try {
    // Validate input
    if (!imageFiles || imageFiles.length === 0) {
      console.log('⚠️ No images to upload');
      return { success: true, imageURLs: [] };
    }

    console.log(`📤 Uploading ${imageFiles.length} images for issue ${issueId}...`);

    const imageURLs = [];

    for (let i = 0; i < imageFiles.length; i++) {
      try {
        const file = imageFiles[i];
        
        if (!file) {
          console.warn(`⚠️ Image ${i} is null/undefined, skipping`);
          continue;
        }

        const fileName = `${issueId}/${Date.now()}_${Math.random().toString(36).substring(7)}_image_${i}.jpg`;
        
        console.log(`📤 Uploading image ${i + 1}/${imageFiles.length}: ${file.name || 'image'}`);
        
        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('issue-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error(`❌ Error uploading image ${i}:`, uploadError.message);
          continue;
        }

        // Get public URL
        const { data: publicData } = supabase.storage
          .from('issue-images')
          .getPublicUrl(fileName);

        if (publicData?.publicUrl && typeof publicData.publicUrl === 'string') {
          const url = publicData.publicUrl.trim();
          if (url.length > 0) {
            imageURLs.push(url);
            console.log(`✅ Image ${i + 1} uploaded successfully: ${url.substring(0, 60)}...`);
          }
        } else {
          console.warn(`⚠️ Image ${i + 1} public URL not available`);
        }
      } catch (fileError) {
        console.error(`❌ Error processing image ${i}:`, fileError.message);
        continue;
      }
    }

    console.log(`✅ Upload complete: ${imageURLs.length}/${imageFiles.length} successful`);
    return { success: true, imageURLs };
  } catch (error) {
    console.error('❌ Error uploading images:', error.message);
    return { success: false, error: error.message, imageURLs: [] };
  }
};

/**
 * Upload issue image to storage and save record
 * @param {string} issueId
 * @param {File} file
 * @returns {Promise<Object>} - {success, image, error}
 */
export const uploadIssueImage = async (issueId, file) => {
  try {
    console.log('📤 Uploading issue image:', file.name);

    const fileName = `${issueId}/${Date.now()}_${file.name}`;
    
    // Upload to storage
    const { data, error: uploadError } = await supabase.storage
      .from('issue-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: publicData } = supabase.storage
      .from('issue-images')
      .getPublicUrl(fileName);

    // Save image record in database
    const { data: imageRecord, error: recordError } = await supabase
      .from('issue_images')
      .insert([
        {
          issue_id: issueId,
          image_url: publicData.publicUrl,
          file_path: fileName,
          file_size: file.size,
          uploaded_at: new Date().toISOString(),
        },
      ])
      .select();

    if (recordError) throw recordError;

    console.log('✅ Image uploaded:', imageRecord[0].id);
    return { success: true, image: imageRecord[0] };
  } catch (error) {
    console.error('❌ Error uploading image:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Get all issues with related data
 * @returns {Promise<Object>} - {success, issues, error}
 */
export const getAllIssues = async () => {
  try {
    console.log('📋 Fetching all issues...');

    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`📊 Retrieved ${data.length} raw issues from database`);

    // Parse images for all issues
    const issuesWithParsedImages = data.map((issue, idx) => {
      console.log(`🔄 Processing issue ${idx + 1}/${data.length}:`, {
        id: issue.id,
        description: issue.description,
        images_raw: issue.images,
        images_type: typeof issue.images,
      });
      
      const parsedImages = parseIssueImages(issue.images);
      
      return {
        ...issue,
        images: parsedImages,
      };
    });

    console.log(`✅ Retrieved ${issuesWithParsedImages.length} issues with parsed images:`, {
      issues: issuesWithParsedImages.map(i => ({
        id: i.id,
        description: i.description?.substring(0, 50),
        images_count: i.images?.length || 0,
        hasImages: (i.images?.length || 0) > 0,
      }))
    });
    return { success: true, issues: issuesWithParsedImages };
  } catch (error) {
    console.error('❌ Error fetching issues:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Get issue by ID with images
 * @param {string} issueId
 * @returns {Promise<Object>} - {success, issue, error}
 */
export const getIssueById = async (issueId) => {
  try {
    console.log('🔍 Fetching issue:', issueId);

    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .eq('id', issueId)
      .single();

    if (error) throw error;

    // Parse images
    const issueWithImages = {
      ...data,
      images: parseIssueImages(data.images),
    };

    console.log('✅ Issue retrieved:', issueId);
    return { success: true, issue: issueWithImages };
  } catch (error) {
    console.error('❌ Error fetching issue:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Get issues by user
 * @param {string} userId
 * @returns {Promise<Object>} - {success, issues, error}
 */
export const getIssuesByUser = async (userId) => {
  try {
    console.log('📋 Fetching issues for user:', userId);

    const { data, error } = await supabase
      .from('issues')
      .select(`
        *,
        issue_images (*),
        reporter:reported_by (name, role, id)
      `)
      .eq('reported_by', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Parse images for all issues
    const issuesWithParsedImages = data.map(issue => {
      const parsedImages = parseIssueImages(issue.images);
      return {
        ...issue,
        images: parsedImages,
      };
    });

    console.log(`✅ Retrieved ${issuesWithParsedImages.length} issues for user`, {
      issues: issuesWithParsedImages.map(i => ({
        id: i.id,
        description: i.description,
        images_count: i.images?.length || 0,
      }))
    });
    return { success: true, issues: issuesWithParsedImages };
  } catch (error) {
    console.error('❌ Error fetching user issues:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Update issue status
 * @param {string} issueId
 * @param {string} status - 'reported', 'in-progress', 'resolved', 'closed'
 * @param {string} assignedTo - (optional) User ID to assign
 * @returns {Promise<Object>} - {success, issue, error}
 */
export const updateIssueStatus = async (issueId, status, assignedTo = null) => {
  try {
    console.log('🔄 Updating issue status:', issueId, '→', status);

    const updateData = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }

    if (assignedTo) {
      updateData.assigned_to = assignedTo;
    }

    const { data, error } = await supabase
      .from('issues')
      .update(updateData)
      .eq('id', issueId)
      .select();

    if (error) throw error;

    console.log('✅ Issue status updated');
    return { success: true, issue: data[0] };
  } catch (error) {
    console.error('❌ Error updating issue:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Delete issue (and cascade delete images)
 * @param {string} issueId
 * @returns {Promise<Object>} - {success, error}
 */
export const deleteIssue = async (issueId) => {
  try {
    console.log('🗑️  Deleting issue:', issueId);

    // Get all images for this issue
    const { data: images, error: fetchError } = await supabase
      .from('issue_images')
      .select('file_path')
      .eq('issue_id', issueId);

    if (fetchError) throw fetchError;

    // Delete images from storage
    if (images && images.length > 0) {
      const filePaths = images.map(img => img.file_path);
      const { error: deleteStorageError } = await supabase.storage
        .from('issue-images')
        .remove(filePaths);

      if (deleteStorageError) throw deleteStorageError;
    }

    // Delete issue (images in DB will cascade delete)
    const { error: deleteError } = await supabase
      .from('issues')
      .delete()
      .eq('id', issueId);

    if (deleteError) throw deleteError;

    console.log('✅ Issue deleted');
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting issue:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe to real-time issue updates
 * @param {Function} callback
 * @returns {Object} - Subscription with unsubscribe method
 */
export const subscribeToIssues = (callback) => {
  console.log('📡 Subscribing to real-time issue updates...');

  const subscription = supabase
    .channel('issues-channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'issues' },
      (payload) => {
        console.log('📢 Issue update received:', payload.eventType);
        callback(payload);
      }
    )
    .subscribe();

  return subscription;
};

/**
 * Search issues by category and status
 * @param {string} category - (optional)
 * @param {string} status - (optional)
 * @returns {Promise<Object>} - {success, issues, error}
 */
export const searchIssues = async (category = null, status = null) => {
  try {
    let query = supabase
      .from('issues')
      .select(`
        *,
        issue_images (*),
        reporter:reported_by (name, role)
      `);

    if (category) {
      query = query.eq('category', category);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`✅ Search returned ${data.length} results`);
    return { success: true, issues: data };
  } catch (error) {
    console.error('❌ Error searching issues:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Assign issue to a caretaker
 * @param {string} issueId
 * @param {string} caretakerId
 * @returns {Promise<Object>} - {success, issue, error}
 */
export const assignIssueToCaretaker = async (issueId, caretakerId) => {
  try {
    console.log('🔗 Assigning issue to caretaker:', issueId, '→', caretakerId);

    const { data, error } = await supabase
      .from('issues')
      .update({
        assigned_to: caretakerId,
        status: 'Assigned',
        updated_at: new Date().toISOString(),
      })
      .eq('id', issueId)
      .select();

    if (error) throw error;

    console.log('✅ Issue assigned to caretaker');
    return { success: true, issue: data[0] };
  } catch (error) {
    console.error('❌ Error assigning issue:', error.message);
    return { success: false, error: error.message };
  }
};
