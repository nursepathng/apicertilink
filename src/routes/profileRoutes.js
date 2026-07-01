const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const { avatarUpload } = require('../middleware/upload');
const {
  getProfile,
  updateProfile,
  uploadAvatar
} = require('../controllers/profileController');

// Validation rules
const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Name cannot be more than 50 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Bio cannot be more than 200 characters'),
  body('avatarUrl')
    .optional()
    .trim()
    .isURL().withMessage('Invalid avatar URL')
];

// Routes
router.get('/me', protect, getProfile);
router.put('/', protect, updateProfileValidation, updateProfile);
router.post('/avatar', protect, avatarUpload.single('avatar'), uploadAvatar);

module.exports = router;