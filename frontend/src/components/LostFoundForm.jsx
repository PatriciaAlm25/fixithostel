import React, { useState } from 'react';
import CameraInput from './CameraInput';
import * as supabaseLostFound from '../services/supabaseLostFound';
import { uploadLostFoundImages } from '../services/supabaseStorage';

const LostFoundForm = ({ onSubmit, onCancel, currentUser }) => {
  const [formData, setFormData] = useState({
    itemType: 'lost',
    category: '',
    itemName: '',
    description: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    images: [],
    status: 'active',
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Electronics',
    'Clothing',
    'Accessories',
    'Documents',
    'Keys',
    'Money/Wallet',
    'Books/Stationery',
    'Other',
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImagesChange = async (files) => {
    console.log('🖼️ Images selected:', files.length, 'files');
    // Store the actual file objects - these are already File objects from CameraInput
    setImageFiles(files);
    
    // Store files directly (not base64) - uploadLostFoundImages now accepts File/Blob objects
    setFormData(prev => ({
      ...prev,
      images: files, // Pass File objects directly
    }));
    console.log('✅ Images stored, ready for upload');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('%c🚀 LOST & FOUND FORM SUBMIT STARTED', 'color: blue; font-size: 14px; font-weight: bold;');
    console.log('Form data:', {
      itemType: formData.itemType,
      itemName: formData.itemName,
      description: formData.description,
      location: formData.location,
      category: formData.category,
      imageCount: formData.images?.length || 0,
      imageFiles: imageFiles.length
    });
    setIsSubmitting(true);

    try {
      // Validate form data
      if (!formData.itemName.trim()) {
        alert('Please enter item name');
        setIsSubmitting(false);
        return;
      }

      if (!formData.description.trim()) {
        alert('Please enter item description');
        setIsSubmitting(false);
        return;
      }

      if (!formData.location.trim()) {
        alert('Please enter location');
        setIsSubmitting(false);
        return;
      }

      if (!formData.category.trim()) {
        alert('Please select a category');
        setIsSubmitting(false);
        return;
      }

      // Images are now OPTIONAL for Lost & Found items

      // Upload images to Supabase Storage first
      let imageUrls = [];
      if (formData.images && formData.images.length > 0) {
        console.log('📸 Starting image upload:');
        console.log('   - Number of images:', formData.images.length);
        console.log('   - Image types:', formData.images.map((img, i) => ({
          index: i,
          type: typeof img,
          isFile: img instanceof File,
          isBlob: img instanceof Blob,
          size: img?.size,
          name: img?.name
        })));
        
        try {
          const uploadResults = await uploadLostFoundImages(formData.images);
          imageUrls = uploadResults.imageURLs || [];
          console.log('✅ All', imageUrls.length, 'images uploaded successfully');
          console.log('   - URLs:', imageUrls);
        } catch (uploadErr) {
          console.error('❌ Image upload failed:', uploadErr);
          alert('❌ Failed to upload images. Error: ' + uploadErr.message);
          setIsSubmitting(false);
          return;
        }
      } else {
        console.log('⏭️  No images to upload (images array is empty or undefined)');
      }

      // Prepare data for Firebase (with image URLs, not base64)
      const submitData = {
        type: formData.itemType, // 'lost' or 'found'
        category: formData.category,
        title: formData.itemName,
        description: formData.description,
        location: formData.location,
        dateReported: formData.date,
        images: imageUrls, // Use uploaded image URLs instead of base64
        contactInfo: currentUser?.email || 'From Hostel App',
        userId: currentUser?.id || 'anonymous',
      };

      // Submit to Supabase
      console.log('%c💾 CREATING ITEM IN DATABASE', 'color: purple; font-weight: bold;');
      console.log('Submit data:', submitData);
      const response = await supabaseLostFound.createLostFoundItem(submitData);
      
      console.log('%c✅ ITEM CREATED SUCCESSFULLY', 'color: green; font-size: 14px; font-weight: bold;');
      console.log('Response:', response);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create item');
      }
      
      // Call parent onSubmit if provided
      if (onSubmit) {
        console.log('📢 Calling onSubmit callback');
        onSubmit(response);
      }

      // Show success message
      alert('✅ Item posted successfully!');
      
      // Reset form
      setFormData({
        itemType: 'lost',
        category: '',
        itemName: '',
        description: '',
        location: '',
        date: new Date().toISOString().split('T')[0],
        images: [],
        status: 'active',
      });
      setImageFiles([]);
      setIsSubmitting(false);
    } catch (error) {
      console.error('❌ Error submitting form:', error);
      
      // More detailed error message
      let errorMsg = error.message;
      if (error.message === 'Failed to fetch') {
        errorMsg = 'Firebase connection error. Please check your configuration.';
      }
      
      alert('❌ Failed to post item. Please try again. Error: ' + errorMsg);
      setIsSubmitting(false);
    }
  };

  return (
    <form className="lost-found-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Item Type *</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="itemType"
              value="lost"
              checked={formData.itemType === 'lost'}
              onChange={handleChange}
            />
            Lost Item
          </label>
          <label>
            <input
              type="radio"
              name="itemType"
              value="found"
              checked={formData.itemType === 'found'}
              onChange={handleChange}
            />
            Found Item
          </label>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="category">Category *</label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
        >
          <option value="">Select Category</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="itemName">Item Name *</label>
        <input
          id="itemName"
          type="text"
          name="itemName"
          value={formData.itemName}
          onChange={handleChange}
          placeholder="e.g., Black Laptop Backpack"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description *</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe the item in detail (color, brand, distinguishing features, etc.)"
          rows="4"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="location">Location *</label>
        <input
          id="location"
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="e.g., Common Room, Block A Ground Floor"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="date">Date *</label>
        <input
          id="date"
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Item Photos (Optional)</label>
        <p style={{fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem'}}>Photos help identify the item, but are not required</p>
        <CameraInput
          onImagesSelected={handleImagesChange}
          maxImages={5}
          required={false}
          cameraOnly={false}
        />
        {imageFiles.length > 0 && (
          <div className="image-count-display">
            ✓ {imageFiles.length} image{imageFiles.length > 1 ? 's' : ''} selected
          </div>
        )}
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Posting Item...' : 'Post Item'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default LostFoundForm;
