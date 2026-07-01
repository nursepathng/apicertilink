const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const {
  uploadCertificate,
  getCertificates,
  deleteCertificate,
  getCertificate
} = require('../controllers/certificateController');

// Routes
router.post('/', protect, upload.single('file'), uploadCertificate);
router.get('/', protect, getCertificates);
router.get('/:id', protect, getCertificate);
router.delete('/:id', protect, deleteCertificate);

module.exports = router;