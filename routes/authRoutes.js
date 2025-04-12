const express = require('express');
const router = express.Router();
const crypto = require('crypto')

// Step 1: Redirect to Facebook's OAuth (for Instagram)
router.get('/login', (req, res) => {
  const params = new URLSearchParams({
      client_id: process.env.INSTAGRAM_CLIENT_ID , // Use your Instagram/Facebook App ID
      redirect_uri: process.env.INSTAGRAM_CALLBACK_URL, // Use your Instagram/Facebook Callback URL
      client_secret: process.env.INSTAGRAM_CLIENT_SECRET, // Use your Instagram/Facebook App Secret
      response_type: 'code',
      scope: [
          'instagram_basic', 
          'instagram_content_publish', 
          'instagram_manage_messages',
          'instagram_manage_comments'
      ].join(','),
      state: crypto.randomBytes(16).toString('hex') // CSRF protection
  });

  res.redirect(`https://www.instagram.com/oauth/authorize?${params}`);
});

// Instagram Token Exchange Endpoint
router.get("/your_insta_token", async (req, res) => {
  try {
      // Get code from query params
      const authorization_code = req.query.code + "#_";
      
      // Exchange code for access token
      const url = "https://api.instagram.com/oauth/access_token";
      const payload = new URLSearchParams({
          client_id: process.env.INSTAGRAM_CLIENT_ID,
          client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
          grant_type: "authorization_code",
          redirect_uri: process.env.INSTAGRAM_CALLBACK_URL,
          code: authorization_code
      });

      const response = await axios.post(url, payload.toString(), {
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
          }
      });

      const data = response.data;
      const user_access_token = data.access_token;
      
      // Return the token (customize this response as needed)
      res.send(`repository_user token is: ${user_access_token} and library_type`);
      
  } catch (error) {
      console.error("Error exchanging token:", error.response?.data || error.message);
      res.status(500).send("Error during token exchange");
  }
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