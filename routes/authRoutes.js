const express = require('express');
const router = express.Router();
const crypto = require('crypto')

// Step 1: Redirect to Facebook's OAuth (for Instagram)
router.get('/instagram', (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID, // Use Facebook App ID!
    redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
    scope: 'instagram_basic,instagram_content_publish', // Business scopes
    response_type: 'code',
    state: crypto.randomBytes(16).toString('hex')
  });

  res.redirect(`https://www.facebook.com/v18.0/dialog/oauth?${params}`);
});

// Step 2: Handle callback
router.get('/instagram/callback', async (req, res) => {
  try {
    // 1. Exchange code for token
    const { data } = await axios.get(`https://graph.facebook.com/v18.0/oauth/access_token`, {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
        code: req.query.code
      }
    });

    // 2. Get Instagram Business Account ID
    const account = await axios.get(`https://graph.facebook.com/v18.0/me/accounts`, {
      params: {
        access_token: data.access_token,
        fields: 'instagram_business_account'
      }
    });

    // 3. Store tokens
    req.session.igToken = data.access_token;
    req.session.igBusinessId = account.data.data[0].instagram_business_account.id;
    
    res.redirect('/profile');
  } catch (error) {
    console.error('Instagram Auth Error:', error.response?.data || error.message);
    res.redirect('/login?error=instagram_auth_failed');
  }
});

// 4. Webhook Verification
router.get('/instagram/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.INSTAGRAM_VERIFY_TOKEN) {
      console.log('Instagram webhook verified');
      return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
  }
  return res.sendStatus(400);
});

// 5. Current User Endpoint (with fresh media data)
router.get('/current_user', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const mediaResponse = await InstagramAPI.get(`/${req.user.instagramId}/media`, {
      params: {
        access_token: req.user.accessToken,
        fields: 'id,media_type,media_url'
      }
    });

    res.json({
      id: req.user.instagramId,
      username: req.user.username,
      accountType: req.user.accountType,
      recentMedia: mediaResponse.data.data
    });
  } catch (error) {
    res.json({
      id: req.user.instagramId,
      username: req.user.username,
      error: "Could not fetch media data"
    });
  }
});

module.exports = router;