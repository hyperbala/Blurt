// components/MobileDrawer.jsx
'use client'
import { useEffect } from 'react';

export default function MobileDrawer({ isOpen, onClose, position = 'left', children }) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className={`fixed top-0 ${position}-0 h-full w-[280px] bg-white z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto`}
      >
        {children}
      </div>
    </>
  );
}
