'use client'

import { useState } from 'react';
import Navbar from '../../components/Navbar';
import ProfilePosts from '../../components/Feed/Profile';
import LikedPosts from '../../components/Feed/LikedPosts';
import SavedPosts from '../../components/Feed/SavedPosts';
import ProfileQuestions from '../../components/Profile/ProfileQuestions';
import Details from '../../components/Profile/Details';
import LeftSidebar from '../../components/LeftSidebar';
import TrendingSidebar from '../../components/TrendingSidebar';
import BottomNavigation from '../../components/BottomNavigation';

import { TopicProvider } from '../../contexts/TopicContext';

export default function Home() {
  const [activeTab, setActiveTab] = useState('posts');

  const renderContent = () => {
    switch (activeTab.toLowerCase()) {
      case 'liked':
        return <LikedPosts />;
      case 'saved':
        return <SavedPosts />;
      case 'questions':
        return <ProfileQuestions />;
      case 'posts':
      default:
        return <ProfilePosts />;
    }
  };

  return (
    <main className="min-h-screen bg-white pb-16"> {/* Added pb-16 to prevent content from being hidden behind the navigation */}
      <Navbar />
      <TopicProvider>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-center gap-4 pt-4 px-4">
          {/* Left Sidebar - Hidden on mobile, visible on xl breakpoint */}
          <div className="hidden xl:block w-56 flex-shrink-0">
            <LeftSidebar />
          </div>

          {/* Main Content */}
          <div className="w-full md:max-w-2xl flex-shrink-0">
            <Details 
              activeTab={activeTab} 
              onTabChange={(tab) => {
                setActiveTab(tab);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} 
            />
            <div className="mt-4">
              {renderContent()}
            </div>
          </div>

          {/* Trending Sidebar - Hidden on mobile, visible on xl breakpoint */}
          <div className="hidden xl:block w-72 flex-shrink-0">
            <TrendingSidebar />
          </div>
        </div>
      <BottomNavigation />
      </TopicProvider>
      
      {/* Use the BottomNavigation component */}
    </main>
  );
}