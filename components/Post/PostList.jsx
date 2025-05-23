// components/Post/PostList.jsx
'use client'

import React, { useState, useEffect } from 'react';
import { User } from '@nextui-org/react';
import { Heart, Bookmark, Share2, MessageCircle, X, Globe2 } from 'lucide-react';
import { useTopicContext } from '../../contexts/TopicContext';
import { useSession } from "next-auth/react";
import PostModal from './PostModal';
import { useInteractions } from '../../hooks/useInteractions';
import { formatDistanceToNowStrict } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';

const toggleScroll = (disable) => {
  if (disable) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = 'auto';
  }
};


const PostList = ({ type = 'all', showAll = true }) => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followingUsers, setFollowingUsers] = useState(new Set());
  const [followCounts, setFollowCounts] = useState({});

  const { selectedTopic, setSelectedTopic } = useTopicContext();
  const { data: session } = useSession();
  const {
    likedItems: likedPosts,
    savedItems: savedPosts,
    handleLike,
    handleSave,
    setLikedItems,
    setSavedItems
  } = useInteractions(filteredPosts, type);

  const handlePostLike = async (postId, e) => {
    e.stopPropagation();
    if (!session?.user) return;
  
    const result = await handleLike(postId, e);
    if (result.success) {
      // Update posts state with new likes count
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === postId
            ? { 
                ...post, 
                likes: result.likes,
                likedBy: result.isLiked 
                  ? [...(Array.isArray(post.likedBy) ? post.likedBy : []), session.user.id]
                  : (Array.isArray(post.likedBy) ? post.likedBy : []).filter(id => id !== session.user.id)
              }
            : post
        )
      );
  
      // Update selected post if open in modal
      if (selectedPost && selectedPost._id === postId) {
        setSelectedPost(prev => ({
          ...prev,
          likes: result.likes,
          likedBy: result.isLiked
            ? [...(Array.isArray(prev.likedBy) ? prev.likedBy : []), session.user.id]
            : (Array.isArray(prev.likedBy) ? prev.likedBy : []).filter(id => id !== session.user.id)
        }));
      }return {
        success: true,
        likes: result.likes,
        isLiked: result.isLiked
      };
    }
    return { success: false };
  };  
  
  const handlePostSave = async (postId, e) => {
    e.stopPropagation();
    if (!session?.user) return;
  
    const result = await handleSave(postId, e);
    if (result.success) {
      // Update posts state with new saved count
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === postId
            ? { 
                ...post, 
                savedCount: result.savedCount,
                savedBy: result.isSaved 
                  ? [...(Array.isArray(post.savedBy) ? post.savedBy : []), session.user.id]
                  : (Array.isArray(post.savedBy) ? post.savedBy : []).filter(id => id !== session.user.id)
              }
            : post
        )
      );
  
      // Update selected post if open in modal
      if (selectedPost && selectedPost._id === postId) {
        setSelectedPost(prev => ({
          ...prev,
          savedCount: result.savedCount,
          savedBy: result.isSaved
            ? [...(Array.isArray(prev.savedBy) ? prev.savedBy : []), session.user.id]
            : (Array.isArray(prev.savedBy) ? prev.savedBy : []).filter(id => id !== session.user.id)
        }));
      }
    }
  };


  const handleFollow = async (authorId, e) => {
    e.stopPropagation();
    if (!session?.user || session.user.id === authorId) return;

    try {
      const response = await fetch(`/api/users/follow/${authorId}`, {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok) {
        console.error('Error following user:', data.error);
        return;
      }

      setFollowingUsers(prev => {
        const newSet = new Set(prev);
        if (data.isFollowing) {
          newSet.add(authorId);
        } else {
          newSet.delete(authorId);
        }
        return newSet;
      });

      setFollowCounts(prev => ({
        ...prev,
        [authorId]: data.followersCount
      }));

    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleCardClick = (post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
    toggleScroll(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
    toggleScroll(false);
  };


useEffect(() => {
  const fetchPosts = async () => {
    try {
      let url = '/api/feed';
      if (type === 'posts') {
        url = '/api/posts';
      } else if (type === 'questions') {
        url = '/api/questions';
      }

      const response = await fetch(url);
      const data = await response.json();
      setPosts(data);
      setFilteredPosts(data);

      // Initialize liked and saved states from the response data
      if (session?.user) {
        const newLikedPosts = new Set(
          data.filter(post => {
            // Check if the post is liked by the current user
            const likedBy = Array.isArray(post.likedBy) ? post.likedBy : [post.likedBy];
            return likedBy.some(id => id?.toString() === session.user.id);
          }).map(post => post._id)
        );
        
        const newSavedPosts = new Set(
          data.filter(post => {
            // Check if the post is saved by the current user
            const savedBy = Array.isArray(post.savedBy) ? post.savedBy : [post.savedBy];
            return savedBy.some(id => id?.toString() === session.user.id);
          }).map(post => post._id)
        );

        // Update the liked and saved states in useInteractions
        if (handleLike && handleSave) {
          handleLike.setLikedItems?.(newLikedPosts);
          handleSave.setSavedItems?.(newSavedPosts);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setLoading(false);
    }
  };

  fetchPosts();
}, [type, session]);

  // Filter posts based on selected topic
  useEffect(() => {
    if (!selectedTopic) {
      setFilteredPosts(posts);
      return;
    }

    const filtered = posts.filter(post => {
      const content = `${post.title} ${post.content}`.toLowerCase();
      return content.includes(selectedTopic.title.toLowerCase());
    });

    setFilteredPosts(filtered);
  }, [selectedTopic, posts]);

  // Check follow statuses
  useEffect(() => {
    const fetchFollowStatuses = async () => {
      if (!session?.user) return;

      try {
        const newFollowingUsers = new Set();
        const newFollowCounts = {};

        await Promise.all(
          filteredPosts.map(async (post) => {
            if (post.author?._id) {
              const response = await fetch(`/api/users/follow/${post.author._id}`);
              if (response.ok) {
                const { isFollowing, followersCount } = await response.json();
                if (isFollowing) {
                  newFollowingUsers.add(post.author._id);
                }
                newFollowCounts[post.author._id] = followersCount;
              }
            }
          })
        );

        setFollowingUsers(newFollowingUsers);
        setFollowCounts(newFollowCounts);
      } catch (error) {
        console.error('Error checking follow statuses:', error);
      }
    };

    if (session?.user) {
      fetchFollowStatuses();
    }
  }, [filteredPosts, session]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {selectedTopic && (
        <div className="mb-4 p-4 bg-green-50 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-green-700">
              Showing posts related to: <span className="font-semibold">{selectedTopic.title}</span>
            </p>
            <button
              onClick={handleCloseTrending}
              className="flex items-center space-x-2 px-3 py-1.5 text-sm text-green-700 hover:bg-green-100 rounded-lg transition-colors duration-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {filteredPosts.map((post) => (
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
                  description={post.author?.username ? `@${post.author.username.toLowerCase().replace(' ', '')}` : '@anonymous'}
                  avatarProps={{
                    src: post.author?.image
                  }}
                />
                <Link href={`/${post?.type}`}>
                  <div className="flex items-center space-x-1 bg-green-50 rounded-full px-2 py-1">
                    <Globe2 className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-700">{post?.type}</span>
                  </div>
                </Link>
              </div>
              <button
                className={`px-4 py-1.5 text-sm font-medium ${session?.user?.id === post.author?._id
                  ? 'text-gray-400 border-gray-400 cursor-not-allowed'
                  : followingUsers.has(post.author?._id)
                    ? 'text-white bg-green-600 border-green-600'
                    : 'text-green-600 border-green-600 hover:bg-green-50'
                  } border rounded-full transition-colors duration-200`}
                onClick={(e) => handleFollow(post.author?._id, e)}
                disabled={!session?.user || session.user.id === post.author?._id}
              >
                {session?.user?.id === post.author?._id ? 'You' :
                  followingUsers.has(post.author?._id) ? 'Following' : 'Follow'}
              </button>
            </div>

            <h2 className="text-xl font-semibold mb-2 text-gray-800">{post.title || 'Untitled Post'}</h2>

            {post.image && (
              <div className="relative aspect-video mb-4 bg-gray-50 rounded-lg overflow-hidden">
                <Image
                  src={post.image}
                  alt={post.title || 'Post image'}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                  priority={false} // Set to true if this is above the fold
                />

              </div>
            )}

            <p className="text-gray-600 mb-4 line-clamp-3">{post.content}</p>

            <div className="flex items-center justify-between text-sm text-gray-500 p-4">
              <span>{formatDistanceToNowStrict(new Date(post.createdAt), { addSuffix: true })}</span>
              <div className="flex items-center space-x-4">
                <button
                  onClick={(e) => handlePostLike(post._id, e)}
                  className={`flex items-center gap-2 ${likedPosts.has(post._id) ? 'text-green-500' : ''
                    }`}
                >
                  <Heart className={`h-5 w-5 ${likedPosts.has(post._id) ? 'fill-current' : ''
                    }`} />
                  <span>{post.likes || 0}</span>
                </button>

                <button
                  onClick={(e) => handlePostSave(post._id, e)}
                  className={`flex items-center ${savedPosts.has(post._id) ? 'text-green-500' : ''
                    }`}
                >
                  <Bookmark className={`h-5 w-5 ${savedPosts.has(post._id) ? 'fill-current' : ''
                    }`} />
                </button>

                <button className="flex items-center space-x-1 hover:text-green-600">
                  <MessageCircle className="w-4 h-4" />
                  <span>{(post.comments?.length || 0)}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {isModalOpen && selectedPost && (
        <PostModal
          isOpen={isModalOpen}
          onClose={closeModal}
          post={selectedPost}
          session={session}
          likedPosts={likedPosts}
          savedPosts={savedPosts}
          handleLike={handlePostLike}  // Make sure to pass handlePostLike instead of handleLike
          handleSave={handlePostSave}  // Make sure to pass handlePostSave instead of handleSave
                setPosts={setPosts}
          // Add these new props
          followingUsers={followingUsers}
          handleFollow={handleFollow}
        />
        
      )}
      

    </div>
  );
}

export default PostList;