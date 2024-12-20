import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false // Changed from required: true to required: false
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: false,
  },
  profilePic: {
    type: String,
    default: '',
  },
  image: {
    type: String,
    default: '/ashiq.jpeg'
  },
  username: {
    type: String,
    required: false // Make sure username is also not required initially
  },
  likedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  savedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  createdAt: { type: Date, default: Date.now },
  
  googleId: {
    type: String,
    sparse: true
  },
  hasCompletedOnboarding: {
    type: Boolean,
    default: false
  }

});

// Clear any existing model to prevent OverwriteModelError
mongoose.models = {};

export default mongoose.model('User', UserSchema);
