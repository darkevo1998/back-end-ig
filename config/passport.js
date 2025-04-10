const InstagramStrategy = require('passport-oauth2').Strategy;

passport.use(new InstagramStrategy({
    authorizationURL: 'https://api.instagram.com/oauth/authorize',
    tokenURL: 'https://api.instagram.com/oauth/access_token',
    clientID: process.env.INSTAGRAM_CLIENT_ID,
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
    callbackURL: process.env.INSTAGRAM_CALLBACK_URL,
    scope: ['user_profile', 'user_media'],
    state: true,
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      const userId = await getInstagramUserId(accessToken); // Same as before
      let user = await User.findOneAndUpdate(
        { instagramId: userId },
        { 
          username: profile.username,
          accessToken: accessToken,
          lastLogin: new Date()
        },
        { upsert: true, new: true }
      );
      return done(null, user);
    } catch (err) {
      console.error('Auth error:', err);
      return done(err);
    }
  }
));