// components/Profile/Details.jsx
'use client';

import { useState } from 'react';
import UserProfile from './UserProfile';
import TabNavigation from './TabNavigation';

export default function Details({ onTabChange }) {
  const [activeTab, setActiveTab] = useState('posts');

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    onTabChange(tab);
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm">
      <UserProfile />
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} isOwnProfile={true}  />
    </div>
  );
}