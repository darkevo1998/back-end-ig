const express = require('express');
const passport = require('passport');
const router = express.Router();

router.get('/instagram', passport.authenticate('instagram'));

const VERIFY_TOKEN = 'testing'; 

// Instagram authentication callback route
router.get('/instagram/callback', (req, res, next) => {
  // Check if this is the Facebook Webhook verification request
  const mode = req.query['hub.mode'];
  const challenge = req.query['hub.challenge'];
  const token = req.query['hub.verify_token'];

  // If the request is for the Facebook webhook verification
  if (mode && challenge && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verification successful');
      return res.status(200).send(challenge); // Respond with the challenge to confirm the webhook
    } else {
      console.log('Webhook verification failed');
      return res.status(403).send('Verification failed');
    }
  }

  // If it's not a Facebook webhook verification, continue with Instagram login
  passport.authenticate('instagram', {
    failureRedirect: '/login',
    session: true
  })(req, res, next);
}, (req, res) => {
  // Redirect the user after Instagram authentication
  res.redirect(process.env.CLIENT_URL);
});

router.get('/logout', (req, res) => {
  req.logout();
  res.redirect(process.env.CLIENT_URL);
});

router.get('/current_user', (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

module.exports = router;