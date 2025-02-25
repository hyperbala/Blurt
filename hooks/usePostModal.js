// hooks/usePostModal.js
import { useState, useCallback } from 'react';

export const usePostModal = (searchResults, setSearchResults) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [followingUsers, setFollowingUsers] = useState(new Set());
  const [likedItems, setLikedItems] = useState(new Set());
  const [savedItems, setSavedItems] = useState(new Set());

  const openModal = useCallback((post) => {
    console.log('Opening modal with post:', post); // Debug log
    setSelectedPost(post);
    setIsModalOpen(true);
    
    // Initialize the like/save states based on the post's current state
    if (post.isLiked) {
      setLikedItems(prev => new Set([...prev, post._id || post.id]));
    }
    if (post.isSaved) {
      setSavedItems(prev => new Set([...prev, post._id || post.id]));
    }
  }, []);

  const handleLike = async (postId, e) => {
    e?.stopPropagation();
    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to like post');
      const data = await res.json();

      // Update search results
      setSearchResults(prev => 
        prev.map(post => 
          post._id === postId || post.id === postId
            ? { ...post, likes: data.likes, isLiked: data.isLiked }
            : post
        )
      );

      // Update selected post
      setSelectedPost(prev => {
        if (prev._id === postId || prev.id === postId) {
          return { ...prev, likes: data.likes, isLiked: data.isLiked };
        }
        return prev;
      });

      // Update liked items set
      setLikedItems(prev => {
        const newSet = new Set(prev);
        if (data.isLiked) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });

      return { success: true, likes: data.likes, isLiked: data.isLiked };
    } catch (error) {
      console.error('Error liking post:', error);
      return { success: false };
    }
  };

  const handleSave = async (postId, e) => {
    e?.stopPropagation();
    try {
      const res = await fetch(`/api/posts/${postId}/save`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to save post');
      const data = await res.json();

      // Update search results
      setSearchResults(prev => 
        prev.map(post => 
          post._id === postId || post.id === postId
            ? { ...post, isSaved: data.isSaved }
            : post
        )
      );

      // Update selected post
      setSelectedPost(prev => {
        if (prev._id === postId || prev.id === postId) {
          return { ...prev, isSaved: data.isSaved };
        }
        return prev;
      });

      // Update saved items set
      setSavedItems(prev => {
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
    try {
      const response = await fetch(`/api/users/follow/${authorId}`, {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to follow user');
      const data = await response.json();

      // Update following users set
      setFollowingUsers(prev => {
        const newSet = new Set(prev);
        if (data.isFollowing) {
          newSet.add(authorId);
        } else {
          newSet.delete(authorId);
        }
        return newSet;
      });

      return { success: true, isFollowing: data.isFollowing };
    } catch (error) {
      console.error('Error following user:', error);
      return { success: false };
    }
  };


  return {
    isModalOpen,
    selectedPost,
    followingUsers,
    likedItems,
    savedItems,
    handleLike,
    handleSave,
    handleFollow,
    openModal,
    closeModal: useCallback(() => {
      setIsModalOpen(false);
      setSelectedPost(null);
    }, []),
  };
};