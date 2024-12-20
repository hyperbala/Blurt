// components/Profile/ProfileQuestions.jsx
'use client'

import React, { useEffect, useState } from 'react';
import { User } from '@nextui-org/react';
import { Heart, Bookmark, Share2, MessageCircle, X, Globe2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

const ProfileQuestions = ({ userId }) => {
  const { data: session, status } = useSession();
  const [questions, setQuestions] = useState([]);
  const [likedQuestions, setLikedQuestions] = useState(new Set());
  const [savedQuestions, setSavedQuestions] = useState(new Set());

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
      setQuestions(data);
      
      setLikedQuestions(new Set(
        data.filter(q => q.isLiked).map(q => q._id)
      ));
      setSavedQuestions(new Set(
        data.filter(q => q.isSaved).map(q => q._id)
      ));
    } catch (error) {
      console.error('Error fetching user questions:', error);
    }
  }, [userId, session?.user?.id]); // Add dependencies here

  useEffect(() => {
    if (userId || status === 'authenticated') {
      fetchUserQuestions();
    }
  }, [userId, status, session, fetchUserQuestions]); 

  const handleLike = async (questionId, e) => {
    e.stopPropagation();
    if (!session?.user?.id) return;

    try {
      const res = await fetch(`/api/questions/${questionId}/like`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Failed to like question');
      }

      const data = await res.json();
      
      // Update questions state with new likes count and liked status
      setQuestions(prevQuestions =>
        prevQuestions.map(q =>
          q._id === questionId
            ? { ...q, likes: data.likes, isLiked: data.hasLiked }
            : q
        )
      );

      // Update liked questions set
      setLikedQuestions(prev => {
        const newSet = new Set(prev);
        if (data.hasLiked) {
          newSet.add(questionId);
        } else {
          newSet.delete(questionId);
        }
        return newSet;
      });
    } catch (error) {
      console.error('Error liking question:', error);
    }
  };

const handleSave = async (questionId, e) => {
  e.stopPropagation();
  if (!session?.user?.id) return;

  try {
    const res = await fetch(`/api/questions/${questionId}/save`, { // Updated endpoint
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
  } catch (error) {
    console.error('Error saving question:', error);
  }
};

  return (
    <div className="w-full max-w-2xl mx-auto">
      {questions.length === 0 ? (
        <p className="text-gray-600">You haven&apos;t asked any questions yet.</p>
      ) : (
        questions.map((question) => (
          <div
            key={question._id}
            className="bg-white border rounded-xl shadow-sm mb-4 hover:shadow-md transition-all duration-200 cursor-pointer"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <User
                  name={question.author?.name || "Anonymous"}
                  description={question.author?.username ? 
                    `@${question.author.username.toLowerCase().replace(' ', '')}` : 
                    '@anonymous'}
                  avatarProps={{
                    src: question.author?.image || "/default-avatar.png",
                  }}
                />
                <div className="flex items-center space-x-1 bg-green-50 rounded-full px-2 py-1">
                  <Globe2 className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-700">Question</span>
                </div>
              </div>

              <h2 className="text-xl font-semibold mb-2 text-gray-800">
                {question.title}
              </h2>

              <p className="text-gray-600 mb-4">{question.content}</p>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{new Date(question.createdAt).toLocaleString()}</span>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={(e) => handleLike(question._id, e)}
                    className={`flex items-center gap-2 ${
                      likedQuestions.has(question._id) ? 'text-green-500' : ''
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${
                      likedQuestions.has(question._id) ? 'fill-current' : ''
                    }`} />
                    <span>{question.likes || 0}</span>
                  </button>

                  <button
                    onClick={(e) => handleSave(question._id, e)}
                    className={`flex items-center ${
                      savedQuestions.has(question._id) ? 'text-green-500' : ''
                    }`}
                  >
                    <Bookmark className={`h-5 w-5 ${
                      savedQuestions.has(question._id) ? 'fill-current' : ''
                    }`} />
                  </button>

                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-5 w-5" />
                    <span>{question.comments?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ProfileQuestions;