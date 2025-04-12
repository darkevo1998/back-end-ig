const express = require('express');
const axios = require('axios');
const router = express.Router();
const crypto = require('crypto');

// STEP 1: Redirect to Instagram OAuth
router.get('/login', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex'); // CSRF protection

  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` + 
    new URLSearchParams({
      client_id: process.env.FACEBOOK_APP_ID,
      redirect_uri: process.env.INSTAGRAM_CALLBACK_URL,
      scope: 'instagram_basic,instagram_manage_comments,pages_show_list,instagram_content_publish',
      response_type: 'code',
      state
    });

  res.redirect(authUrl);
});

// STEP 2: Handle OAuth Redirect
router.get('/instagram/callback', async (req, res) => {
  const { code } = req.query;

  try {
    // Exchange code for access token
    const tokenResponse = await axios.get(`https://graph.facebook.com/v18.0/oauth/access_token`, {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: process.env.INSTAGRAM_CALLBACK_URL,
        code
      }
    });

    const accessToken = tokenResponse.data.access_token;

    // Get the user's FB Pages
    const pagesResponse = await axios.get(`https://graph.facebook.com/v18.0/me/accounts`, {
      params: { access_token: accessToken }
    });

    if (!pagesResponse.data.data || pagesResponse.data.data.length === 0) {
      throw new Error('No Facebook Pages found for this user');
    }

    const page = pagesResponse.data.data[0];
    console.log(`Found page: ${page.name} (${page.id})`);

    // Get the IG Business account linked to the page
    const igResponse = await axios.get(`https://graph.facebook.com/v18.0/${page.id}`, {
      params: {
        fields: 'instagram_business_account{id,username}',
        access_token: accessToken
      }
    });

    if (!igResponse.data.instagram_business_account) {
      throw new Error(`Page ${page.name} is not connected to an Instagram Business Account. 
        Please connect in Facebook settings.`);
    }

    const instagramAccountId = igResponse.data.instagram_business_account.id;
    const instagramUsername = igResponse.data.instagram_business_account.username;

    res.json({
      message: 'Login successful!',
      pageName: page.name,
      instagramAccountId,
      instagramUsername,
      accessToken
    });

  } catch (err) {
    console.error('Instagram OAuth error:', err.response?.data || err.message);
    res.status(500).json({ 
      error: 'OAuth failed',
      details: err.message,
      fullError: err.response?.data 
    });
  }
});

module.exports = router;
