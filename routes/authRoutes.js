const express = require('express');
const passport = require('passport');
const router = express.Router();

// Instagram authentication route
router.get('/instagram', passport.authenticate('instagram'));

// Instagram callback route
router.get('/instagram/callback',
  passport.authenticate('instagram', {
    failureRedirect: '/login',
    failureFlash: true
  }),
  (req, res) => {
    // Log successful login (simple console.log)
    console.info(`Successful Instagram login for user: ${req.user.username}`);
    res.redirect(process.env.CLIENT_SUCCESS_REDIRECT || '/profile');
  }
);

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
