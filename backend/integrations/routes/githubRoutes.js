const express = require('express');
const router = express.Router();
const { syncGitHub, getGitHubActivity } = require('../controllers/githubController');

router.post('/sync', syncGitHub);
router.get('/activity/:userId', getGitHubActivity);

module.exports = router;