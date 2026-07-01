const Certificate = require('../models/Certificate');
const cloudinary = require('cloudinary').v2;

// @desc    Upload certificate
// @route   POST /api/certificates
// @access  Private
const uploadCertificate = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a certificate title'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    // Determine file type
    const fileType = req.file.mimetype.split('/')[1];

    // Create certificate
    const certificate = await Certificate.create({
      userId: req.user._id,
      title,
      fileUrl: req.file.path,
      fileType: fileType,
      publicId: req.file.filename || req.file.public_id
    });

    res.status(201).json({
      success: true,
      certificate: {
        id: certificate._id,
        title: certificate.title,
        fileUrl: certificate.fileUrl,
        fileType: certificate.fileType,
        uploadedAt: certificate.uploadedAt
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user certificates
// @route   GET /api/certificates
// @access  Private
const getCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({ userId: req.user._id })
      .sort({ uploadedAt: -1 });

    res.status(200).json({
      success: true,
      count: certificates.length,
      certificates: certificates.map(cert => ({
        id: cert._id,
        title: cert.title,
        fileUrl: cert.fileUrl,
        fileType: cert.fileType,
        uploadedAt: cert.uploadedAt
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete certificate
// @route   DELETE /api/certificates/:id
// @access  Private
const deleteCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Check ownership
    if (certificate.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this certificate'
      });
    }

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(certificate.publicId);
    } catch (err) {
      console.error('Error deleting from Cloudinary:', err);
    }

    await certificate.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Certificate deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get certificate by ID (for preview)
// @route   GET /api/certificates/:id
// @access  Private
const getCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Check ownership
    if (certificate.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this certificate'
      });
    }

    res.status(200).json({
      success: true,
      certificate: {
        id: certificate._id,
        title: certificate.title,
        fileUrl: certificate.fileUrl,
        fileType: certificate.fileType,
        uploadedAt: certificate.uploadedAt
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  uploadCertificate,
  getCertificates,
  deleteCertificate,
  getCertificate
};