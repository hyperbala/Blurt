'use client'

import { Heart, Bookmark, Globe2, MessageCircle } from 'react-feather';
import User from './User';

const PostCard = ({
  post,
  session,
  likedPosts,
  savedPosts,
  followingUsers,
  handleCardClick,
  handleFollow,
  handleLike,
  handleSave,
}) => {
  return (
    <div
      className="bg-white border rounded-xl shadow-sm mb-4 hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={() => handleCardClick(post)}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <User
              name={post.author?.name || 'Anonymous'}
              description={
                post.author?.name ? `@${post.author.name.toLowerCase().replace(' ', '')}` : '@anonymous'
              }
              avatarProps={{
                src: post.author?.avatar || '/ashiq.jpeg',
              }}
            />
            <div className="flex items-center space-x-1 bg-green-50 rounded-full px-2 py-1">
              <Globe2 className="w-3 h-3 text-green-600" />
              <span className="text-xs text-green-700">Public</span>
            </div>
          </div>
          <button
            className={`px-4 py-1.5 text-sm font-medium ${
              session?.user?.id === post.author?._id
                ? 'text-gray-400 border-gray-400 cursor-not-allowed'
                : followingUsers.has(post.author?._id)
                ? 'text-white bg-green-600 border-green-600'
                : 'text-green-600 border-green-600 hover:bg-green-50'
            } border rounded-full transition-colors duration-200`}
            onClick={(e) => handleFollow(post.author?._id, e)}
            disabled={!session?.user || session.user.id === post.author?._id}
          >
            {session?.user?.id === post.author?._id
              ? 'You'
              : followingUsers.has(post.author?._id)
              ? 'Following'
              : 'Follow'}
          </button>
        </div>

        <h2 className="text-xl font-semibold mb-2 text-gray-800">{post.title || 'Untitled Post'}</h2>

        {post.image && (
          <div className="relative aspect-video mb-4 bg-gray-50 rounded-lg overflow-hidden">
            <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        <p className="text-gray-600 mb-4 line-clamp-3">{post.content}</p>

        <div className="flex items-center justify-between text-sm text-gray-500 p-4">
          <span>{new Date(post.createdAt).toLocaleString()}</span>
          <div className="flex items-center space-x-4">
            <button
              onClick={(e) => handleLike(post._id, e)}
              className={`flex items-center gap-2 transition-colors duration-300 ease-in-out ${
                likedPosts.has(post._id) ? 'text-green-500' : 'text-gray-500'
              }`}
              disabled={!session}
            >
              <Heart
                className={`h-5 w-5 transition-all duration-300 ${
                  likedPosts.has(post._id) ? 'fill-green-500 stroke-green-500' : ''
                }`}
              />
              <span>{post.likes || 0}</span>
            </button>

            <button
              className={`flex items-center space-x-1 ${
                savedPosts.has(post._id) ? 'text-green-600' : 'hover:text-green-600'
              }`}
              onClick={(e) => handleSave(post._id, e)}
            >
              <Bookmark className={`w-4 h-4 ${savedPosts.has(post._id) ? 'fill-current' : ''}`} />
            </button>
            <button className="flex items-center space-x-1 hover:text-green-600">
              <MessageCircle className="w-4 h-4" />
              <span>{post.comments?.length || 0}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
