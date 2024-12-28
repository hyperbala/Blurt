'use client'

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import PostCard from '../Post/PostCard';
import PostModal from '../Post/PostModal';
import ActionButtons from '../Profile/ActionButtons';

const ProfilePosts = ({ userId }) => {
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [savedPosts, setSavedPosts] = useState(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [followingUsers, setFollowingUsers] = useState(new Set());
  
  const [sortBy, setSortBy] = useState('new');

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
      sortPosts(data, sortBy); // Sort the posts immediately after fetching
      
      // Set initial liked and saved posts
      setLikedPosts(new Set(
        data.filter(p => p.isLiked).map(p => p._id)
      ));
      setSavedPosts(new Set(
        data.filter(p => p.isSaved).map(p => p._id)
      ));
    } catch (error) {
      console.error('Error fetching user posts:', error);
    }
  }, [userId, session?.user?.id, sortBy]); // Add sortBy as a dependency

  // Fetch follow statuses
  useEffect(() => {
    const fetchFollowStatuses = async () => {
      if (!session?.user) return;

      try {
        const newFollowingUsers = new Set();
        await Promise.all(
          posts.map(async (post) => {
            if (post.author?._id) {
              const response = await fetch(`/api/users/follow/${post.author._id}`);
              if (response.ok) {
                const { isFollowing } = await response.json();
                if (isFollowing) {
                  newFollowingUsers.add(post.author._id);
                }
              }
            }
          })
        );
        setFollowingUsers(newFollowingUsers);
      } catch (error) {
        console.error('Error checking follow statuses:', error);
      }
    };

    if (session?.user) {
      fetchFollowStatuses();
    }
  }, [posts, session]);


  useEffect(() => {
    if (userId || status === 'authenticated') {
      fetchUserPosts();
    }
  }, [userId, status, session, fetchUserPosts, sortBy]); // Add sortBy as a dependency
  const handleLike = async (postId, e) => {
    e?.stopPropagation();
    if (!session?.user?.id) return;

    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Failed to like post');
      }

      const data = await res.json();
      
      setPosts(prevPosts =>
        prevPosts.map(p =>
          p._id === postId
            ? { ...p, likes: data.likes, isLiked: data.isLiked }
            : p
        )
      );

      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (data.isLiked) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });

      return { success: true, likes: data.likes };
    } catch (error) {
      console.error('Error liking post:', error);
      return { success: false };
    }
  };

  const handleSave = async (postId, e) => {
    e?.stopPropagation();
    if (!session?.user?.id) return;

    try {
      const res = await fetch(`/api/posts/${postId}/save`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Failed to save post');
      }

      const data = await res.json();
      
      setSavedPosts(prev => {
        const newSet = new Set(prev);
        if (data.isSaved) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });

      return { success: true, isSaved: data.isSaved };
    } catch (error) {
      console.error('Error saving post:', error);
      return { success: false };
    }
  };

  const handleFollow = async (authorId, e) => {
    e?.stopPropagation();
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
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleCardClick = (post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
    document.body.style.overflow = 'auto';
  };
  return (
    <div className="w-full max-w-2xl mx-auto">
      <ActionButtons onSortChange={handleSortChange} />
      {posts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No posts available yet.</p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post._id}
            item={post}
            session={session}
            likedItems={likedPosts}
            savedItems={savedPosts}
            followingUsers={followingUsers}
            handleLike={handleLike}
            handleSave={handleSave}
            handleFollow={handleFollow}
            onClick={() => handleCardClick(post)}
            isQuestion={false}
          />
        ))
      )}
  
      {isModalOpen && selectedPost && (
        <PostModal
          isOpen={isModalOpen}
          onClose={closeModal}
          post={selectedPost}
          session={session}
          likedPosts={likedPosts}
          savedPosts={savedPosts}
          handleLike={handleLike}
          handleSave={handleSave}
          setPosts={setPosts}
          followingUsers={followingUsers}
          handleFollow={handleFollow}
          isQuestion={false}
        />
      )}
    </div>
  );
};

export default ProfilePosts;