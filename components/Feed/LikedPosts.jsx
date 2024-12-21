// components/Feed/LikedPosts.jsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { User } from '@nextui-org/react';
import { Heart, Bookmark, Share2, MessageCircle, X, Globe2 } from 'lucide-react';
import ActionButtons from '../Profile/ActionButtons';
import Image from 'next/image';

const LikedPosts = () => {
    const [likedItems, setLikedItems] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [comment, setComment] = useState('');
    const [likedItemsSet, setLikedItemsSet] = useState(new Set());
    const [savedItems, setSavedItems] = useState(new Set());
    const [sortBy, setSortBy] = useState('new');
    const [loading, setLoading] = useState(true);

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
    }, [sortBy]); // Add sortBy as a dependency since it's used in the function

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

    const handleLike = async (itemId, type, e) => {
        e.stopPropagation();
        try {
            const res = await fetch(`/api/${type}/${itemId}/like`, {
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

                if (selectedItem?._id === itemId) {
                    setSelectedItem(prev => ({ ...prev, likes }));
                }
            }
        } catch (error) {
            console.error('Error liking item:', error);
        }
    };

    const handleSave = async (itemId, type, e) => {
        e.stopPropagation();
        try {
            const res = await fetch(`/api/${type}/${itemId}/save`, {
                method: 'POST',
            });

            if (res.ok) {
                const { isSaved } = await res.json();
                setSavedItems(prev => {
                    const newSet = new Set(prev);
                    if (isSaved) {
                        newSet.add(itemId);
                    } else {
                        newSet.delete(itemId);
                    }
                    return newSet;
                });
            }
        } catch (error) {
            console.error('Error saving item:', error);
        }
    };

    const handleCardClick = (item) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedItem(null);
        setComment('');
    };

    const handleCommentSubmit = async (itemId, type) => {
        try {
            const res = await fetch(`/api/${type}/${itemId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: comment }),
            });

            if (res.ok) {
                const newComment = await res.json();
                setLikedItems(likedItems.map(item =>
                    item._id === itemId
                        ? { ...item, comments: [...(item.comments || []), newComment] }
                        : item
                ));
                setSelectedItem(prevItem => ({
                    ...prevItem,
                    comments: [...(prevItem.comments || []), newComment],
                }));
                setComment('');
            }
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    if (loading) return <p>Loading items...</p>;
    return (
        <div className="w-full max-w-2xl mx-auto">
            <ActionButtons onSortChange={handleSortChange} />
            {likedItems.length === 0 ? (
                <p className="text-gray-600">No liked items yet.</p>
            ) : (
                likedItems.map((item) => (
                    <div
                        key={item._id}
                        className="bg-white border rounded-xl shadow-sm mb-4 hover:shadow-md transition-all duration-200 cursor-pointer"
                        onClick={() => handleCardClick(item)}
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
                                    <Image
                                        src={item.image}
                                        alt={item.title || 'Post image'}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        className="object-cover"
                                        priority={false}
                                    />

                                </div>
                            )}

                            <p className="text-gray-600 mb-4 line-clamp-3">{item.content}</p>

                            <div className="flex items-center justify-between text-sm text-gray-500 p-4">
                                <span>{new Date(item.createdAt).toLocaleString()}</span>
                                <div className="flex items-center space-x-4">
                                    <button
                                        className={`flex items-center space-x-1 ${likedItemsSet.has(item._id) ? 'text-green-600' : 'hover:text-green-600'}`}
                                        onClick={(e) => handleLike(item._id, item.type, e)}
                                    >
                                        <Heart className={`w-4 h-4 ${likedItemsSet.has(item._id) ? 'fill-current' : ''}`} />
                                        <span>{item.likes || 0}</span>
                                    </button>
                                    <button
                                        className={`flex items-center space-x-1 ${savedItems.has(item._id) ? 'text-green-600' : 'hover:text-green-600'}`}
                                        onClick={(e) => handleSave(item._id, item.type, e)}
                                    >
                                        <Bookmark className={`w-4 h-4 ${savedItems.has(item._id) ? 'fill-current' : ''}`} />
                                    </button>
                                    <button className="flex items-center space-x-1 hover:text-green-600">
                                        <MessageCircle className="w-4 h-4" />
                                        <span>{(item.comments?.length || 0)}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            )}

            {isModalOpen && selectedItem && (
                <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/20">
                    <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-800">Item Details</h3>
                            <button
                                onClick={closeModal}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-4">
                            <User
                                name={selectedItem.author?.name || "Anonymous"}
                                description={`@${selectedItem.author?.name?.toLowerCase().replace(' ', '') || 'anonymous'}`}
                                avatarProps={{
                                    src: selectedItem.author?.avatar || "https://i.pravatar.cc/150?u=anonymous",
                                }}
                            />
                            <h2 className="text-2xl font-semibold mb-4">{selectedItem.title}</h2>
                            {selectedItem.image && (
                                <div className="relative aspect-video mb-4 bg-gray-100 rounded-lg overflow-hidden">
                                    <Image
                                        src={selectedItem.image}
                                        alt={selectedItem.title || 'Post image'}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        className="object-cover"
                                        priority={false}
                                    />

                                </div>
                            )}
                            <p className="text-gray-700 mb-6 leading-relaxed">{selectedItem.content}</p>

                            <div className="flex space-x-6">
                                <button
                                    className={`flex items-center space-x-2 ${likedItemsSet.has(selectedItem._id) ? 'text-green-600' : 'text-gray-600 hover:text-green-600'
                                        } transition-colors duration-200`}
                                    onClick={(e) => handleLike(selectedItem._id, selectedItem.type, e)}
                                >
                                    <Heart className={`w-5 h-5 ${likedItemsSet.has(selectedItem._id) ? 'fill-current' : ''}`} />
                                    <span>Like</span>
                                </button>
                                <button
                                    className={`flex items-center space-x-2 ${savedItems.has(selectedItem._id) ? 'text-green-600' : 'text-gray-600 hover:text-green-600'
                                        } transition-colors duration-200`}
                                    onClick={(e) => handleSave(selectedItem._id, selectedItem.type, e)}
                                >
                                    <Bookmark className={`w-5 h-5 ${savedItems.has(selectedItem._id) ? 'fill-current' : ''}`} />
                                    <span>Save</span>
                                </button>
                                <button className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors duration-200">
                                    <Share2 className="w-5 h-5" />
                                    <span>Share</span>
                                </button>
                            </div>
                        </div>

                        <div className="p-4 border-t">
                            <h4 className="text-lg font-semibold mb-2">Comments</h4>
                            <div className="mb-4">
                                {selectedItem.comments?.map((comment) => (
                                    <div key={comment._id} className="border-b py-2">
                                        <User
                                            name={comment.author.name}
                                            description={`@${comment.author.name.toLowerCase().replace(' ', '')}`}
                                            avatarProps={{
                                                src: comment.author.avatar || "https://i.pravatar.cc/150?u=anonymous",
                                            }}
                                        />
                                        <p className="text-gray-600">{comment.content}</p>
                                    </div>
                                )) || <p className="text-gray-600">No comments yet.</p>}
                            </div>
                            <div className="flex">
                                <input
                                    type="text"
                                    placeholder="Add a comment..."
                                    className="border rounded-lg p-2 flex-1"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                />
                                <button
                                    className="bg-green-600 text-white rounded-lg px-4 ml-2"
                                    onClick={() => handleCommentSubmit(selectedItem._id, selectedItem.type)}
                                >
                                    Post
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LikedPosts;