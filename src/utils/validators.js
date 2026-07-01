// Additional validation utilities if needed
const isValidFileType = (mimetype) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    return allowedTypes.includes(mimetype);
  };
  
  const isValidFileSize = (size) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    return size <= maxSize;
  };
  
  module.exports = {
    isValidFileType,
    isValidFileSize
  };