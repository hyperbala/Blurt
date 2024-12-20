// models/Post.js
import mongoose from 'mongoose';

const replySchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  likes: {
    count: { type: Number, default: 0 },
    likedBy: [{ type: String }] // Store user IDs who liked the reply
  }
});

// Update the comment schema to include likes
const CommentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  likes: {
    count: { type: Number, default: 0 },
    likedBy: [{ type: String }] // Store user IDs who liked the comment
  },
  replies: [replySchema]
});

const PostSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  likes: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: String  // Keep as String since we're storing session.user.id
  }],
  savedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  type: {
    type: String,
    enum: ['post', 'question'],
    default: 'post',
  },
  image: {
    type: String,
    default: null,
  },
  comments: {
    type: [CommentSchema],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true
});

// Check if the model is already defined to prevent OverwriteModelError
const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);

export default Post;