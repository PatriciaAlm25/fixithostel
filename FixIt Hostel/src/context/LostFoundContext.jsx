import React, { createContext, useState, useCallback, useEffect } from 'react';
import * as supabaseLostFound from '../services/supabaseLostFound';
import { uploadLostFoundImages, deleteLostFoundImages } from '../services/supabaseStorage';

export const LostFoundContext = createContext();

export const LostFoundProvider = ({ children }) => {
  const [lostFoundItems, setLostFoundItems] = useState([]);
  const [claimRequests, setClaimRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  let unsubscribeItems = null;
  let unsubscribeClaims = null;

  // Subscribe to Supabase items on initialization
  useEffect(() => {
    setIsLoading(true);
    // Initial fetch
    const fetchItems = async () => {
      const result = await supabaseLostFound.getAllLostFoundItems();
      if (result.success) {
        setLostFoundItems(result.items || []);
      }
      setIsLoading(false);
    };
    fetchItems();

    // Subscribe to real-time updates
    let subscription;
    try {
      subscription = supabaseLostFound.subscribeToLostFound(() => {
        // On any event, re-fetch all items
        fetchItems();
      });
    } catch (err) {
      console.error('Error subscribing to lost & found:', err);
      setError(err.message);
      setIsLoading(false);
    }

    // Cleanup subscriptions on unmount
    return () => {
      if (subscription && subscription.unsubscribe) subscription.unsubscribe();
      if (unsubscribeClaims) unsubscribeClaims();
    };
  }, []);

  // Create a new lost or found item
  const createItem = useCallback(async (itemData) => {
    try {
      setIsLoading(true);

      // Upload images to Supabase Storage
      let imageURLs = [];
      if (itemData.images && itemData.images.length > 0) {
        const uploadResults = await uploadLostFoundImages(itemData.images);
        imageURLs = uploadResults.imageURLs || [];
      }

      // Create item in Supabase
      const newItem = await supabaseLostFound.createLostFoundItem({
        ...itemData,
        images: imageURLs,
      });

      setError(null);
      return newItem;
    } catch (err) {
      console.error('Error creating lost & found item:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);


  // Delete an item
  const deleteItem = useCallback(async (itemId) => {
    try {
      setIsLoading(true);

      // Get item to access images
      const item = lostFoundItems.find((i) => i.id === itemId);
      if (item && item.images && item.images.length > 0) {
        await deleteLostFoundImages(item.images);
      }

      // Delete item from Supabase
      await supabaseLostFound.deleteLostFoundItem(itemId);

      setError(null);
    } catch (err) {
      console.error('Error deleting lost & found item:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [lostFoundItems]);

  // Submit a claim request for an item
  const submitClaim = useCallback(async (itemId, claimData) => {
    try {
      setIsLoading(true);

      // Upload proof images if provided
      let proofImageURLs = [];
      if (claimData.proofImages && claimData.proofImages.length > 0) {
        const uploadResults = await uploadLostFoundImages(claimData.proofImages);
        proofImageURLs = uploadResults.imageURLs || [];
      }

      // Create claim in Supabase
      const newClaim = await supabaseLostFound.submitClaim(itemId, {
        ...claimData,
        proofImages: proofImageURLs,
      });

      setError(null);
      return newClaim;
    } catch (err) {
      console.error('Error submitting claim:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);


  // Get items by type (lost/found)
  const getItemsByType = useCallback((type) => {
    return lostFoundItems.filter((item) => item.type === type);
  }, [lostFoundItems]);

  // Get items by status
  const getItemsByStatus = useCallback((status) => {
    return lostFoundItems.filter((item) => item.status === status);
  }, [lostFoundItems]);

  // Get user's posted items
  const getUserItems = useCallback((userId) => {
    return lostFoundItems.filter((item) => item.userId === userId);
  }, [lostFoundItems]);

  // Get pending claims for all items
  const getPendingClaims = useCallback(() => {
    return claimRequests.filter((claim) => claim.status === 'pending');
  }, [claimRequests]);

  // Get claims for specific item
  const getItemClaims = useCallback((itemId) => {
    return claimRequests.filter((claim) => claim.itemId === itemId);
  }, [claimRequests]);

  const value = {
    lostFoundItems,
    claimRequests,
    createItem,
    deleteItem,
    submitClaim,
    getItemsByType,
    getItemsByStatus,
    getUserItems,
    getPendingClaims,
    getItemClaims,
    isLoading,
    error,
  };

  return (
    <LostFoundContext.Provider value={value}>
      {children}
    </LostFoundContext.Provider>
  );
};
