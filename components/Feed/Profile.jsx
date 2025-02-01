'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import PostCard from '../Post/PostCard';
import PostModal from '../Post/PostModal';
import ActionButtons from '../Profile/ActionButtons';
import DeleteModal from '../Post/DeleteModal';

const ProfilePosts = ({ userId }) => {
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState([]);
  const [sortBy, setSortBy] = useState('new');
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [savedPosts, setSavedPosts] = useState(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [followingUsers, setFollowingUsers] = useState(new Set());
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [loading, setLoading] = useState(true);

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
    setLoading(true);
    try {
      let endpoint = userId ? `/api/posts/user/${userId}` : '/api/posts/user';
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data = await res.json();

      // Ensure isLiked and isSaved properties are correctly set
      const postsWithLikesAndSaves = data.map(post => ({
        ...post,
        likes: post.likes || post.likedBy?.length || 0,
        isLiked: Array.isArray(post.likedBy) && post.likedBy.includes(session?.user?.id),
        isSaved: Array.isArray(post.savedBy) && post.savedBy.includes(session?.user?.id)
      }));

      sortPosts(postsWithLikesAndSaves, sortBy);
      setLikedPosts(new Set(postsWithLikesAndSaves.filter(p => p.isLiked).map(p => p._id)));
      setSavedPosts(new Set(postsWithLikesAndSaves.filter(p => p.isSaved).map(p => p._id)));
    } catch (error) {
      console.error('Error fetching user posts:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, sortBy, session?.user?.id]);

  useEffect(() => {
    if (userId || status === 'authenticated') fetchUserPosts();
  }, [userId, status, fetchUserPosts]);

  const handleLike = async (postId, e) => {
    e?.stopPropagation();
    if (!session?.user?.id) return;

    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to like post');
      const data = await res.json();

      setPosts(prevPosts => prevPosts.map(p =>
        p._id === postId ? { ...p, likes: data.likes, isLiked: data.isLiked } : p
      ));
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        data.isLiked ? newSet.add(postId) : newSet.delete(postId);
        return newSet;
      });
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleSave = async (postId, e) => {
    e?.stopPropagation();
    if (!session?.user?.id) return;

    try {
      const res = await fetch(`/api/posts/${postId}/save`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to save post');
      const data = await res.json();

      setSavedPosts(prev => {
        const newSet = new Set(prev);
        data.isSaved ? newSet.add(postId) : newSet.delete(postId);
        return newSet;
      });
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  const handleFollow = async (authorId, e) => {
    e.stopPropagation();
    if (!session?.user || session.user.id === authorId) return;

    try {
      const response = await fetch(`/api/users/follow/${authorId}`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setFollowingUsers(prev => {
        const newSet = new Set(prev);
        data.isFollowing ? newSet.add(authorId) : newSet.delete(authorId);
        return newSet;
      });
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleDeleteClick = (postId, e) => {
    e.stopPropagation();
    setPostToDelete(postId);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const res = await fetch(`/api/posts/${postToDelete}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete post');
      setPosts(posts.filter(p => p._id !== postToDelete));
      setDeleteModalOpen(false);
      setPostToDelete(null);
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setPostToDelete(null);
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
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading posts...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No posts available yet.</p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post._id}
            item={{
              ...post,
              likes: post.likes,
              isLiked: likedPosts.has(post._id),
              isSaved: savedPosts.has(post._id)
            }}
            session={session}
            likedItems={likedPosts}
            savedItems={savedPosts}
            followingUsers={followingUsers}
            handleLike={handleLike}
            handleSave={handleSave}
            handleFollow={handleFollow}
            handleDelete={handleDeleteClick}
            onClick={() => handleCardClick(post)}
            isQuestion={false}
          />
        ))
      )}
      {isModalOpen && selectedPost && (
        <PostModal
          isOpen={isModalOpen}
          onClose={closeModal}
          post={{
            ...selectedPost,
            isLiked: likedPosts.has(selectedPost._id),
            isSaved: savedPosts.has(selectedPost._id)
          }}
          session={session}
          likedPosts={likedPosts}
          savedPosts={savedPosts}
          handleLike={handleLike}
          handleSave={handleSave}
          setPosts={setPosts}
          followingUsers={followingUsers}
          handleFollow={handleFollow}
          handleDelete={handleDeleteClick}
          isQuestion={false}
        />
      )}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        itemType="post"
      />
    </div>
  );
};

export default ProfilePosts;