'use client'
import Link from 'next/link';
import { User, FileText, HelpCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import TrendingSidebar from './TrendingSidebar';

export default function BottomNavigation() {
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTrendingOpen, setIsTrendingOpen] = useState(false);
  const modalRef = useRef(null);
  const trendingModalRef = useRef(null);

  // Function to toggle menu modal
  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
    setIsTrendingOpen(false);
  };

  // Function to toggle trending modal
  const toggleTrending = () => {
    setIsTrendingOpen(!isTrendingOpen);
    setIsModalOpen(false);
  };

  // Handle click outside or touch
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!modalRef.current?.contains(event.target) && !trendingModalRef.current?.contains(event.target)) {
        setIsModalOpen(false);
        setIsTrendingOpen(false);
      }
    };

    if (isModalOpen || isTrendingOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen, isTrendingOpen]);

  return (
    <>
      {/* Animated Modal */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-all duration-300 ease-in-out
          ${isModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="flex items-end justify-center min-h-screen sm:p-0">
          <div 
            ref={modalRef}
            className={`w-full transform transition-all duration-300 ease-in-out
              ${isModalOpen ? 'translate-y-0' : 'translate-y-full'}
              bg-white rounded-t-2xl shadow-2xl`}
            style={{ maxWidth: '430px' }}
          >
            {/* Modal Content */}
            <div className="relative px-6 pt-6 pb-8">
              {/* Handle bar for visual affordance */}
              <div className="absolute left-1/2 -translate-x-1/2 -top-0 w-12 h-1.5 bg-gray-300 rounded-full mt-2" />

              {/* Menu Items */}
              <div className="mt-4 space-y-2">
                <Link 
                  href="/profile" 
                  className="group flex items-center p-4 rounded-xl bg-gray-50 hover:bg-gray-100 
                    active:bg-gray-200 transition-all duration-200 transform hover:scale-[0.98]"
                >
                  <User className="h-6 w-6 text-gray-600 group-hover:text-blue-600 transition-colors" />
                  <span className="ml-4 text-gray-700 font-medium group-hover:text-gray-900">Profile</span>
                </Link>
                
                <Link 
                  href="/post" 
                  className="group flex items-center p-4 rounded-xl bg-gray-50 hover:bg-gray-100 
                    active:bg-gray-200 transition-all duration-200 transform hover:scale-[0.98]"
                >
                  <FileText className="h-6 w-6 text-gray-600 group-hover:text-green-600 transition-colors" />
                  <span className="ml-4 text-gray-700 font-medium group-hover:text-gray-900">Post</span>
                </Link>
                
                <Link 
                  href="/questions" 
                  className="group flex items-center p-4 rounded-xl bg-gray-50 hover:bg-gray-100 
                    active:bg-gray-200 transition-all duration-200 transform hover:scale-[0.98]"
                >
                  <HelpCircle className="h-6 w-6 text-gray-600 group-hover:text-purple-600 transition-colors" />
                  <span className="ml-4 text-gray-700 font-medium group-hover:text-gray-900">Questions</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trending Modal */}
<div 
  className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-all duration-300 ease-in-out
    ${isTrendingOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
>
  <div className="flex items-center justify-center min-h-screen p-4">
    <div 
      ref={trendingModalRef}
      className={`w-full transform transition-all duration-300 ease-in-out
        ${isTrendingOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        bg-white rounded-2xl shadow-2xl overflow-hidden`}
      style={{ maxWidth: '430px', maxHeight: '90vh' }}
    >
      <TrendingSidebar isMobile={true} onClose={() => setIsTrendingOpen(false)} />
    </div>
  </div>
</div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t xl:hidden z-40 shadow-lg">
        <div className="flex justify-around items-center h-16 px-4 max-w-md mx-auto">
          <Link 
            href="/" 
            className={`p-3 rounded-lg transition-all duration-200 active:bg-gray-100
              ${pathname === '/' ? 'text-blue-600' : 'text-gray-600'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>

          <button 
            className={`p-3 rounded-lg transition-all duration-200 active:bg-gray-100
              ${isModalOpen ? 'text-blue-600' : 'text-gray-600'}`}
            onClick={toggleModal}
            aria-label="Toggle menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <button 
            className={`p-3 rounded-lg transition-all duration-200 active:bg-gray-100
              ${isTrendingOpen ? 'text-blue-600' : 'text-gray-600'}`}
            onClick={toggleTrending}
            aria-label="Trending"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </button>

        </div>
      </div>
    </>
  );
}