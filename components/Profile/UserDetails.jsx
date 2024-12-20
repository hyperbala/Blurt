// components/Profile/UserDetails.jsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import FollowModal from './FollowModal';
import TabNavigation from './TabNavigation';

export default function UserDetails({ userData, activeTab, onTabChange, isOwnProfile }) {
  const { data: session } = useSession();
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followStats, setFollowStats] = useState({
    followersCount: userData.followers?.length || 0,
    followingCount: userData.following?.length || 0
  });

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!session?.user?.id || isOwnProfile) return;

      try {
        const res = await fetch(`/api/users/follow/${userData._id}`);
        const data = await res.json();
        setIsFollowing(data.isFollowing);
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };

    checkFollowStatus();
  }, [session, userData._id, isOwnProfile]);

  const handleFollow = async () => {
    if (!session?.user) return;

    try {
      const res = await fetch(`/api/users/follow/${userData._id}`, {
        method: 'POST'
      });
      const data = await res.json();
      
      setIsFollowing(data.isFollowing);
      setFollowStats(prev => ({
        ...prev,
        followersCount: data.followersCount
      }));
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm">
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-24 h-24 mb-4">
          <Image
            src={userData.image || "/ashiq.jpeg"}
            alt={userData.name}
            className="rounded-full object-cover"
            fill
            priority
          />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {userData.name}
        </h1>
        <p className="text-gray-500 mb-4">
          @{userData.username || userData.email?.split('@')[0]}
        </p>

        {!isOwnProfile && session?.user && (
          <button
            onClick={handleFollow}
            className={`px-6 py-2 rounded-full transition-colors duration-200 mb-4 ${
              isFollowing 
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'border border-green-600 text-green-600 hover:bg-green-50'
            }`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        )}

        <div className="flex gap-6">
          <button
            onClick={() => setShowFollowers(true)}
            className="flex flex-col items-center hover:bg-gray-50 p-2 rounded-lg"
          >
            <span className="font-semibold">{followStats.followersCount}</span>
            <span className="text-gray-500">followers</span>
          </button>
          <button
            onClick={() => setShowFollowing(true)}
            className="flex flex-col items-center hover:bg-gray-50 p-2 rounded-lg"
          >
            <span className="font-semibold">{followStats.followingCount}</span>
            <span className="text-gray-500">following</span>
          </button>
        </div>
      </div>

      <TabNavigation 
        activeTab={activeTab} 
        onTabChange={onTabChange}
        isOwnProfile={isOwnProfile}
      />

      <FollowModal
        isOpen={showFollowers}
        onClose={() => setShowFollowers(false)}
        title="Followers"
        users={userData.followers}
        onFollowToggle={handleFollow}
      />

      <FollowModal
        isOpen={showFollowing}
        onClose={() => setShowFollowing(false)}
        title="Following"
        users={userData.following}
        onFollowToggle={handleFollow}
      />
    </div>
  );
}