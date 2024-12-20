'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { Camera } from 'lucide-react';
import FollowModal from './FollowModal';

export default function UserProfile() {
  const { data: session, update: updateSession } = useSession();
  const [userData, setUserData] = useState({
    followers: [],
    following: [],
    followersCount: 0,
    followingCount: 0
  });
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchUserData();
  }, [session]);

  const fetchUserData = async () => {
    if (!session?.user?.id) return;
    
    try {
      const res = await fetch(`/api/users/${session.user.id}/follow-data`);
      const data = await res.json();
      setUserData(data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      console.log('Uploading image...'); // Debug log
      const response = await fetch('/api/users/profile', {
        method: 'POST',
        body: formData,
      });

      console.log('Upload response status:', response.status); // Debug log

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();
      console.log('Upload successful:', data); // Debug log

      // Update session
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          image: data.image
        }
      });
      console.log('Updated user:', updatedUser); 
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(error.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };


  const handleFollowToggle = async (targetUserId) => {
    try {
      const res = await fetch(`/api/users/${targetUserId}/follow`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchUserData();
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  return (
    <div className="flex flex-col items-center mb-6">
      <div className="relative w-24 h-24 mb-4">
        <div 
          className="relative w-full h-full cursor-pointer group"
          onClick={handleImageClick}
        >
          <Image
            src={userData?.image || "/ashiq.jpeg"}
            alt="Profile"
            className="rounded-full object-cover"
            fill
            priority
          />
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {uploading ? (
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera className="w-8 h-8 text-white" />
            )}
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
          disabled={uploading}
        />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {userData?.name || "Anonymous"}
      </h1>
      <p className="text-gray-500 mb-4">
        @{userData?.username || session?.user?.email?.split('@')[0]}
      </p>

      {/* Follow Stats */}
      <div className="flex gap-6">
        <button
          onClick={() => setShowFollowers(true)}
          className="flex flex-col items-center hover:bg-gray-50 p-2 rounded-lg"
        >
          <span className="font-semibold">{userData.followersCount}</span>
          <span className="text-gray-500">followers</span>
        </button>
        <button
          onClick={() => setShowFollowing(true)}
          className="flex flex-col items-center hover:bg-gray-50 p-2 rounded-lg"
        >
          <span className="font-semibold">{userData.followingCount}</span>
          <span className="text-gray-500">following</span>
        </button>
      </div>

      {/* Modals */}
      <FollowModal
        isOpen={showFollowers}
        onClose={() => setShowFollowers(false)}
        title="Followers"
        users={userData.followers}
        onFollowToggle={handleFollowToggle}
      />

      <FollowModal
        isOpen={showFollowing}
        onClose={() => setShowFollowing(false)}
        title="Following"
        users={userData.following}
        onFollowToggle={handleFollowToggle}
      />
    </div>
  );
}