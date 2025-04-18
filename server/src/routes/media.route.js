const express = require('express');
const { uploadMedia, deleteMedia } = require('../controllers/mediaController');
const { protect } = require('../utils/auth');
const upload = require('../utils/fileUpload');

const router = express.Router();

router.post('/upload', protect, upload.single('file'), uploadMedia);
router.delete('/:publicId', protect, deleteMedia);

module.exports = router;