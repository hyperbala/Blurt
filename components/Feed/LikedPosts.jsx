// components/Feed/LikedPosts.jsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from "next-auth/react";
import ActionButtons from '../Profile/ActionButtons';
import PostCard from '../Post/PostCard';
import PostModal from '../Post/PostModal';
import DeleteModal from '../Post/DeleteModal';

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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const { data: session } = useSession();

  const handleFollow = async (authorId, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
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

  const handleLike = async (itemId, e, isQuestion = false) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!session?.user?.id) return;

    try {
      const endpoint = isQuestion 
        ? `/api/questions/${itemId}/like`
        : `/api/posts/${itemId}/like`;

      const res = await fetch(endpoint, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        
        setLikedItems(prevItems =>
          prevItems.map(item =>
            item._id === itemId
              ? {
                  ...item,
                  likes: data.likes,
                  likedBy: data.isLiked 
                    ? [...(Array.isArray(item.likedBy) ? item.likedBy : []), session.user.id]
                    : (Array.isArray(item.likedBy) ? item.likedBy : []).filter(id => id !== session.user.id)
                }
              : item
          )
        );

        setLikedItemsSet(prev => {
          const newSet = new Set(prev);
          if (data.isLiked) {
            newSet.add(itemId);
          } else {
            newSet.delete(itemId);
          }
          return newSet;
        });

        return {
          success: true,
          likes: data.likes,
          isLiked: data.isLiked
        };
      }
    } catch (error) {
      console.error('Error liking item:', error);
      return { success: false };
    }
  };

  const handleSave = async (itemId, e, isQuestion = false) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!session?.user?.id) return;

    try {
      const endpoint = isQuestion 
        ? `/api/questions/${itemId}/save`
        : `/api/posts/${itemId}/save`;

      const res = await fetch(endpoint, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        
        setSavedItems(prev => {
          const newSet = new Set(prev);
          if (data.isSaved) {
            newSet.add(itemId);
          } else {
            newSet.delete(itemId);
          }
          return newSet;
        });

        return {
          success: true,
          isSaved: data.isSaved,
          savedCount: data.savedCount
        };
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

  const handleDeleteClick = (item, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      const endpoint = itemToDelete.isQuestion 
        ? `/api/questions/${itemToDelete._id}`
        : `/api/posts/${itemToDelete._id}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete ${itemToDelete.isQuestion ? 'question' : 'post'}`);
      }

      setLikedItems(items => items.filter(item => item._id !== itemToDelete._id));
      setLikedItemsSet(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemToDelete._id);
        return newSet;
      });
      setSavedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemToDelete._id);
        return newSet;
      });

      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const fetchLikedItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/liked-posts');
      if (!response.ok) {
        throw new Error('Failed to fetch liked items');
      }
      const data = await response.json();

      const processedData = data.map(item => ({
        ...item,
        likes: typeof item.likes === 'number' ? item.likes : 
               Array.isArray(item.likedBy) ? item.likedBy.length : 0,
        isLiked: true,
        isSaved: item.savedBy?.includes(session?.user?.id) || false,
        isQuestion: item.type === 'question'
      }));

      sortItems(processedData, sortBy);
      
      setLikedItemsSet(new Set(processedData.map(item => item._id)));
      setSavedItems(new Set(
        processedData
          .filter(item => item.isSaved)
          .map(item => item._id)
      ));
    } catch (error) {
      console.error('Error fetching liked items:', error);
    } finally {
      setLoading(false);
    }
  }, [sortBy, session?.user?.id]);

  useEffect(() => {
    fetchLikedItems();
  }, [fetchLikedItems]);


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
            item={{
              ...item,
              likes: typeof item.likes === 'number' ? item.likes : 0,
              isLiked: likedItemsSet.has(item._id),
              isSaved: savedItems.has(item._id)
            }}
            session={session}
            likedItems={likedItemsSet}
            savedItems={savedItems}
            followingUsers={followingUsers}
            handleLike={(id, e) => handleLike(id, e, item.isQuestion)}
            handleSave={(id, e) => handleSave(id, e, item.isQuestion)}
            handleFollow={handleFollow}
            handleDelete={
              session?.user?.id === item.author?._id 
                ? (e) => handleDeleteClick(item, e)
                : undefined
            }
            onClick={() => handleCardClick(item)}
            isQuestion={item.isQuestion}
            isOwnContent={session?.user?.id === item.author?._id}
          />
        ))
      )}

      {isModalOpen && selectedItem && (
        <PostModal
          isOpen={isModalOpen}
          onClose={closeModal}
          post={{
            ...selectedItem,
            likes: typeof selectedItem.likes === 'number' ? selectedItem.likes : 0,
            isLiked: likedItemsSet.has(selectedItem._id),
            isSaved: savedItems.has(selectedItem._id)
          }}
          session={session}
          likedPosts={likedItemsSet}
          savedPosts={savedItems}
          handleLike={(id, e) => handleLike(id, e, selectedItem.isQuestion)}
          handleSave={(id, e) => handleSave(id, e, selectedItem.isQuestion)}
          setPosts={setLikedItems}
          followingUsers={followingUsers}
          handleFollow={handleFollow}
          handleDelete={
            session?.user?.id === selectedItem.author?._id 
              ? (e) => handleDeleteClick(selectedItem, e)
              : undefined
          }
          isQuestion={selectedItem.isQuestion}
        />
      )}

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        itemType={itemToDelete?.isQuestion ? 'question' : 'post'}
      />
    </div>
  );
};

export default LikedPosts;