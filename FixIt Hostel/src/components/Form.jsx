import React, { useState } from 'react';
import CameraInput from './CameraInput';
import '../styles/Form.css';

const Form = ({ onSubmit, fields, submitText = 'Submit', title = '', isSubmitting = false }) => {
  console.log('✅ Form component loaded with fields:', fields.map(f => f.name));
  const [formData, setFormData] = useState(() => {
    const initial = {};
    fields.forEach((field) => {
      initial[field.name] = field.value || '';
      if (field.type === 'camera') {
        initial[field.name] = [];
      }
      if (field.type === 'location') {
        initial[field.name] = null;
      }
    });
    return initial;
  });

  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error for this field
    setLocationError(prev => ({
      ...prev,
      [name]: ''
    }));
  };

  const handleGetGPSLocation = (fieldName) => {
    setLocationLoading(true);
    setLocationError(prev => ({
      ...prev,
      [fieldName]: ''
    }));

    if (!navigator.geolocation) {
      const error = '❌ GPS is not supported on this device. Please try on a device with GPS capabilities.';
      setLocationError(prev => ({
        ...prev,
        [fieldName]: error
      }));
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const locationData = {
          latitude,
          longitude,
          accuracy: accuracy.toFixed(2),
          timestamp: new Date().toISOString(),
        };
        
        setFormData((prev) => ({
          ...prev,
          [fieldName]: locationData,
        }));
        
        setLocationError(prev => ({
          ...prev,
          [fieldName]: `✅ GPS Location captured (Accuracy: ${accuracy.toFixed(0)}m)`
        }));
        setLocationLoading(false);
      },
      (error) => {
        let errorMsg = '❌ Could not get location. ';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMsg += 'Permission denied. Please enable location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg += 'Location information not available. Move to an open area.';
            break;
          case error.TIMEOUT:
            errorMsg += 'Location request timed out. Please try again.';
            break;
          default:
            errorMsg += error.message;
        }
        setLocationError(prev => ({
          ...prev,
          [fieldName]: errorMsg
        }));
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleImagesSelected = (images, fieldName) => {
    console.log(`📸 Images selected for field "${fieldName}":`, {
      count: images?.length || 0,
      details: images?.map((img, i) => ({
        index: i,
        type: typeof img,
        isFile: img instanceof File,
        isBlob: img instanceof Blob,
        hasSize: img?.size !== undefined,
        size: img?.size,
        name: img?.name || 'unknown',
      })) || []
    });

    setFormData((prev) => ({
      ...prev,
      [fieldName]: images,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('📋 Form submit handler called');

    // Validate all required fields
    for (const field of fields) {
      console.log(`✓ Validating field: ${field.name} (type: ${field.type}, required: ${field.required})`);
      
      if (field.type === 'camera' && field.required) {
        if (!formData[field.name] || formData[field.name].length === 0) {
          const msg = `${field.label} is required. Please take at least one photo.`;
          console.error(`❌ ${msg}`);
          alert(msg);
          return;
        }
      }

      // Validate location fields if required
      if (field.type === 'location' && field.required) {
        if (!formData[field.name]) {
          const msg = `${field.label} is required. Please click "Get My GPS Location" button.`;
          console.error(`❌ ${msg}`);
          alert(msg);
          return;
        }
      }

      // Validate select fields if required
      if (field.type === 'select' && field.required) {
        if (!formData[field.name] || formData[field.name].trim() === '') {
          const msg = `${field.label} is required. Please select an option.`;
          console.error(`❌ ${msg}`);
          alert(msg);
          return;
        }
      }

      // Validate text, password, email, number, date fields
      if ((field.type === 'textarea' || field.type === 'text' || field.type === 'password' || field.type === 'email' || field.type === 'number' || field.type === 'date') && field.required) {
        const fieldValue = formData[field.name];
        const isEmpty = !fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '');
        
        if (isEmpty) {
          const msg = `${field.label} is required.`;
          console.error(`❌ ${msg}`, { fieldValue, fieldType: typeof fieldValue });
          alert(msg);
          return;
        }
      }
    }

    console.log('✅ All validations passed, submitting form');
    console.log('📋 Form data before submission:', {
      ...formData,
      images: formData.images?.length ? `[${formData.images.length} image(s)]` : 'no images',
    });
    
    setSubmitting(true);
    try {
      await onSubmit(formData);
      console.log('✅ Form submission successful');
    } catch (error) {
      console.error('❌ Error submitting form:', error);
      // Extract meaningful error message
      const errorMsg = error?.message || String(error);
      if (errorMsg.includes('malformed')) {
        alert('❌ Error: Invalid image data. Please retake photos and try again.');
      } else {
        alert(`❌ Error submitting form: ${errorMsg}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      {title && <h2 className="form-title">{title}</h2>}
      <div className="form-fields">
        {fields.map((field) => (
          <div key={field.name} className="form-group">
            <label htmlFor={field.name} className="form-label">
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            {field.helpText && (
              <p className="form-help-text">{field.helpText}</p>
            )}
            {field.type === 'camera' ? (
              <CameraInput
                onImagesSelected={(images) => handleImagesSelected(images, field.name)}
                maxImages={field.maxImages || 5}
                required={field.required || false}
                cameraOnly={field.cameraOnly || false}
              />
            ) : field.type === 'location' ? (
              <div className="location-input-container">
                <button
                  type="button"
                  className="location-btn"
                  onClick={() => handleGetGPSLocation(field.name)}
                  disabled={locationLoading}
                >
                  {locationLoading ? '⏳ Getting Location...' : '📍 Get My GPS Location'}
                </button>
                {formData[field.name] && (
                  <div className="location-display">
                    <p><strong>✅ Location Captured:</strong></p>
                    <p>🗺️ Latitude: {formData[field.name].latitude.toFixed(6)}</p>
                    <p>🗺️ Longitude: {formData[field.name].longitude.toFixed(6)}</p>
                    <p>📏 Accuracy: {formData[field.name].accuracy}m</p>
                  </div>
                )}
                {locationError[field.name] && (
                  <p className="location-status">{locationError[field.name]}</p>
                )}
              </div>
            ) : field.type === 'textarea' ? (
              <textarea
                id={field.name}
                name={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                placeholder={field.placeholder || ''}
                required={field.required || false}
                rows={field.rows || 4}
                className="form-input"
              />
            ) : field.type === 'select' ? (
              <select
                id={field.name}
                name={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                required={field.required || false}
                className="form-input"
              >
                <option value="">{field.placeholder || 'Select...'}</option>
                {field.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : field.type === 'checkbox' ? (
              <input
                type="checkbox"
                id={field.name}
                name={field.name}
                checked={formData[field.name]}
                onChange={handleChange}
                className="form-checkbox"
              />
            ) : (
              <input
                type={field.type || 'text'}
                id={field.name}
                name={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                placeholder={field.placeholder || ''}
                required={field.required || false}
                className="form-input"
              />
            )}
          </div>
        ))}
      </div>
      <button type="submit" className="form-submit" disabled={submitting || isSubmitting}>
        {submitting || isSubmitting ? '⏳ Submitting...' : submitText}
      </button>
    </form>
  );
};

export default Form;
