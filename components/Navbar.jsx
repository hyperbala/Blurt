// components/Navbar.jsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IoMdSearch } from "react-icons/io";
import NotificationDropdown from "./Notifications/NotificationDropdown";
import { FiShoppingBag } from "react-icons/fi";
import { X } from "lucide-react";
import PostModal from './Post/PostModal';
import ProfileIcon from './ProfileIcon';
import { useSession } from 'next-auth/react';
import debounce from 'lodash/debounce';
import { usePostModal } from '../hooks/usePostModal';


const Navbar = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const resultsRef = useRef(null);
  const { data: session } = useSession();

  // Use the PostModal hook
  const {
    isModalOpen: isPostModalOpen,
    selectedPost,
    followingUsers,
    likedItems: likedPosts,
    savedItems: savedPosts,
    handleLike,
    handleSave,
    handleFollow,
    openModal,
    closeModal
  } = usePostModal(searchResults, setSearchResults);

  // Search functionality
  const debouncedSearch = useCallback(
    async (query) => {
      if (query.trim().length === 0) {
        setSearchResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Search failed');
        const data = await response.json();
        setSearchResults(data);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [setSearchResults, setIsLoading]
);

// Wrap the debounced version outside of the component or use useMemo
const debouncedSearchHandler = debounce(debouncedSearch, 300);

// In your handleSearchChange function:
const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setSelectedIndex(-1);
    debouncedSearchHandler(query);
};

  const handleResultClick = (result) => {
    openModal({
      ...result,
      type: result.type || 'post',
      author: {
        _id: result.author?._id,
        name: result.author?.name,
        image: result.author?.image,
        username: result.author?.username
      }
    });
    setIsSearchOpen(false);
  };

  
  // Effect for keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Effect for search focus
  useEffect(() => {
    if (isSearchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isSearchOpen]);

  // Effect for scroll into view
  useEffect(() => {
    if (selectedIndex > -1 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Format date helper function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="sticky top-0 left-0 right-0 z-50 bg-white shadow-sm px-24">
      {/* Navigation Bar */}
      <nav className="flex justify-between items-center p-2 px-10">
        <Link href="/" className='md:block hidden'>
          <Image src="/logo/upavana.svg" alt="Upavana Logo" width={80} height={80} />
        </Link>
        <div className="flex justify-around items-center gap-10 text-black">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="hover:text-green-600 transition-colors duration-200 flex items-center gap-2"
            title="Search"
          >
            <IoMdSearch size={30} />
          </button>
          <FiShoppingBag size={30} />
          <NotificationDropdown />
          <ProfileIcon />
        </div>
      </nav>

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl">
            <div className="p-4 flex items-center border-b">
              <IoMdSearch size={24} className="text-gray-400 mr-3" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search posts and questions..."
                className="flex-1 outline-none text-lg"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsSearchOpen(false);
                }}
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div
              ref={resultsRef}
              className="max-h-[calc(100vh-200px)] overflow-y-auto"
            >
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                </div>
              ) : searchQuery.trim().length > 0 ? (
                searchResults.length > 0 ? (
                  <div className="p-2">
                    {searchResults.map((result, index) => (
                      <div
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className={`flex items-center p-3 rounded-lg transition-colors duration-200 cursor-pointer ${index === selectedIndex ? 'bg-green-50' : 'hover:bg-gray-50'
                          }`}
                      >
                        <div className="flex-shrink-0 mr-4">
                          {result.image ? (
                            <div className="w-12 h-12 rounded-lg overflow-hidden">
                              <Image
                                src={result.image}
                                alt={result.title}
                                width={48}
                                height={48}
                                className="object-cover w-full h-full"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                              <span className="text-green-600 text-lg">
                                {result.type === 'question' ? 'Q' : 'P'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900 truncate">
                              {result.title}
                            </h3>
                            {result.category && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                {result.category}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 line-clamp-1">
                            {result.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400">
                              {formatDate(result.createdAt)}
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-400">
                              by {result.author.name}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) :  (
                  <div className="p-4 text-center text-gray-500">
                    No results found for &quot;{searchQuery}&quot;
                  </div>
                )
              ) : (
                <div className="p-4 text-center text-gray-500">
                  Start typing to search...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Post Modal */}
      {isPostModalOpen && selectedPost && (
        <PostModal
          isOpen={isPostModalOpen}
          onClose={closeModal}
          post={selectedPost}
          session={session}
          likedPosts={likedPosts}
          savedPosts={savedPosts}
          handleLike={handleLike}
          handleSave={handleSave}
          followingUsers={followingUsers}
          handleFollow={handleFollow}
        />
      )}
    </div>
  );
};

export default Navbar;



