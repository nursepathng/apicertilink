const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a certificate title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  fileUrl: {
    type: String,
    required: [true, 'File URL is required']
  },
  fileType: {
    type: String,
    required: [true, 'File type is required'],
    enum: ['pdf', 'jpg', 'jpeg', 'png'],
    lowercase: true
  },
  publicId: {
    type: String,
    required: true
  }
}, {
  timestamps: {
    createdAt: 'uploadedAt',
    updatedAt: false
  }
});

// Ensure user can't upload duplicate certificates (optional)
CertificateSchema.index({ userId: 1, title: 1 }, { unique: false });

module.exports = mongoose.model('Certificate', CertificateSchema);