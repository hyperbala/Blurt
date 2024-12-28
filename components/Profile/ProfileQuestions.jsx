'use client'

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import PostCard from '../Post/PostCard';
import PostModal from 'components/Post/PostModal';
import ActionButtons from '../Profile/ActionButtons';

const ProfileQuestions = ({ userId }) => {
  const { data: session, status } = useSession();
  const [questions, setQuestions] = useState([]);
  const [sortBy, setSortBy] = useState('new'); // Add sorting state
  const [likedQuestions, setLikedQuestions] = useState(new Set());
  const [savedQuestions, setSavedQuestions] = useState(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [followingUsers, setFollowingUsers] = useState(new Set());

  // Add sorting function
  const sortQuestions = (questionsToSort, sortType) => {
    let sortedQuestions = [...questionsToSort];
    switch (sortType) {
      case 'new':
        sortedQuestions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'old':
        sortedQuestions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'liked':
        sortedQuestions.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      default:
        break;
    }
    setQuestions(sortedQuestions);
  };

  // Add sort change handler
  const handleSortChange = (sortType) => {
    setSortBy(sortType);
    sortQuestions(questions, sortType);
  };

  const fetchUserQuestions = useCallback(async () => {
    try {
      let endpoint;
      
      if (userId) {
        endpoint = `/api/questions/user/${userId}`;
      } else if (session?.user?.id) {
        endpoint = '/api/questions/user';
      } else {
        return;
      }

      const res = await fetch(endpoint);
      if (!res.ok) {
        throw new Error('Failed to fetch questions');
      }
      
      const data = await res.json();
      sortQuestions(data, sortBy); // Sort questions after fetching
      
      setLikedQuestions(new Set(
        data.filter(q => q.isLiked).map(q => q._id)
      ));
      setSavedQuestions(new Set(
        data.filter(q => q.isSaved).map(q => q._id)
      ));
    } catch (error) {
      console.error('Error fetching user questions:', error);
    }
  }, [userId, session?.user?.id, sortBy]); // Add sortBy as dependency

  // Fetch follow statuses
  useEffect(() => {
    const fetchFollowStatuses = async () => {
      if (!session?.user) return;

      try {
        const newFollowingUsers = new Set();
        await Promise.all(
          questions.map(async (question) => {
            if (question.author?._id) {
              const response = await fetch(`/api/users/follow/${question.author._id}`);
              if (response.ok) {
                const { isFollowing } = await response.json();
                if (isFollowing) {
                  newFollowingUsers.add(question.author._id);
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
  }, [questions, session]);

  useEffect(() => {
    if (userId || status === 'authenticated') {
      fetchUserQuestions();
    }
  }, [userId, status, session, fetchUserQuestions]);

  const handleLike = async (questionId, e) => {
    e?.stopPropagation();
    if (!session?.user?.id) return;

    try {
      const res = await fetch(`/api/questions/${questionId}/like`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Failed to like question');
      }

      const data = await res.json();
      
      setQuestions(prevQuestions =>
        prevQuestions.map(q =>
          q._id === questionId
            ? { ...q, likes: data.likes, isLiked: data.hasLiked }
            : q
        )
      );

      setLikedQuestions(prev => {
        const newSet = new Set(prev);
        if (data.hasLiked) {
          newSet.add(questionId);
        } else {
          newSet.delete(questionId);
        }
        return newSet;
      });

      return { success: true, likes: data.likes };
    } catch (error) {
      console.error('Error liking question:', error);
      return { success: false };
    }
  };

  const handleSave = async (questionId, e) => {
    e?.stopPropagation();
    if (!session?.user?.id) return;

    try {
      const res = await fetch(`/api/questions/${questionId}/save`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Failed to save question');
      }

      const data = await res.json();
      
      setSavedQuestions(prev => {
        const newSet = new Set(prev);
        if (data.isSaved) {
          newSet.add(questionId);
        } else {
          newSet.delete(questionId);
        }
        return newSet;
      });

      return { success: true, isSaved: data.isSaved };
    } catch (error) {
      console.error('Error saving question:', error);
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

  const handleCardClick = (question) => {
    setSelectedQuestion(question);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedQuestion(null);
    document.body.style.overflow = 'auto';
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <ActionButtons onSortChange={handleSortChange} />
      
      {questions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">You haven&apos;t asked any questions yet.</p>
        </div>
      ) : (
        questions.map((question) => (
          <PostCard
            key={question._id}
            item={question}
            session={session}
            likedItems={likedQuestions}
            savedItems={savedQuestions}
            followingUsers={followingUsers}
            handleLike={handleLike}
            handleSave={handleSave}
            handleFollow={handleFollow}
            onClick={() => handleCardClick(question)}
            isQuestion={true}
          />
        ))
      )}

      {isModalOpen && selectedQuestion && (
        <PostModal
          isOpen={isModalOpen}
          onClose={closeModal}
          post={selectedQuestion}
          session={session}
          likedPosts={likedQuestions}
          savedPosts={savedQuestions}
          handleLike={handleLike}
          handleSave={handleSave}
          setPosts={setQuestions}
          followingUsers={followingUsers}
          handleFollow={handleFollow}
          isQuestion={true}
        />
      )}
    </div>
  );
};

export default ProfileQuestions;