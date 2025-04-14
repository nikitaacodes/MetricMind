const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { describeImage } = require('../controllers/visionController');

router.post('/describe', upload.single('image'), describeImage);

module.exports = router;
