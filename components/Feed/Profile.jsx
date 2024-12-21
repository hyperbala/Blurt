//components/feed/Profile.jsx

'use client'

import React, { useEffect, useState, useCallback } from 'react';
import { User } from '@nextui-org/react';
import { Heart, Bookmark, Share2, MessageCircle, X, Globe2 } from 'lucide-react';
import ActionButtons from '../Profile/ActionButtons';
import { useSession } from 'next-auth/react';
import Image from 'next/image';


const ProfilePosts = ({ userId }) => {
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comment, setComment] = useState('');
  const [sortBy, setSortBy] = useState('new');

  const fetchUserPosts = useCallback(async () => {
    try {
      let endpoint;

      if (userId) {
        console.log('Fetching posts for specific user:', userId);
        endpoint = `/api/posts/user/${userId}`;
      } else if (session?.user?.id) {
        console.log('Fetching posts for logged-in user:', session.user.id);
        endpoint = '/api/posts/user';
      } else {
        console.log('No user ID available');
        return;
      }

      const res = await fetch(endpoint);

      if (!res.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await res.json();
      sortPosts(data, sortBy);
    } catch (error) {
      console.error('Error fetching user posts:', error);
    }
  }, [userId, session?.user?.id, sortBy]);

  useEffect(() => {
    if (userId || status === 'authenticated') {
      fetchUserPosts();
    }
  }, [userId, status, session, fetchUserPosts]);

  const sortPosts = (postsToSort, sortType) => {
    let sortedPosts = [...postsToSort];
    switch (sortType) {
      case 'new':
        sortedPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'old':
        sortedPosts.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'liked':
        sortedPosts.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      default:
        break;
    }
    setPosts(sortedPosts);
  };

  const handleSortChange = (sortType) => {
    setSortBy(sortType);
    sortPosts(posts, sortType);
  };

  const handleLike = async (postId, e) => {
    e.stopPropagation();
    if (!session?.user?.id) return;

    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
      });

      if (res.ok) {
        const { likes, isLiked } = await res.json();
        setPosts(posts.map(post =>
          post._id === postId
            ? { ...post, likes, isLiked }
            : post
        ));

        if (selectedPost?._id === postId) {
          setSelectedPost(prev => ({ ...prev, likes, isLiked }));
        }
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleSave = async (postId, e) => {
    e.stopPropagation();
    if (!session?.user?.id) return;

    try {
      const res = await fetch(`/api/posts/${postId}/save`, {
        method: 'POST',
      });

      if (res.ok) {
        const { isSaved } = await res.json();
        setPosts(posts.map(post =>
          post._id === postId
            ? { ...post, isSaved }
            : post
        ));

        if (selectedPost?._id === postId) {
          setSelectedPost(prev => ({ ...prev, isSaved }));
        }
      }
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  const handleCardClick = (post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
    setComment('');
  };

  const handleCommentSubmit = async (postId) => {
    if (!comment.trim() || !session?.user?.id) return;

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: comment }),
      });

      if (res.ok) {
        const newComment = await res.json();
        setPosts(posts.map(post =>
          post._id === postId
            ? {
              ...post,
              comments: [...(post.comments || []), newComment],
              commentsCount: (post.commentsCount || 0) + 1
            }
            : post
        ));
        setSelectedPost(prevPost => ({
          ...prevPost,
          comments: [...(prevPost.comments || []), newComment],
          commentsCount: (prevPost.commentsCount || 0) + 1
        }));
        setComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };



  return (
    <div className="w-full max-w-2xl mx-auto">
      <ActionButtons onSortChange={handleSortChange} />
      {posts.length === 0 ? (
        <p className="text-gray-600 text-center py-8">No posts available yet.</p>
      ) : (
        posts.map((post) => (
          <div
            key={post._id}
            className="bg-white border rounded-xl shadow-sm mb-4 hover:shadow-md transition-all duration-200 cursor-pointer"
            onClick={() => handleCardClick(post)}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <User
                    name={post.author?.name || "Anonymous"}
                    description={
                      <div className="flex items-center text-sm text-gray-500">
                        <span>@{post.author?.username || 'anonymous'}</span>
                        <span className="mx-1">•</span>
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                    }
                    avatarProps={{
                      src: post.author?.image || "/default-avatar.png",
                      className: "w-10 h-10"
                    }}
                  />
                </div>
                <div className="flex items-center space-x-1 bg-green-50 rounded-full px-2 py-1">
                  <Globe2 className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-700">Public</span>
                </div>
              </div>

              {post.title && (
                <h2 className="text-xl font-semibold mb-2 text-gray-800">
                  {post.title}
                </h2>
              )}

              {post.image && (
                <div className="relative aspect-video mb-4 bg-gray-50 rounded-lg overflow-hidden">
                  <Image
                    src={post.image}
                    alt={post.title || 'Post image'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              )}

              <p className="text-gray-600 mb-4 line-clamp-3">{post.content}</p>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <button
                    className={`flex items-center space-x-1 transition-colors ${post.isLiked ? 'text-green-600' : 'hover:text-green-600'
                      }`}
                    onClick={(e) => handleLike(post._id, e)}
                  >
                    <Heart
                      className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`}
                    />
                    <span>{post.likes || 0}</span>
                  </button>

                  <button
                    className={`flex items-center space-x-1 transition-colors ${post.isSaved ? 'text-green-600' : 'hover:text-green-600'
                      }`}
                    onClick={(e) => handleSave(post._id, e)}
                  >
                    <Bookmark
                      className={`w-4 h-4 ${post.isSaved ? 'fill-current' : ''}`}
                    />
                  </button>

                  <button className="flex items-center space-x-1 hover:text-green-600">
                    <MessageCircle className="w-4 h-4" />
                    <span>{post.comments?.length || 0}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      )}

      {isModalOpen && selectedPost && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/50">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between p-4 border-b z-10">
              <h3 className="text-lg font-semibold text-gray-800">Post Details</h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <User
                  name={selectedPost.author?.name || "Anonymous"}
                  description={
                    <div className="flex items-center text-sm text-gray-500">
                      <span>@{selectedPost.author?.username || 'anonymous'}</span>
                      <span className="mx-1">•</span>
                      <span>{new Date(selectedPost.createdAt).toLocaleDateString()}</span>
                    </div>
                  }
                  avatarProps={{
                    src: selectedPost.author?.image || "/default-avatar.png",
                    className: "w-10 h-10"
                  }}
                />
              </div>

              {selectedPost.title && (
                <h2 className="text-2xl font-semibold mb-4">{selectedPost.title}</h2>
              )}

              {selectedPost.image && (
                <div className="relative aspect-video mb-4 bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={selectedPost.image}
                    alt={selectedPost.title || 'Post image'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              )}

              <p className="text-gray-700 mb-6 whitespace-pre-wrap">
                {selectedPost.content}
              </p>

              <div className="flex items-center space-x-6 mb-6">
                <button
                  onClick={(e) => handleLike(selectedPost._id, e)}
                  className={`flex items-center space-x-2 ${selectedPost.isLiked ? 'text-green-600' : 'text-gray-600 hover:text-green-600'
                    }`}
                >
                  <Heart className={`w-5 h-5 ${selectedPost.isLiked ? 'fill-current' : ''}`} />
                  <span>{selectedPost.likes || 0} Likes</span>
                </button>

                <button
                  onClick={(e) => handleSave(selectedPost._id, e)}
                  className={`flex items-center space-x-2 ${selectedPost.isSaved ? 'text-green-600' : 'text-gray-600 hover:text-green-600'
                    }`}
                >
                  <Bookmark className={`w-5 h-5 ${selectedPost.isSaved ? 'fill-current' : ''}`} />
                  <span>Save</span>
                </button>

                <button className="flex items-center space-x-2 text-gray-600 hover:text-green-600">
                  <Share2 className="w-5 h-5" />
                  <span>Share</span>
                </button>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-lg font-semibold mb-4">Comments</h4>
                <div className="space-y-4 mb-4">
                  {selectedPost.comments?.length > 0 ? (
                    selectedPost.comments.map((comment) => (
                      <div key={comment._id} className="border-b pb-3">
                        <User
                          name={comment.author?.name || "Anonymous"}
                          description={
                            <div className="flex items-center text-sm text-gray-500">
                              <span>@{comment.author?.username || 'anonymous'}</span>
                              <span className="mx-1">•</span>
                              <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                            </div>
                          }
                          avatarProps={{
                            src: comment.author?.image || "/default-avatar.png",
                            className: "w-8 h-8"
                          }}
                        />
                        <p className="text-gray-600 mt-1 ml-11">{comment.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No comments yet</p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <button
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleCommentSubmit(selectedPost._id)}
                    disabled={!comment.trim()}
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePosts;
