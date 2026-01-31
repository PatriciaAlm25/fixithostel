import { supabase } from './supabaseClient';

/**
 * Generate a UUID v4
 */
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Create a lost/found item
 * @param {Object} itemData
 * @returns {Promise<Object>} - {success, item, error}
 */
export const createLostFoundItem = async (itemData) => {
  try {
    console.log('📝 Creating lost/found item...');
    console.log('📦 Input data:', itemData);

    // Map incoming itemData keys to database column names
    const userId = itemData.userId || itemData.posted_by || itemData.user_id;
    
    const insertPayload = {
      item_type: itemData.type || itemData.itemType || itemData.item_type || 'lost',
      item_name: itemData.title || itemData.itemName || itemData.item_name || '',
      description: itemData.description || '',
      category: itemData.category || null,
      location: itemData.location || null,
      hostel: itemData.hostel || null,
      block: itemData.block || null,
      room_no: itemData.roomNo || itemData.room_no || null,
      status: itemData.status || 'Open',
      created_at: new Date().toISOString(),
    };

    // Always add user_id - either use valid UUID or generate one
    if (userId && typeof userId === 'string' && userId.includes('-') && userId.length >= 36) {
      // It's already a valid UUID
      insertPayload.user_id = userId;
      console.log('✅ Using provided user_id:', userId);
    } else {
      // Generate a new UUID for this post
      insertPayload.user_id = generateUUID();
      console.log('🆔 Generated new UUID for post:', insertPayload.user_id);
      if (userId) {
        console.log('   (Original user identifier was:', userId, ')');
      }
    }

    console.log('💾 Insert payload:', insertPayload);
    console.log('📊 Payload keys:', Object.keys(insertPayload));

    const { data: createdItems, error: insertError } = await supabase
      .from('lost_found_items')
      .insert([insertPayload])
      .select();

    if (insertError) {
      console.error('❌ Insert error:', insertError);
      console.error('❌ Error details:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
      });
      throw insertError;
    }

    if (!createdItems || createdItems.length === 0) {
      throw new Error('No item was created');
    }

    const created = createdItems[0];
    console.log('✅ Item created successfully:', created);

    // If there are image URLs provided, insert them into the images table
    if (Array.isArray(itemData.images) && itemData.images.length > 0) {
      console.log(`📸 Inserting ${itemData.images.length} images...`);
      
      const imageInserts = itemData.images.map((url) => ({
        item_id: created.id,
        image_url: url,
        file_path: null,
        uploaded_at: new Date().toISOString(),
      }));

      console.log('Image inserts:', imageInserts);

      const { data: imgData, error: imgError } = await supabase
        .from('lost_found_images')
        .insert(imageInserts)
        .select();

      if (imgError) {
        console.warn('⚠️ Could not insert images for item:', imgError.message);
      } else {
        console.log('✅ Inserted images:', (imgData || []).length);
      }
    } else {
      console.log('⏭️ No images to insert');
    }

    console.log('✅ Item creation complete:', created.id);
    return { success: true, item: created };
  } catch (error) {
    console.error('❌ Error creating item:', error.message || error);
    console.error('Full error:', error);
    return { success: false, error: error.message || String(error) };
  }
};

/**
 * Upload lost/found image
 * @param {string} itemId
 * @param {File} file
 * @returns {Promise<Object>} - {success, image, error}
 */
export const uploadLostFoundImage = async (itemId, file) => {
  try {
    console.log('📤 Uploading lost/found image:', file.name);

    const fileName = `${itemId}/${Date.now()}_${file.name}`;
    
    const { data, error: uploadError } = await supabase.storage
      .from('lost-found-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: publicData } = supabase.storage
      .from('lost-found-images')
      .getPublicUrl(fileName);

    const { data: imageRecord, error: recordError } = await supabase
      .from('lost_found_images')
      .insert([
        {
          item_id: itemId,
          image_url: publicData.publicUrl,
          file_path: fileName,
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
 * Get all lost/found items
 * @param {string} type - (optional) 'lost' or 'found'
 * @returns {Promise<Object>} - {success, items, error}
 */
export const getAllLostFoundItems = async (type = null) => {
  try {
    console.log('📋 Fetching lost/found items...');

    let itemsQuery = supabase
      .from('lost_found_items')
      .select('*');

    if (type) itemsQuery = itemsQuery.eq('type', type);

    const { data: items, error: itemsError } = await itemsQuery.order('created_at', { ascending: false });
    if (itemsError) throw itemsError;

    console.log(`📊 Retrieved ${items?.length || 0} raw items from database`);

    if (!items || items.length === 0) {
      console.log('ℹ️ No lost/found items found');
      return { success: true, items: [] };
    }

    const itemIds = items.map((it) => it.id).filter(Boolean);
    console.log(`🔍 Fetching images for ${itemIds.length} items...`);

    // Fetch images
    const { data: images = [], error: imagesError } = await supabase
      .from('lost_found_images')
      .select('*')
      .in('item_id', itemIds);
    if (imagesError) console.warn('⚠️ Could not fetch images:', imagesError.message);
    console.log(`📸 Retrieved ${images?.length || 0} images`);

    // Fetch claims
    const { data: claims = [], error: claimsError } = await supabase
      .from('claims')
      .select('*')
      .in('item_id', itemIds);
    if (claimsError) console.warn('⚠️ Could not fetch claims:', claimsError.message);

    // Get poster user data
    const posterIds = [...new Set(items.map((it) => it.posted_by || it.user_id).filter(Boolean))];
    let posterUsers = [];
    if (posterIds.length > 0) {
      const { data: users = [], error: usersError } = await supabase
        .from('users')
        .select('id, name, role, email, phone')
        .in('id', posterIds);
      if (usersError) console.warn('⚠️ Could not fetch posters:', usersError.message);
      posterUsers = users || [];
    }

    const imagesByItem = images.reduce((acc, img) => {
      const key = img.item_id;
      if (!acc[key]) acc[key] = [];
      const imageUrl = img.image_url || img.file_path;
      if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim().length > 0) {
        acc[key].push(imageUrl.trim());
      }
      return acc;
    }, {});

    console.log('🖼️ Images grouped by item:', Object.entries(imagesByItem).map(([id, imgs]) => ({ id, count: imgs.length })));

    const claimsByItem = claims.reduce((acc, c) => {
      const key = c.item_id;
      if (!acc[key]) acc[key] = [];
      acc[key].push(c);
      return acc;
    }, {});

    const posterById = posterUsers.reduce((acc, u) => {
      acc[u.id] = u;
      return acc;
    }, {});

    const itemsWithData = items.map((it) => ({
      ...it,
      images: imagesByItem[it.id] || [],  // Map to 'images' for frontend consistency
      lost_found_images: imagesByItem[it.id] || [],  // Keep both for backward compatibility
      type: it.item_type || it.type,  // Normalize type field
      title: it.item_name || it.title,  // Normalize title field
      dateReported: it.created_at || it.dateReported,  // Normalize date field
      poster: posterById[it.posted_by || it.user_id] || null,
      claims: claimsByItem[it.id] || [],
    }));

    console.log(`✅ Retrieved ${itemsWithData.length} items with all data`, {
      items: itemsWithData.slice(0, 3).map(i => ({
        id: i.id,
        title: i.title,
        type: i.type,
        images: i.images.length,
      }))
    });
    return { success: true, items: itemsWithData };
  } catch (error) {
    console.error('❌ Error fetching items:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Get item by ID
 * @param {string} itemId
 * @returns {Promise<Object>} - {success, item, error}
 */
export const getLostFoundItemById = async (itemId) => {
  try {
    console.log('🔍 Fetching item separately:', itemId);

    const { data: item, error: itemError } = await supabase
      .from('lost_found_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (itemError) throw itemError;

    // Fetch images
    const { data: images = [], error: imagesError } = await supabase
      .from('lost_found_images')
      .select('*')
      .eq('item_id', itemId);
    if (imagesError) console.warn('⚠️ Could not fetch images:', imagesError.message);

    // Fetch claims
    const { data: claims = [], error: claimsError } = await supabase
      .from('claims')
      .select('*')
      .eq('item_id', itemId);
    if (claimsError) console.warn('⚠️ Could not fetch claims:', claimsError.message);

    // Fetch poster user
    let posterData = null;
    if (item.posted_by) {
      const { data: poster, error: posterError } = await supabase
        .from('users')
        .select('id, name, role, email, phone')
        .eq('id', item.posted_by)
        .single();
      if (posterError) console.warn('⚠️ Could not fetch poster:', posterError.message);
      posterData = poster || null;
    }

    // Fetch claimers
    const claimer_ids = (claims || []).map((c) => c.claimed_by).filter(Boolean);
    let claimersData = [];
    if (claimer_ids.length > 0) {
      const { data: claimers = [], error: claimersError } = await supabase
        .from('users')
        .select('id, name, phone')
        .in('id', claimer_ids);
      if (claimersError) console.warn('⚠️ Could not fetch claimers:', claimersError.message);
      claimersData = claimers || [];
    }

    const claimerById = claimersData.reduce((acc, u) => {
      acc[u.id] = u;
      return acc;
    }, {});

    const itemWithData = {
      ...item,
      lost_found_images: images || [],
      poster: posterData,
      claims: (claims || []).map((c) => ({
        ...c,
        claimer: claimerById[c.claimed_by] || null,
      })),
    };

    console.log('✅ Item retrieved with all data:', itemId);
    return { success: true, item: itemWithData };
  } catch (error) {
    console.error('❌ Error fetching item:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Get items posted by user
 * @param {string} userId
 * @returns {Promise<Object>} - {success, items, error}
 */
export const getLostFoundItemsByUser = async (userId) => {
  try {
    console.log('📋 Fetching items for user:', userId);

    const { data: items, error: itemsError } = await supabase
      .from('lost_found_items')
      .select('*')
      .eq('posted_by', userId)
      .order('created_at', { ascending: false });

    if (itemsError) throw itemsError;

    if (!items || items.length === 0) return { success: true, items: [] };

    const itemIds = items.map((it) => it.id).filter(Boolean);

    // Fetch images
    const { data: images = [], error: imagesError } = await supabase
      .from('lost_found_images')
      .select('*')
      .in('item_id', itemIds);
    if (imagesError) console.warn('⚠️ Could not fetch images:', imagesError.message);

    // Fetch claims
    const { data: claims = [], error: claimsError } = await supabase
      .from('claims')
      .select('*')
      .in('item_id', itemIds);
    if (claimsError) console.warn('⚠️ Could not fetch claims:', claimsError.message);

    const imagesByItem = images.reduce((acc, img) => {
      const key = img.item_id;
      if (!acc[key]) acc[key] = [];
      acc[key].push(img);
      return acc;
    }, {});

    const claimsByItem = (claims || []).reduce((acc, c) => {
      const key = c.item_id;
      if (!acc[key]) acc[key] = [];
      acc[key].push(c);
      return acc;
    }, {});

    const itemsWithData = items.map((it) => ({
      ...it,
      lost_found_images: imagesByItem[it.id] || [],
      claims: claimsByItem[it.id] || [],
    }));

    console.log(`✅ Retrieved ${itemsWithData.length} items for user with all data`);
    return { success: true, items: itemsWithData };
  } catch (error) {
    console.error('❌ Error fetching user items:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Submit a claim for an item
 * @param {string} itemId
 * @param {Object} claimData - {claimed_by, proof_text}
 * @returns {Promise<Object>} - {success, claim, error}
 */
export const submitClaim = async (itemId, claimData) => {
  try {
    console.log('📝 Submitting claim for item:', itemId);

    const { data, error } = await supabase
      .from('claims')
      .insert([
        {
          item_id: itemId,
          ...claimData,
          status: 'pending',
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) throw error;

    // Update item status
    await supabase
      .from('lost_found_items')
      .update({ status: 'claimed', updated_at: new Date().toISOString() })
      .eq('id', itemId);

    console.log('✅ Claim submitted:', data[0].id);
    return { success: true, claim: data[0] };
  } catch (error) {
    console.error('❌ Error submitting claim:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Get claims for an item
 * @param {string} itemId
 * @returns {Promise<Object>} - {success, claims, error}
 */
export const getClaimsForItem = async (itemId) => {
  try {
    console.log('📋 Fetching claims for item:', itemId);

    const { data, error } = await supabase
      .from('claims')
      .select(`
        *,
        claimer:claimed_by (name, id, phone, email)
      `)
      .eq('item_id', itemId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`✅ Retrieved ${data.length} claims`);
    return { success: true, claims: data };
  } catch (error) {
    console.error('❌ Error fetching claims:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Update claim status
 * @param {string} claimId
 * @param {string} status - 'pending', 'approved', 'rejected'
 * @returns {Promise<Object>} - {success, claim, error}
 */
export const updateClaimStatus = async (claimId, status) => {
  try {
    console.log('🔄 Updating claim status:', claimId, '→', status);

    const { data, error } = await supabase
      .from('claims')
      .update({ 
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', claimId)
      .select();

    if (error) throw error;

    // If claim approved, update item status to resolved
    if (status === 'approved') {
      const claim = data[0];
      await supabase
        .from('lost_found_items')
        .update({ 
          status: 'resolved',
          updated_at: new Date().toISOString(),
        })
        .eq('id', claim.item_id);
    }

    console.log('✅ Claim status updated');
    return { success: true, claim: data[0] };
  } catch (error) {
    console.error('❌ Error updating claim:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Update item status
 * @param {string} itemId
 * @param {string} status - 'active', 'claimed', 'resolved'
 * @returns {Promise<Object>} - {success, item, error}
 */
export const updateItemStatus = async (itemId, status) => {
  try {
    console.log('🔄 Updating item status:', itemId, '→', status);

    const { data, error } = await supabase
      .from('lost_found_items')
      .update({ 
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .select();

    if (error) throw error;

    console.log('✅ Item status updated');
    return { success: true, item: data[0] };
  } catch (error) {
    console.error('❌ Error updating item:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Delete lost/found item
 * @param {string} itemId
 * @returns {Promise<Object>} - {success, error}
 */
export const deleteLostFoundItem = async (itemId) => {
  try {
    console.log('🗑️  Deleting item:', itemId);

    // Get all images
    const { data: images, error: fetchError } = await supabase
      .from('lost_found_images')
      .select('file_path')
      .eq('item_id', itemId);

    if (fetchError) throw fetchError;

    // Delete images from storage
    if (images && images.length > 0) {
      const filePaths = images.map(img => img.file_path);
      const { error: deleteStorageError } = await supabase.storage
        .from('lost-found-images')
        .remove(filePaths);

      if (deleteStorageError) throw deleteStorageError;
    }

    // Delete item
    const { error: deleteError } = await supabase
      .from('lost_found_items')
      .delete()
      .eq('id', itemId);

    if (deleteError) throw deleteError;

    console.log('✅ Item deleted');
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting item:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe to real-time updates
 * @param {Function} callback
 * @returns {Object} - Subscription
 */
export const subscribeToLostFound = async (callback) => {
  console.log('📡 Subscribing to real-time lost/found updates...');

  // First, fetch all existing items
  try {
    const result = await getAllLostFoundItems();
    if (result.success) {
      console.log('📌 Initial items loaded:', result.items.length);
      callback(result.items);
    }
  } catch (error) {
    console.error('❌ Error fetching initial items:', error);
  }

  // Then subscribe to real-time changes
  const subscription = supabase
    .channel('lost-found-channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'lost_found_items' },
      async (payload) => {
        console.log('📢 Item update received:', payload.eventType);
        // Fetch all items again to get updated data
        try {
          const result = await getAllLostFoundItems();
          if (result.success) {
            console.log('📌 Updated items:', result.items.length);
            callback(result.items);
          }
        } catch (error) {
          console.error('❌ Error fetching updated items:', error);
        }
      }
    )
    .subscribe();

  return subscription;
};
