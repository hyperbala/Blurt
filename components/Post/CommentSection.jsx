// components/CommentSection.jsx
'use client'

import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNowStrict } from 'date-fns';
import { useUserData } from '../../hooks/useUserData';
import Image from 'next/image';

const CommentSection = ({ id, type, session }) => {
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyingToUser, setReplyingToUser] = useState(null);

  const userData = useUserData();

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`/api/${type}s/${id}/comments`);
        if (response.ok) {
          const data = await response.json();
          setComments(data);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };
  
    fetchComments();
  }, [id, type]); 
  
  const handleMainCommentSubmit = async () => {
    if (!comment.trim() || !session?.user) return;

    try {
      const response = await fetch(`/api/${type}s/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: comment.trim()
        }),
      });

      if (response.ok) {
        const newComment = await response.json();
        setComments(prev => [...prev, newComment]);
        setComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleReplySubmit = async (commentId, replyToUsername = null) => {
    if (!replyText.trim() || !session?.user) return;

    const replyContent = replyToUsername
      ? `@${replyToUsername} ${replyText.trim()}`
      : replyText.trim();

    try {
      const response = await fetch(`/api/${type}s/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          parentCommentId: commentId
        }),
      });

      if (response.ok) {
        const newReply = await response.json();
        setComments(prevComments =>
          prevComments.map(comment => {
            if (comment._id === commentId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), newReply]
              };
            }
            return comment;
          })
        );
        setReplyText('');
        setReplyingTo(null);
        setReplyingToUser(null);
      }
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };

  const handleLike = async (commentId, replyId = null) => {
    if (!session?.user) return;

    try {
      const response = await fetch(`/api/${type}s/${id}/comments/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId,
          replyId
        }),
      });

      if (response.ok) {
        const { likes } = await response.json();

        setComments(prevComments =>
          prevComments.map(comment => {
            if (comment._id === commentId) {
              if (replyId) {
                // Update reply likes
                return {
                  ...comment,
                  replies: comment.replies.map(reply =>
                    reply._id === replyId
                      ? { ...reply, likes }
                      : reply
                  )
                };
              }
              // Update comment likes
              return { ...comment, likes };
            }
            return comment;
          })
        );
      }
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };
  
  const UserAvatar = ({ user, size = 'large' }) => {
    // Define specific dimensions based on size
    const dimensions = size === 'large' ? 40 : 32;
    
    return (
      <Link 
        href={`/profile/${user?._id}`}
        className="flex-shrink-0 hover:opacity-80 transition-opacity relative"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: dimensions,
          height: dimensions
        }}
      >
        <Image 
          src={user?.image || "/default-avatar.png"} 
          alt={user?.name || 'Anonymous'} 
          className="rounded-full object-cover"
          width={dimensions}
          height={dimensions}
          // Remove the fill prop
        />
      </Link>
    );
  };
  
  const Username = ({ user }) => (
    <Link 
      href={`/profile/${user?._id}`}
      className="font-medium text-sm text-gray-900 hover:underline"
      onClick={(e) => e.stopPropagation()}
    >
      {user?.name || 'Anonymous'}
    </Link>
  );

  return (
    <div className="pt-6">
      <div className="flex items-center space-x-2 mb-8">
        <h3 className="text-lg font-semibold text-gray-800">Comments</h3>
        <span className="text-gray-500">({comments.length})</span>
      </div>

      {session?.user && (
        <div className="flex space-x-3 mb-8">
          <UserAvatar user={userData} />
          <div className="flex-1">
            <input
              type="text"
              placeholder="Add a comment..."
              className="w-full px-0 py-1 bg-transparent border-b border-gray-200 focus:border-gray-900 focus:outline-none text-gray-800"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div className="flex justify-end space-x-2 mt-3">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-500 rounded-full hover:bg-gray-100"
                onClick={() => setComment('')}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleMainCommentSubmit}
                disabled={!comment.trim()}
              >
                Comment
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {comments.map((comment) => (
          <div key={comment._id} className="group">
            <div className="flex space-x-3">
              <UserAvatar user={comment.author} />
              <div className="flex-1">
                <div className="flex items-baseline space-x-2">
                  <Username user={comment.author} />
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNowStrict(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="mt-1.5 text-gray-800 text-[15px]">{comment.content}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <button
                      className={`p-1.5 rounded-full hover:bg-gray-100 ${
                        comment.likes?.likedBy?.includes(session?.user?.id)
                          ? 'text-green-600'
                          : 'text-gray-500'
                      }`}
                      onClick={() => handleLike(comment._id)}
                      disabled={!session?.user}
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    {comment.likes?.count > 0 && (
                      <span className="text-xs text-gray-500">{comment.likes.count}</span>
                    )}
                    <button className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500">
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </div>
                  {session?.user && (
                    <button
                      className="text-sm font-medium text-gray-500 hover:text-gray-700"
                      onClick={() => setReplyingTo(comment._id)}
                    >
                      Reply
                    </button>
                  )}
                </div>

                {replyingTo === comment._id && (
                  <div className="mt-4 ml-2">
                    <div className="flex space-x-3">
                      <UserAvatar user={userData} size="small" />
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder={replyingToUser ? `Reply to @${replyingToUser}...` : "Add a reply..."}
                          className="w-full px-0 py-1 bg-transparent border-b border-gray-200 focus:border-gray-900 focus:outline-none text-gray-800"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                        />
                        <div className="flex justify-end space-x-2 mt-3">
                          <button
                            className="px-4 py-2 text-sm font-medium text-gray-500 rounded-full hover:bg-gray-100"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyingToUser(null);
                              setReplyText('');
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-full hover:bg-green-700 disabled:opacity-50"
                            onClick={() => handleReplySubmit(comment._id, replyingToUser)}
                            disabled={!replyText.trim()}
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {comment.replies?.length > 0 && (
                  <div className="mt-4 ml-2 space-y-4">
                    {comment.replies.map((reply) => (
                      <div key={reply._id} className="flex space-x-3">
                        <UserAvatar user={reply.author} size="small" />
                        <div className="flex-1">
                          <div className="flex items-baseline space-x-2">
                            <Username user={reply.author} />
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNowStrict(new Date(reply.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="mt-1.5 text-gray-800 text-[15px]">{reply.content}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-2">
                              <button
                                className={`p-1.5 rounded-full hover:bg-gray-100 ${
                                  reply.likes?.likedBy?.includes(session?.user?.id)
                                    ? 'text-green-600'
                                    : 'text-gray-500'
                                }`}
                                onClick={() => handleLike(comment._id, reply._id)}
                                disabled={!session?.user}
                              >
                                <ThumbsUp className="w-4 h-4" />
                              </button>
                              {reply.likes?.count > 0 && (
                                <span className="text-xs text-gray-500">{reply.likes.count}</span>
                              )}
                              <button className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500">
                                <ThumbsDown className="w-4 h-4" />
                              </button>
                            </div>
                            {session?.user && (
                              <button
                                className="text-sm font-medium text-gray-500 hover:text-gray-700"
                                onClick={() => {
                                  setReplyingTo(comment._id);
                                  setReplyingToUser(reply.author?.username || reply.author?.name);
                                }}
                              >
                                Reply
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


export default CommentSection;
