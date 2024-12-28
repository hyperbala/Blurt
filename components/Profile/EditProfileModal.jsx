'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function EditProfileModal({ isOpen, onClose, currentName, currentUsername, onSave }) {
  const [name, setName] = useState(currentName || '');
  const [username, setUsername] = useState(currentUsername || '');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { update: updateSession } = useSession();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Only include fields that have been modified
    const updates = {};
    if (name !== currentName) updates.name = name;
    if (username !== currentUsername) updates.username = username;

    // If no changes were made, close the modal
    if (Object.keys(updates).length === 0) {
      onClose();
      return;
    }

    try {
      const response = await fetch('/api/users/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      // Update the session with new data
      await updateSession({
        ...data.user,
        hasCompletedOnboarding: true
      });

      onSave(data.user);
      onClose();
    } catch (error) {
      setError(error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>

        <h2 className="text-xl font-bold mb-4 text-gray-800">Edit Profile</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-colors duration-200"
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-colors duration-200"
              placeholder="Enter your username"
            />
            <p className="text-sm text-gray-500 mt-1">
              3-20 characters, letters, numbers, and underscores only
            </p>
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors duration-200"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}