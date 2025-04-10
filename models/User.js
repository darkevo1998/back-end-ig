const mongoose = require('mongoose');
const validator = require('validator');

const UserSchema = new mongoose.Schema({
  instagramId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  displayName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String
  },
  profileData: {
    type: Object,
    default: {}
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
UserSchema.index({ instagramId: 1 });
UserSchema.index({ username: 1 });

// Virtuals
UserSchema.virtual('mediaCount').get(function() {
  return this.profileData?.media_count || 0;
});

const User = mongoose.model('User', UserSchema);

module.exports = User;