// components/Profile/FollowModal.jsx
'use client';

import { image, User } from '@nextui-org/react';
import { X } from 'lucide-react';

export default function FollowModal({ isOpen, onClose, title, users, onFollowToggle }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto p-4">
          {users.length === 0 ? (
            <p className="text-center text-gray-500">No {title.toLowerCase()} yet</p>
          ) : (
            users.map((user) => (
              <div key={user._id} className="flex items-center justify-between py-2">
                <User
                  name={user.name || "Anonymous"}
                  description={`@${user?.username || user?.username.split('@')[0]}`}
                  avatarProps={{
                    src: user?.image || "/default-avatar.png",
                  }}
                />
                <button
                  onClick={() => onFollowToggle(user._id)}
                  className="px-4 py-1 rounded-full border border-green-600 text-green-600 hover:bg-green-50"
                >
                  {user.isFollowing ? 'Unfollow' : 'Follow'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}