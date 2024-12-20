// hooks/usePostModal.js
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useInteractions } from './useInteractions';

export const usePostModal = (posts, setPosts) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [followingUsers, setFollowingUsers] = useState(new Set());
  const [followCounts, setFollowCounts] = useState({});
  const { data: session } = useSession();

  // Use your existing useInteractions hook
  const {
    likedItems,
    savedItems,
    handleLike,
    handleSave,
    setLikedItems,
    setSavedItems
  } = useInteractions(posts, 'all');

  // Update follow statuses when posts change
  useEffect(() => {
    const fetchFollowStatuses = async () => {
      if (!session?.user || !posts?.length) return;

      try {
        const newFollowingUsers = new Set();
        const newFollowCounts = {};

        await Promise.all(
          posts.map(async (post) => {
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

    fetchFollowStatuses();
  }, [posts, session]);

  const handleFollow = async (authorId, e) => {
    e?.stopPropagation();
    if (!session?.user || session.user.id === authorId) return;

    try {
      const response = await fetch(`/api/users/follow/${authorId}`, {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to follow user');
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

      // Update the posts state if setPosts is provided
      if (setPosts) {
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post.author?._id === authorId
              ? { ...post, author: { ...post.author, followersCount: data.followersCount } }
              : post
          )
        );
      }

      // Update selected post if it's the same author
      if (selectedPost?.author?._id === authorId) {
        setSelectedPost(prev => ({
          ...prev,
          author: { ...prev.author, followersCount: data.followersCount }
        }));
      }

      return { success: true, isFollowing: data.isFollowing, followersCount: data.followersCount };
    } catch (error) {
      console.error('Error following user:', error);
      return { success: false, error: error.message };
    }
  };

  const handlePostInteraction = async (postId, interactionType) => {
    const handler = interactionType === 'like' ? handleLike : handleSave;
    const result = await handler(postId);

    if (result.success && setPosts) {
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === postId
            ? {
                ...post,
                likes: interactionType === 'like' ? result.likes : post.likes,
                savedCount: interactionType === 'save' ? result.savedCount : post.savedCount
              }
            : post
        )
      );

      // Update selected post if it's the same one
      if (selectedPost?._id === postId) {
        setSelectedPost(prev => ({
          ...prev,
          likes: interactionType === 'like' ? result.likes : prev.likes,
          savedCount: interactionType === 'save' ? result.savedCount : prev.savedCount
        }));
      }
    }

    return result;
  };

  const openModal = (post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
    document.body.style.overflow = 'auto';
  };

  return {
    isModalOpen,
    selectedPost,
    followingUsers,
    followCounts,
    likedItems,
    savedItems,
    handleLike: (postId, e) => handlePostInteraction(postId, 'like', e),
    handleSave: (postId, e) => handlePostInteraction(postId, 'save', e),
    handleFollow,
    openModal,
    closeModal,
    setSelectedPost
  };
};