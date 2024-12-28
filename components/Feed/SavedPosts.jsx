// components/Feed/SavedPosts.jsx
'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import PostCard from '../Post/PostCard';
import PostModal from '../Post/PostModal';
import ActionButtons from '../Profile/ActionButtons';


const SavedPosts = () => {
  const [items, setItems] = useState([]);
  const [sortBy, setSortBy] = useState('new'); // Add this state
  const [likedItems, setLikedItems] = useState(new Set());
  const [savedItems, setSavedItems] = useState(new Set());
  const [followingUsers, setFollowingUsers] = useState(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const { data: session } = useSession();

  useEffect(() => {
    fetchSavedItems();
  }, []);

  useEffect(() => {
    const fetchFollowStatuses = async () => {
      if (!session?.user) return;

      try {
        const newFollowingUsers = new Set();
        await Promise.all(
          items.map(async (item) => {
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
  }, [items, session]);
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
    setItems(sortedItems);
  };

  const handleSortChange = (sortType) => {
    setSortBy(sortType);
    sortItems(items, sortType);
  };
  const fetchSavedItems = async () => {
    try {
      const res = await fetch('/api/posts/saved');
      if (res.ok) {
        const data = await res.json();
        sortItems(data, sortBy); // Sort the items immediately after fetching
        const newLikedItems = new Set(data.filter(item => item.isLiked).map(item => item._id));
        const newSavedItems = new Set(data.map(item => item._id));
        setLikedItems(newLikedItems);
        setSavedItems(newSavedItems);
      }
    } catch (error) {
      console.error('Error fetching saved items:', error);
    }
  };

  const handleLike = async (itemId, e) => {
    e?.stopPropagation();
    try {
      const res = await fetch(`/api/posts/${itemId}/like`, {
        method: 'POST',
      });

      if (res.ok) {
        const { likes, hasLiked } = await res.json();
        setItems(items => items.map(item =>
          item._id === itemId ? { ...item, likes } : item
        ));

        setLikedItems(prev => {
          const newSet = new Set(prev);
          if (hasLiked) {
            newSet.add(itemId);
          } else {
            newSet.delete(itemId);
          }
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error liking item:', error);
    }
  };

  const handleSave = async (itemId, e) => {
    e?.stopPropagation();
    try {
      const res = await fetch(`/api/posts/${itemId}/save`, {
        method: 'POST',
      });

      if (res.ok) {
        setItems(items => items.filter(item => item._id !== itemId));
        setSavedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error unsaving item:', error);
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

  const handleCardClick = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
    document.body.style.overflow = 'auto';
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <ActionButtons onSortChange={handleSortChange} />
      {items.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No saved items yet.</p>
        </div>
      ) : (
        items.map((item) => (
          <PostCard
            key={item._id}
            item={item}
            session={session}
            likedItems={likedItems}
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
          likedPosts={likedItems}
          savedPosts={savedItems}
          handleLike={handleLike}
          handleSave={handleSave}
          setPosts={setItems}
          followingUsers={followingUsers}
          handleFollow={handleFollow}
        />
      )}
    </div>
  );
};

export default SavedPosts;