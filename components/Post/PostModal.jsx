// components/Post/PostModal.jsx
'use client'

import React, { useEffect } from 'react';
import { User } from '@nextui-org/react';
import Link from 'next/link';
import { Heart, Bookmark, Share2, MessageCircle, X, ThumbsUp, Globe2 } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';

import CommentSection from './CommentSection';


const PostModal = ({
  isOpen,
  onClose,
  post,
  session,
  handleLike,
  handleSave,
  likedPosts,
  savedPosts,
  followingUsers,
  handleFollow,
}) => {
  if (!isOpen || !post) return null;
  useEffect(() => {
    const fetchPostWithComments = async () => {
      try {
        const response = await fetch(`/api/posts/${post._id}`);
        if (response.ok) {
          const updatedPost = await response.json();
          setSelectedPost(updatedPost);
        }
      } catch (error) {
        console.error('Error fetching post comments:', error);
      }
    };

    if (isOpen && post?._id) {
      fetchPostWithComments();
    }
  }, [isOpen, post?._id]);
  console.log(post,"s");
  useEffect(() => {
    // This is a backup to ensure scroll is properly managed
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);


  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/20">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Post Details</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Link
                  href={`/profile/${post.author?._id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="hover:opacity-80 transition-opacity"
                >
                  <User
                    name={post.author?.name || "Anonymous"}
                    description={post.author?.username ? `@${post.author.username.toLowerCase().replace(' ', '')}` : '@anonymous'}
                    avatarProps={{
                      src: post.author?.image || "https://i.pravatar.cc/150?u=anonymous"
                    }}
                  />
                </Link>
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

            {/* Post Content */}
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">{post.title}</h2>
            {post.image && (
              <div className="relative aspect-video mb-4 bg-gray-50 rounded-lg overflow-hidden">
                <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
              </div>
            )}
            <p className="text-gray-700 mb-6 leading-relaxed">{post.content}</p>

            {/* Post Actions */}
            <div className="flex items-center justify-between pb-6 border-b">
              <div className="flex space-x-6">
                <button
                  className={`flex items-center space-x-2 ${likedPosts.has(post._id) ? 'text-green-600' : 'text-gray-600 hover:text-green-600'
                    }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike(post._id, e);
                  }}
                  disabled={!session}
                >
                  <Heart
                    className={`w-5 h-5 ${likedPosts.has(post._id) ? 'fill-current' : ''
                      }`}
                  />
                  <span>{post.likes || 0}</span>
                </button>
                <button
                  className={`flex items-center space-x-2 ${savedPosts.has(post._id) ? 'text-green-600' : 'text-gray-600 hover:text-green-600'
                    }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSave(post._id, e);
                  }}
                >
                  <Bookmark
                    className={`w-5 h-5 ${savedPosts.has(post._id) ? 'fill-current' : ''
                      }`}
                  />
                  <span>Save</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors duration-200">
                  <Share2 className="w-5 h-5" />
                  <span>Share</span>
                </button>
              </div>
              <span className="text-sm text-gray-500">
                {formatDistanceToNowStrict(new Date(post.createdAt), { addSuffix: true })}
              </span>
            </div>

            {/* Comments Section */}
            {console.log(post.type)}
            
            <CommentSection
              id={post._id || post.id}
              type={post.type || 'question'} 
              session={session}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostModal;