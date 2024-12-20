// components/Profile/ProfileHeader.jsx
'use client'

import { useState } from 'react';
import { User } from '@nextui-org/react';
import { Settings, Edit } from 'lucide-react';

const ProfileHeader = ({ user, isOwnProfile, postsCount }) => {
  const [isFollowing, setIsFollowing] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <User
            name={user.name}
            description={`@${user.name.toLowerCase().replace(' ', '')}`}
            avatarProps={{
              src: user.avatar || "https://i.pravatar.cc/150?u=anonymous",
              className: "w-24 h-24"
            }}
          />
          <div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-gray-600">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
            <div className="flex space-x-4 mt-2">
              <div>
                <span className="font-semibold">{postsCount}</span>
                <span className="text-gray-600 ml-1">Posts</span>
              </div>
              <div>
                <span className="font-semibold">{user.followers?.length || 0}</span>
                <span className="text-gray-600 ml-1">Followers</span>
              </div>
              <div>
                <span className="font-semibold">{user.following?.length || 0}</span>
                <span className="text-gray-600 ml-1">Following</span>
              </div>
            </div>
          </div>
        </div>
        
        {isOwnProfile ? (
          <div className="flex space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Settings className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Edit className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsFollowing(!isFollowing)}
            className={`px-6 py-2 rounded-full transition-colors duration-200 ${
              isFollowing 
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'border border-green-600 text-green-600 hover:bg-green-50'
            }`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;