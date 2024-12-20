// hooks/useInteractions.js
import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";

export const useInteractions = (items, type = 'post') => {
  const [likedItems, setLikedItems] = useState(new Set());
  const [savedItems, setSavedItems] = useState(new Set());
  const { data: session } = useSession();

  const getEndpoint = (itemId, action) => {
    // For the feed, check the item's type
    if (type === 'all') {
      const item = items.find(i => i._id === itemId);
      const itemType = item?.type === 'question' ? 'questions' : 'posts';
      return `/api/${itemType}/${itemId}/${action}`;
    }
    
    // For specific types
    const baseEndpoint = type === 'question' ? 'questions' : 'posts';
    return `/api/${baseEndpoint}/${itemId}/${action}`;
  };

  const handleLike = async (itemId, e) => {
    e?.stopPropagation();
    if (!session?.user) return;

    try {
      const endpoint = getEndpoint(itemId, 'like');
      console.log('Like endpoint:', endpoint); // Debug log
      
      const response = await fetch(endpoint, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to like item');
      }

      const data = await response.json();
      console.log('Like response:', data); // Debug log

      // Update liked items state
      setLikedItems(prev => {
        const newSet = new Set(prev);
        if (data.hasLiked || data.isLiked) {
          newSet.add(itemId);
        } else {
          newSet.delete(itemId);
        }
        return newSet;
      });

      return {
        success: true,
        likes: data.likes,
        isLiked: data.hasLiked || data.isLiked
      };
    } catch (error) {
      console.error('Error liking item:', error);
      return { success: false, error: error.message };
    }
  };

  const handleSave = async (itemId, e) => {
    e?.stopPropagation();
    if (!session?.user) return;

    try {
      const endpoint = getEndpoint(itemId, 'save');
      console.log('Save endpoint:', endpoint); // Debug log

      const response = await fetch(endpoint, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to save item');
      }

      const data = await response.json();
      console.log('Save response:', data); // Debug log

      // Update saved items state
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
        savedCount: data.savedCount,
        isSaved: data.isSaved
      };
    } catch (error) {
      console.error('Error saving item:', error);
      return { success: false, error: error.message };
    }
  };

  // Initialize liked and saved states from items data
  useEffect(() => {
    if (!items?.length || !session?.user) return;

    const newLikedItems = new Set();
    const newSavedItems = new Set();

    items.forEach(item => {
      // Handle both array and single value cases for likedBy and savedBy
      const likedBy = Array.isArray(item.likedBy) ? item.likedBy : [item.likedBy];
      const savedBy = Array.isArray(item.savedBy) ? item.savedBy : [item.savedBy];

      if (likedBy.some(id => id?.toString() === session.user.id)) {
        newLikedItems.add(item._id);
      }
      if (savedBy.some(id => id?.toString() === session.user.id)) {
        newSavedItems.add(item._id);
      }
    });

    setLikedItems(newLikedItems);
    setSavedItems(newSavedItems);
  }, [items, session]);

  return {
    likedItems,
    savedItems,
    handleLike,
    handleSave,
    setLikedItems,
    setSavedItems
  };
};