const axios = require('axios');
const InstagramStrategy = require('passport-instagram').Strategy;
const User = require('../models/User');

/**
 * Get Instagram user ID using Graph API
 * @param {string} accessToken - Instagram access token
 * @returns {Promise<string>} - Instagram user ID
 */
const getInstagramUserId = async (accessToken) => {
  try {
    const response = await axios.get(
      `https://graph.instagram.com/me?fields=id,username,account_type,media_count`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        timeout: 5000
      }
    );

    if (!response.data.id) {
      throw new Error('No user ID returned from Instagram API');
    }

    return response.data.id;
  } catch (error) {
    console.error('Error getting Instagram user ID:', {
      error: error.response?.data || error.message,
      stack: error.stack
    });
    throw new Error('Failed to fetch user data from Instagram');
  }
};

/**
 * Get additional Instagram user profile data
 * @param {string} accessToken - Instagram access token
 * @returns {Promise<Object>} - User profile data
 */
const getInstagramProfile = async (accessToken) => {
  try {
    const response = await axios.get(
      `https://graph.instagram.com/me?fields=id,username,account_type,media_count`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        timeout: 5000
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting Instagram profile:', error);
    return null;
  }
};

/**
 * Configure Instagram authentication strategy
 * @param {Passport} passport - Passport instance
 */
module.exports = function(passport) {
  passport.use(
    new InstagramStrategy(
      {
        clientID: process.env.INSTAGRAM_CLIENT_ID,
        clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
        callbackURL: process.env.INSTAGRAM_CALLBACK_URL,
        proxy: true,
        passReqToCallback: true,
        scope: ['user_profile', 'user_media'],
        state: true,
        enableProof: true
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          // Verify the access token is valid
          const userId = await getInstagramUserId(accessToken);
          const instagramProfile = await getInstagramProfile(accessToken);

          if (!userId) {
            throw new Error('Instagram authentication failed - no user ID');
          }

          // Prepare user data
          const userData = {
            instagramId: userId,
            username: profile.username || instagramProfile?.username,
            displayName: profile.displayName || profile.username,
            accessToken: accessToken,
            refreshToken: refreshToken || null,
            profileData: instagramProfile || {},
            lastLogin: new Date()
          };

          // Find or create user
          let user = await User.findOneAndUpdate(
            { instagramId: userId },
            userData,
            {
              upsert: true,
              new: true,
              setDefaultsOnInsert: true,
              runValidators: true
            }
          );

          // Log successful authentication
          console.info(`User authenticated: ${user.username} (${user.instagramId})`);

          return done(null, user);
        } catch (err) {
          console.error('Instagram authentication error:', {
            error: err.message,
            stack: err.stack,
            profile: profile
          });
          return done(err);
        }
      }
    )
  );

  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, {
      id: user.id,
      instagramId: user.instagramId,
      username: user.username
    });
  });

  // Deserialize user from session
  passport.deserializeUser(async (serializedUser, done) => {
    try {
      const user = await User.findById(serializedUser.id);
      if (!user) {
        return done(new Error('User not found'));
      }
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
};
