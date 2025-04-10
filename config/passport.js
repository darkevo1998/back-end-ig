const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;

// Configure Facebook (Instagram Graph API) Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.INSTAGRAM_APP_ID, // From Facebook Developer App
      clientSecret: process.env.INSTAGRAM_APP_SECRET,
      callbackURL: "https://back-end-ig.vercel.app/auth/instagram/callback",
      profileFields: ['id', 'displayName', 'photos', 'email'],
      enableProof: true, // Security measure
      scope: ['instagram_basic', 'pages_show_list'], // Instagram Business permissions
    },
    (accessToken, refreshToken, profile, done) => {
      // This function runs after successful OAuth
      // Save user to DB or attach to session
      console.log('Instagram OAuth profile:', profile);
      return done(null, profile); // Attaches `profile` to `req.user`
    }
  )
);

// Optional: Serialize/Deserialize User (if using sessions)
passport.serializeUser((user, done) => {
  done(null, user.id); // Saves user ID to session
});

passport.deserializeUser((id, done) => {
  // Fetch user from DB by ID (if needed)
  done(null, { id }); // Mock example
});

module.exports = passport;