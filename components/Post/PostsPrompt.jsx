// components/Posts/PostsPrompt.jsx (Posts Only Component)
'use client'

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { HiPencil } from "react-icons/hi";
import AskModal from './AskModal';
import PostList from './PostList';
import { useUserData } from '../../hooks/useUserData'; // Add this import


const PostsPrompt = () => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [updateKey, setUpdateKey] = useState(Date.now());

  const userData = useUserData(); // Add this hook
  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);

  const handlePostCreated = useCallback(() => {
    setUpdateKey(Date.now());
  }, []);

  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toISOString().slice(0, 19).replace('T', ' ');
  };

  return (
    <div className="w-full">

      <div
        className="flex items-center gap-3 bg-emerald-50/80 hover:bg-emerald-50 rounded-full px-4 py-2.5 cursor-pointer border border-emerald-100 shadow-sm hover:shadow-md transition-all duration-200 mb-8"
        onClick={openModal}
      >
        <Image 
          src={userData?.image}
          width={32} 
          height={32} 
          alt="Profile" 
          className="rounded-full ring-2 ring-emerald-100"
        />
        <p className="text-emerald-700 text-sm flex-grow">
          Share your knowledge with a post...
        </p>
        <HiPencil 
          className="text-emerald-600 hover:text-emerald-700 transition-colors duration-200" 
          size={20} 
        />
      </div>

      <AskModal
        isOpen={modalIsOpen}
        onClose={closeModal}
        onPostCreated={handlePostCreated}
        defaultType="post" // Force post type in the modal
      />
      
      <PostList 
        key={updateKey}
        type='posts' // This will show only posts
      />
    </div>
  );
};

export default PostsPrompt;