// components/Feed/SavedPosts.jsx
'use client';

import React, { useEffect, useState } from 'react';
import { User } from '@nextui-org/react';
import { Heart, Bookmark, Share2, MessageCircle, Globe2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

const SavedPosts = () => {
  const [items, setItems] = useState([]);
  const [likedItems, setLikedItems] = useState(new Set());
  const [savedItems, setSavedItems] = useState(new Set());
  const { data: session } = useSession();

  useEffect(() => {
    fetchSavedItems();
  }, []);

  const fetchSavedItems = async () => {
    try {
      const res = await fetch('/api/posts/saved');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
        // Initialize liked and saved sets
        const newLikedItems = new Set(data.filter(item => item.isLiked).map(item => item._id));
        const newSavedItems = new Set(data.map(item => item._id));
        setLikedItems(newLikedItems);
        setSavedItems(newSavedItems);
      }
    } catch (error) {
      console.error('Error fetching saved items:', error);
    }
  };

  const handleLike = async (itemId, type, e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/${type}/${itemId}/like`, {
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

  const handleUnsave = async (itemId, type, e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/${type}/${itemId}/save`, {
        method: 'POST',
      });

      if (res.ok) {
        // Remove the item from displayed items
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

  return (
    <div className="w-full">
      {items.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No saved items yet.</p>
        </div>
      ) : (
        items.map((item) => (
          <div
            key={item._id}
            className="bg-white border rounded-xl shadow-sm mb-4 hover:shadow-md transition-all duration-200"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <User
                  name={item.author?.name || "Anonymous"}
                  description={item.author?.username ? `@${item.author.username.toLowerCase().replace(' ', '')}` : '@anonymous'}
                  avatarProps={{
                    src: item?.author?.image
                  }}
                />
                <div className="flex items-center space-x-1 bg-green-50 rounded-full px-2 py-1">
                  <Globe2 className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-700">Public</span>
                </div>
              </div>

              <h2 className="text-xl font-semibold mb-2 text-gray-800">{item.title || 'Untitled Item'}</h2>
              
              {item.image && (
                <div className="relative aspect-video mb-4 bg-gray-50 rounded-lg overflow-hidden">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                </div>
              )}
              
              <p className="text-gray-600 mb-4 line-clamp-3">{item.content}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 px-4">
                <span>{new Date(item.createdAt).toLocaleString()}</span>
                <div className="flex items-center space-x-4">
                  <button
                    className={`flex items-center gap-2 ${likedItems.has(item._id) ? 'text-green-600' : 'hover:text-green-600'}`}
                    onClick={(e) => handleLike(item._id, item.type, e)}
                  >
                    <Heart className={`w-4 h-4 ${likedItems.has(item._id) ? 'fill-current' : ''}`} />
                    <span>{item.likes || 0}</span>
                  </button>
                  <button
                    className="flex items-center space-x-1 text-green-600"
                    onClick={(e) => handleUnsave(item._id, item.type, e)}
                  >
                    <Bookmark className="w-4 h-4 fill-current" />
                  </button>
                  <button className="flex items-center gap-2 hover:text-green-600">
                    <MessageCircle className="w-4 h-4" />
                    <span>{item.comments?.length || 0}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default SavedPosts;