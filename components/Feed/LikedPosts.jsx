// components/Feed/LikedPosts.jsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from "next-auth/react";
import ActionButtons from '../Profile/ActionButtons';
import PostCard from '../Post/PostCard';
import PostModal from '../Post/PostModal';

const toggleScroll = (disable) => {
  if (disable) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = 'auto';
  }
};

const LikedPosts = () => {
  const [likedItems, setLikedItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [likedItemsSet, setLikedItemsSet] = useState(new Set());
  const [savedItems, setSavedItems] = useState(new Set());
  const [sortBy, setSortBy] = useState('new');
  const [loading, setLoading] = useState(true);
  const [followingUsers, setFollowingUsers] = useState(new Set());
  const { data: session } = useSession();

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

  useEffect(() => {
    const fetchFollowStatuses = async () => {
      if (!session?.user) return;

      try {
        const newFollowingUsers = new Set();

        await Promise.all(
          likedItems.map(async (item) => {
            if (item.author?._id) {
              const response = await fetch(`/api/users/follow/${item.author._id}`);
              if (response.ok) {
                const { isFollowing } = await response.json();
                if (isFollowing) {
                  newFollowingUsers.add(item.author._id);
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
  }, [likedItems, session]);

  const fetchLikedItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/liked-posts');
      if (!response.ok) {
        throw new Error('Failed to fetch liked items');
      }
      const data = await response.json();
      sortItems(data, sortBy);
      setLikedItemsSet(new Set(data.map(item => item._id)));
    } catch (error) {
      console.error('Error fetching liked items:', error);
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  useEffect(() => {
    fetchLikedItems();
  }, [fetchLikedItems]);

  const sortItems = (items, sortType) => {
    let sortedItems = [...items];
    switch (sortType) {
      case 'new':
        sortedItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'old':
        sortedItems.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'liked':
        sortedItems.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      default:
        break;
    }
    setLikedItems(sortedItems);
  };

  const handleSortChange = (sortType) => {
    setSortBy(sortType);
    sortItems(likedItems, sortType);
  };

  const handleLike = async (itemId, e) => {
    e?.stopPropagation();
    try {
      const res = await fetch(`/api/posts/${itemId}/like`, {
        method: 'POST',
      });

      if (res.ok) {
        const { likes, hasLiked } = await res.json();
        setLikedItems(likedItems.map(item =>
          item._id === itemId
            ? { ...item, likes }
            : item
        ));

        setLikedItemsSet(prev => {
          const newSet = new Set(prev);
          if (hasLiked) {
            newSet.add(itemId);
          } else {
            newSet.delete(itemId);
          }
          return newSet;
        });

        return { success: true, likes };
      }
    } catch (error) {
      console.error('Error liking item:', error);
      return { success: false };
    }
  };

  const handleSave = async (itemId, e) => {
    e?.stopPropagation();
    try {
      const res = await fetch(`/api/posts/${itemId}/save`, {
        method: 'POST',
      });

      if (res.ok) {
        const { isSaved, savedCount } = await res.json();
        setSavedItems(prev => {
          const newSet = new Set(prev);
          if (isSaved) {
            newSet.add(itemId);
          } else {
            newSet.delete(itemId);
          }
          return newSet;
        });
        return { success: true, savedCount };
      }
    } catch (error) {
      console.error('Error saving item:', error);
      return { success: false };
    }
  };

  const handleCardClick = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
    toggleScroll(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
    toggleScroll(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <ActionButtons onSortChange={handleSortChange} />
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading items...</p>
        </div>
      ) : likedItems.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No liked items yet.</p>
        </div>
      ) : (
        likedItems.map((item) => (
          <PostCard
            key={item._id}
            item={item}
            session={session}
            likedItems={likedItemsSet}
            savedItems={savedItems}
            followingUsers={followingUsers}
            handleLike={handleLike}
            handleSave={handleSave}
            handleFollow={handleFollow}
            onClick={() => handleCardClick(item)}
          />
        ))
      )}

      {isModalOpen && selectedItem && (
        <PostModal
          isOpen={isModalOpen}
          onClose={closeModal}
          post={selectedItem}
          session={session}
          likedPosts={likedItemsSet}
          savedPosts={savedItems}
          handleLike={handleLike}
          handleSave={handleSave}
          setPosts={setLikedItems}
          followingUsers={followingUsers}
          handleFollow={handleFollow}
        />
      )}
    </div>
  );
};

export default LikedPosts;