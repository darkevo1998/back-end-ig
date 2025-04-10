const axios = require('axios');
const InstagramStrategy = require('passport-instagram').Strategy;
const User = require('../models/User');

module.exports = function(passport) {
  // Function to get user ID from access token (updated for Instagram Graph API)
  const getInstagramUserId = async (accessToken) => {
    try {
      const response = await axios.get(
        `https://graph.instagram.com/me?fields=id&access_token=${accessToken}`
      );
      return response.data.id;
    } catch (error) {
      console.error('Error getting user ID:', error.response?.data || error.message);
      throw new Error('Failed to fetch user ID from Instagram');
    }
  };

  passport.use(new InstagramStrategy({
    clientID: process.env.INSTAGRAM_CLIENT_ID,
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
    callbackURL: process.env.INSTAGRAM_CALLBACK_URL,
    proxy: true, // Important for production
    scope: ['user_profile', 'user_media'], // Required permissions
    state: true // CSRF protection
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Get numeric user ID using Graph API
      const userId = await getInstagramUserId(accessToken);
      
      // Find or create user
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
      console.error('Authentication error:', err);
      return done(err);
    }
  }));

  // Serialization/deserialization
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