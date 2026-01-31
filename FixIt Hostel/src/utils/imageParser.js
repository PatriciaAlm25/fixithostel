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
 * Parse images from various formats
 * @param {*} imageData - Can be string, array, or null
 * @returns {Array<string>} - Array of image URLs
 */
export const parseImages = (imageData) => {
  if (!imageData) return [];
  
  // Already an array
  if (Array.isArray(imageData)) {
    return imageData.filter(img => isValidUrl(img));
  }
  
  // String that might be JSON
  if (typeof imageData === 'string') {
    try {
      const parsed = JSON.parse(imageData);
      if (Array.isArray(parsed)) {
        return parsed.filter(img => isValidUrl(img));
      }
    } catch (e) {
      // Not JSON, return empty
      return [];
    }
  }
  
  return [];
};
