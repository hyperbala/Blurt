'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Camera, X, Image as ImageIcon, Globe2 } from 'lucide-react';
import Image from 'next/image';

const AskModal = ({ isOpen, onClose, onPostCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [type, setType] = useState('post');
  const { data: session } = useSession();

  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setContent('');
      setImage(null);
      setImagePreview(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleTypeChange = (newType) => {
    setType(newType);
    setTitle('');
    setContent('');
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('type', type);
    if (image) {
      formData.append('image', image);
    }

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setTitle('');
        setContent('');
        setImage(null);
        setImagePreview(null);
        onPostCreated();  // Notifies parent component
        onClose();        // This line already closes the modal
      } else {
        console.error('Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed -inset-20 flex items-center justify-center pt-0   z-50"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.2)'
      }}
    >
      <div className="bg-white w-full max-w-xl rounded-lg shadow-lg flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-stretch border-b shrink-0">
          <button
            onClick={onClose}
            className="p-3 text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex-1 flex bg-green-50">
            <button
              onClick={() => handleTypeChange('question')}
              className={`flex-1 py-3 px-4 text-sm font-medium ${type === 'question'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-gray-600'
                }`}
            >
              Ask a question
            </button>
            <button
              onClick={() => handleTypeChange('post')}
              className={`flex-1 py-3 px-4 text-sm font-medium ${type === 'post'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-gray-600'
                }`}
            >
              Share your knowledge
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="p-4 space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm font-medium">
                  {session?.user?.name?.[0] || 'U'}
                </div>
                <div className="flex items-center space-x-1 bg-green-50 rounded-full px-2 py-1">
                  <Globe2 className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-700">Public</span>
                </div>
              </div>

              {type === 'question' && (
                <div className="text-gray-500 text-xs">
                  Start your question with &quot;What&quot;, &quot;How&quot;, &quot;Why&quot;, etc.
                </div>
              )}

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={type === 'question' ? "Your question" : "Title"}
                className="w-full bg-transparent text-gray-800 placeholder-gray-400 outline-none text-lg font-medium"
              />

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={type === 'question' ? "Add details to your question..." : "Share your knowledge..."}
                className="w-full bg-transparent text-gray-600 placeholder-gray-400 outline-none resize-none text-sm min-h-[120px]"
              />

              {imagePreview && (
                <div className="relative">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={800}
                    height={600}
                    className="w-full rounded-lg"
                    style={{ objectFit: 'contain' }}
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1 bg-white/80 rounded-full hover:bg-white"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t p-3 flex justify-between items-center mt-auto shrink-0">
              <label
                htmlFor="image-upload"
                className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                <Camera className="w-5 h-5" />
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:hover:bg-green-600"
                  disabled={!title.trim() || !content.trim()}
                >
                  {type === 'question' ? 'Ask question' : 'Share knowledge'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AskModal;