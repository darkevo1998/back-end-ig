module.exports = function(passport) {
  const InstagramStrategy = require('passport-instagram').Strategy;
  const User = require('../models/User');

  passport.use(new InstagramStrategy({
    clientID: process.env.INSTAGRAM_CLIENT_ID,
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
    callbackURL: process.env.INSTAGRAM_CALLBACK_URL,
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ instagramId: profile.id });
      
      if (!user) {
        user = new User({
          instagramId: profile.id,
          username: profile.username,
          accessToken: accessToken
        });
        await user.save();
      }
      
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
};