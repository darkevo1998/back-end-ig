const express = require('express');
const axios = require('axios');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');

// Get user profile
router.get('/profile', ensureAuthenticated, async (req, res) => {
  try {
    const response = await axios.get(`https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${req.user.accessToken}`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user media
router.get('/media', ensureAuthenticated, async (req, res) => {
  try {
    const response = await axios.get(`https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username,comments_count,like_count&access_token=${req.user.accessToken}`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get comments for a media
router.get('/media/:mediaId/comments', ensureAuthenticated, async (req, res) => {
  try {
    const response = await axios.get(`https://graph.instagram.com/${req.params.mediaId}/comments?access_token=${req.user.accessToken}`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Post a comment reply
router.post('/media/:mediaId/comments', ensureAuthenticated, async (req, res) => {
  try {
    const { message } = req.body;
    const response = await axios.post(`https://graph.instagram.com/${req.params.mediaId}/comments`, {
      message,
      access_token: req.user.accessToken
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;