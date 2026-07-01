const User = require('../models/User');
const { validationResult } = require('express-validator');
const cloudinary = require('cloudinary').v2;

// @desc    Get current user profile
// @route   GET /api/profile/me
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, bio, avatarUrl } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    
    // If avatarUrl is provided and different from current
    if (avatarUrl && avatarUrl !== user.avatarUrl) {
      // Delete old avatar from Cloudinary if exists
      if (user.avatarUrl) {
        try {
          const publicId = user.avatarUrl.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`certilink/avatars/${publicId}`);
        } catch (err) {
          console.error('Error deleting old avatar:', err);
        }
      }
      user.avatarUrl = avatarUrl;
    }

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: user.bio
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

// @desc    Upload avatar
// @route   POST /api/profile/avatar
// @access  Private
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }

    const user = await User.findById(req.user._id);
    
    // Delete old avatar from Cloudinary if exists
    if (user.avatarUrl) {
      try {
        const publicId = user.avatarUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`certilink/avatars/${publicId}`);
      } catch (err) {
        console.error('Error deleting old avatar:', err);
      }
    }

    user.avatarUrl = req.file.path;
    await user.save();

    res.status(200).json({
      success: true,
      avatarUrl: user.avatarUrl,
      message: 'Avatar uploaded successfully'
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
  getProfile,
  updateProfile,
  uploadAvatar
};