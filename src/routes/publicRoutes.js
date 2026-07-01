const express = require('express');
const router = express.Router();
const { getPublicProfile, redirectPublicProfile } = require('../controllers/publicController');

// API route for public profile data
router.get('/:username', getPublicProfile);

// Redirect old query-based URLs
router.get('/public-profile', redirectPublicProfile);

module.exports = router;