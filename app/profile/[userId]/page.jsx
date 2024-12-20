// app/profile/[userId]/page.jsx
'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import ProfilePosts from '../../../components/Feed/Profile';
import ProfileQuestions from '../../../components/Profile/ProfileQuestions';
import UserDetails from '../../../components/Profile/UserDetails';
import LeftSidebar from '../../../components/LeftSidebar';
import TrendingSidebar from '../../../components/TrendingSidebar';
import { TopicProvider } from '../../../contexts/TopicContext';
import { useSession } from 'next-auth/react';
import BottomNavigation from '../../../components/BottomNavigation';

export default function UserProfilePage() {
  const [activeTab, setActiveTab] = useState('posts');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const params = useParams();
  const { data: session } = useSession();
  const userId = params.userId;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/users/${userId}`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setUserData(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const renderContent = () => {
    switch (activeTab.toLowerCase()) {
      case 'questions':
        return <ProfileQuestions userId={userId} />;
      case 'posts':
      default:
        return <ProfilePosts userId={userId} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-gray-600">User not found</div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <TopicProvider>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-center gap-4 pt-4 px-4">
          {/* Left Sidebar - Hidden on mobile, visible on xl breakpoint */}
          <div className="hidden xl:block w-56 flex-shrink-0">
            <LeftSidebar />
          </div>

          {/* Main Content */}
          <div className="w-full md:max-w-2xl flex-shrink-0">
            <UserDetails 
              userData={userData}
              activeTab={activeTab} 
              onTabChange={(tab) => {
                setActiveTab(tab);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              isOwnProfile={session?.user?.id === userId}
            />
            <div className="mt-4">
              {renderContent()}
            </div>
          </div>

          {/* Trending Sidebar - Hidden on mobile, visible on xl breakpoint */}
          <div className="hidden xl:block w-72 flex-shrink-0">
            <TrendingSidebar />
          </div>

          {/* Mobile Bottom Navigation */}
          <BottomNavigation />
        </div>
      </TopicProvider>
    </main>
  );
}

// Keep the LoadingSpinner component as is
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
    </div>
  );
}