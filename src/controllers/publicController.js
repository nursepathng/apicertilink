const User = require('../models/User');
const Certificate = require('../models/Certificate');

// @desc    Get public profile by username
// @route   GET /api/u/:username
// @access  Public
const getPublicProfile = async (req, res) => {
  try {
    const { username } = req.params;

    // Find user by username
    const user = await User.findOne({ username }).select('-passwordHash');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's certificates
    const certificates = await Certificate.find({ userId: user._id })
      .sort({ uploadedAt: -1 })
      .select('title fileUrl fileType uploadedAt');

    res.status(200).json({
      success: true,
      user: {
        name: user.name,
        username: user.username,
        avatarUrl: user.avatarUrl,
        bio: user.bio
      },
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

// Add a redirect function for old query-based URLs
const redirectPublicProfile = (req, res) => {
  const { username } = req.query;
  if (username) {
      return res.redirect(301, `/${username}`);
  }
  return res.status(404).json({
      success: false,
      message: 'Username required'
  });
};

module.exports = {
  getPublicProfile,
  redirectPublicProfile
};
