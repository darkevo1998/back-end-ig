const express = require('express');
const passport = require('passport');
const router = express.Router();

// Instagram authentication route
router.get('/instagram', passport.authenticate('instagram'));

// Instagram callback route (after OAuth)
router.get('/instagram/callback',
  passport.authenticate('instagram', {
    failureRedirect: '/login',
    failureFlash: true
  }),
  (req, res) => {
    if (!req.user) {
      console.error("User authentication failed:", req.query);
      return res.status(400).send('Authentication failed');
    }
    console.info(`Successful Instagram login for user: ${req.user.username}`);
    res.redirect(process.env.CLIENT_SUCCESS_REDIRECT || '/profile');
  }
);

// Facebook/Instagram Webhook Verification
// (Required for webhooks, not OAuth)
router.get('/instagram/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Check if mode and token are present
  if (mode && token) {
    // Verify the token matches your expected token
    if (mode === 'subscribe' && token === process.env.FB_VERIFY_TOKEN) {
      console.log('Webhook verified successfully');
      return res.status(200).send(challenge);
    } else {
      console.error('Verification failed - Invalid token or mode');
      return res.sendStatus(403);
    }
  }
  return res.sendStatus(400);
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