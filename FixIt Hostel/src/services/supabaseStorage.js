import { supabase } from './supabaseClient';

/**
 * Upload Lost & Found item images to Supabase storage
 * @param {Array<File>} imageFiles - Array of image files
 * @returns {Promise<Object>} - {success, imageURLs, error}
 */
export const uploadLostFoundImages = async (imageFiles) => {
  try {
    if (!imageFiles || imageFiles.length === 0) {
      console.log('⚠️ No images to upload');
      return { success: true, imageURLs: [] };
    }

    console.log(`📤 Uploading ${imageFiles.length} images to Lost & Found...`);

    const imageURLs = [];

    for (let i = 0; i < imageFiles.length; i++) {
      try {
        const file = imageFiles[i];
        
        if (!file) {
          console.warn(`⚠️ Image ${i} is null/undefined, skipping`);
          continue;
        }

        const fileName = `lost-found/${Date.now()}_${Math.random().toString(36).substring(7)}_image_${i}.jpg`;
        
        console.log(`📤 Uploading image ${i + 1}/${imageFiles.length}: ${file.name || 'image'}`);
        
        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('lost-found-images')
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
          .from('lost-found-images')
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
    console.error('❌ Error uploading lost & found images:', error.message);
    return { success: false, error: error.message, imageURLs: [] };
  }
};

/**
 * Delete Lost & Found item images from Supabase storage
 * @param {Array<string>} imageURLs - Array of image URLs
 * @returns {Promise<Object>} - {success, error}
 */
export const deleteLostFoundImages = async (imageURLs) => {
  try {
    if (!imageURLs || imageURLs.length === 0) {
      console.log('⚠️ No images to delete');
      return { success: true };
    }

    console.log(`🗑️ Deleting ${imageURLs.length} images...`);

    for (const url of imageURLs) {
      try {
        // Extract file path from URL
        const urlParts = url.split('/storage/v1/object/public/lost-found-images/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          
          const { error } = await supabase.storage
            .from('lost-found-images')
            .remove([filePath]);

          if (error) {
            console.warn(`⚠️ Error deleting image:`, error.message);
          } else {
            console.log(`✅ Image deleted: ${filePath}`);
          }
        }
      } catch (deleteError) {
        console.warn(`⚠️ Error processing image deletion:`, deleteError.message);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting lost & found images:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Upload issue images to Supabase storage
 * @param {Array<File>} imageFiles - Array of image files
 * @returns {Promise<Object>} - {success, imageURLs, error}
 */
export const uploadIssueImages = async (imageFiles) => {
  try {
    if (!imageFiles || imageFiles.length === 0) {
      console.log('⚠️ No images to upload');
      return { success: true, imageURLs: [] };
    }

    console.log(`📤 Uploading ${imageFiles.length} images to Issues...`);

    const imageURLs = [];

    for (let i = 0; i < imageFiles.length; i++) {
      try {
        const file = imageFiles[i];
        
        if (!file) {
          console.warn(`⚠️ Image ${i} is null/undefined, skipping`);
          continue;
        }

        const fileName = `issues/${Date.now()}_${Math.random().toString(36).substring(7)}_image_${i}.jpg`;
        
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
    console.error('❌ Error uploading issue images:', error.message);
    return { success: false, error: error.message, imageURLs: [] };
  }
};

/**
 * Delete issue images from Supabase storage
 * @param {Array<string>} imageURLs - Array of image URLs
 * @returns {Promise<Object>} - {success, error}
 */
export const deleteIssueImages = async (imageURLs) => {
  try {
    if (!imageURLs || imageURLs.length === 0) {
      console.log('⚠️ No images to delete');
      return { success: true };
    }

    console.log(`🗑️ Deleting ${imageURLs.length} images...`);

    for (const url of imageURLs) {
      try {
        // Extract file path from URL
        const urlParts = url.split('/storage/v1/object/public/issue-images/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          
          const { error } = await supabase.storage
            .from('issue-images')
            .remove([filePath]);

          if (error) {
            console.warn(`⚠️ Error deleting image:`, error.message);
          } else {
            console.log(`✅ Image deleted: ${filePath}`);
          }
        }
      } catch (deleteError) {
        console.warn(`⚠️ Error processing image deletion:`, deleteError.message);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting issue images:', error.message);
    return { success: false, error: error.message };
  }
};
