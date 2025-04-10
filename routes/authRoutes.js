const express = require('express');
const passport = require('passport');
const router = express.Router();

// Redirect to Instagram OAuth
router.get('/instagram', passport.authenticate('facebook', {
  scope: ['instagram_basic', 'pages_show_list'],
}));

// Handle callback
router.get('/instagram/callback', 
  passport.authenticate('facebook', { 
    failureRedirect: '/login',
    session: true 
  }),
  (req, res) => {
    res.redirect('https://front-end-ig.vercel.app/profile'); // Frontend success URL
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
