const express = require('express');
const router = express.Router();
const { updateLinkedinProfile, getShareLink } = require('../controllers/linkedinController');

router.put('/profile/:userId', updateLinkedinProfile);
router.get('/share/:portfolioId', getShareLink);

module.exports = router;