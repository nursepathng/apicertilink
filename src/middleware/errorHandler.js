const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
  
    // Multer errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
      });
    }
  
    // Cloudinary errors
    if (err.message && err.message.includes('Cloudinary')) {
      return res.status(500).json({
        success: false,
        message: 'Error uploading file to Cloudinary'
      });
    }
  
    // Default error
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
  
    res.status(statusCode).json({
      success: false,
      message: message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  };
  
  module.exports = errorHandler;