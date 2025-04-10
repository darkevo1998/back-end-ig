const express = require('express');
const passport = require('passport');
const router = express.Router();

router.get('/instagram', passport.authenticate('instagram'));

router.get('/instagram/callback',
  passport.authenticate('instagram', {
    failureRedirect: '/login',
    session: true
  }),
  (req, res) => {
    res.redirect(process.env.CLIENT_URL);
  }
);

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