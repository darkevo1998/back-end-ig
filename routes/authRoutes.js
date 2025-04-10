const express = require('express');
const passport = require('passport');
const router = express.Router();
const querystring = require('querystring');

// Instagram authentication route
router.get('/instagram', (req, res) => {
  const authUrl = `https://api.instagram.com/oauth/authorize/?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.INSTAGRAM_CALLBACK_URL)}&response_type=code&scope=user_profile,user_media`;
  res.redirect(authUrl);
});


// Instagram callback route
router.get('/instagram/callback', async (req, res) => {
  const { code, error, error_reason } = req.query;

  // Handle errors from Instagram
  if (error) {
    console.error('Instagram OAuth error:', error_reason, error);
    return res.redirect('/login?error=' + encodeURIComponent(error_reason));
  }

  // Verify authorization code exists
  if (!code) {
    console.error('No authorization code received');
    return res.status(400).send('Authentication failed: No authorization code received');
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios({
      method: 'post',
      url: 'https://api.instagram.com/oauth/access_token',
      data: querystring.stringify({
        client_id: process.env.INSTAGRAM_CLIENT_ID,
        client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: process.env.INSTAGRAM_REDIRECT_URI, // Must match exactly
        code
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, user_id } = tokenResponse.data;

    // Get long-lived token (recommended)
    const longLivedToken = await axios.get(
      `https://graph.instagram.com/access_token?` +
      `grant_type=ig_exchange_token&` +
      `client_secret=${process.env.INSTAGRAM_CLIENT_SECRET}&` +
      `access_token=${access_token}`
    );

    // Get user profile
    const profile = await axios.get(
      `https://graph.instagram.com/${user_id}?` +
      `fields=id,username,account_type&` +
      `access_token=${longLivedToken.data.access_token}`
    );

    // Store user session or create user in DB
    req.session.instagramUser = {
      id: user_id,
      username: profile.data.username,
      accessToken: longLivedToken.data.access_token,
      tokenExpiry: new Date(Date.now() + longLivedToken.data.expires_in * 1000)
    };

    // Successful authentication
    res.redirect(process.env.CLIENT_SUCCESS_REDIRECT || '/profile');
    
  } catch (error) {
    console.error('Instagram OAuth error:', error.response?.data || error.message);
    res.redirect('/login?error=authentication_failed');
  }
});


// Logout route
router.get('/logout', (req, res) => {
  req.logout(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).send('Error during logout');
    }
    res.redirect('/');
  });
});

// Current user route
router.get('/current_user', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({
    id: req.user.id,
    username: req.user.username,
    profile: req.user.profileData
  });
});

module.exports = router;
