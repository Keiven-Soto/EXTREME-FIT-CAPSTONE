// client/utils/cloudinary.js
const CLOUD_NAME = 'dvttjot2g'; // Replace with your actual cloud name

export const getCloudinaryImageUrl = (publicId, options = {}) => {
  const {
    width,
    height,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
    ...otherOptions
  } = options;

  // Build transformation string
  let transformations = [];
  
  if (quality) transformations.push(`q_${quality}`);
  if (format) transformations.push(`f_${format}`);
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (crop) transformations.push(`c_${crop}`);
  
  // Add any other transformations
  Object.entries(otherOptions).forEach(([key, value]) => {
    if (value) transformations.push(`${key}_${value}`);
  });

  const transformationString = transformations.length > 0 
    ? transformations.join(',') + '/' 
    : '';

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformationString}${publicId}`;
};

// Predefined sizes for your app
export const ImageSizes = {
  THUMBNAIL: { width: 100, height: 100 },
  CARD: { width: 300, height: 200 },
  PRODUCT_DETAIL: { width: 600, height: 400 },
  HERO: { width: 800, height: 400 },
  PROFILE: { width: 150, height: 150 }
};

// Convenience functions for common use cases
export const getProductImageUrl = (publicId, size = 'CARD') => {
  return getCloudinaryImageUrl(publicId, ImageSizes[size]);
};

export const getOptimizedImageUrl = (publicId, customOptions = {}) => {
  const defaultOptions = {
    quality: 'auto',
    format: 'auto',
    crop: 'fill'
  };
  
  return getCloudinaryImageUrl(publicId, { ...defaultOptions, ...customOptions });
};