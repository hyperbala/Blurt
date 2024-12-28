// components/LeftSidebar.jsx
'use client'
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, Tag, FileText, HelpCircle, X } from 'lucide-react';

const LeftSidebar = ({ isMobile, onClose }) => {
  const pathname = usePathname();

  const navItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: User, label: 'Profile', href: '/profile' },
    { icon: FileText, label: 'Posts', href: '/post' },
    { icon: HelpCircle, label: 'Questions', href: '/question' }
  ];

  const sidebarContent = (
    <div className={`${isMobile ? 'pt-12' : 'sticky top-[100px]'} space-y-4`}>
      <nav className={`border border-gray-200 rounded-lg p-4 bg-white ${isMobile ? 'border-none' : ''}`}>
        {isMobile && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={24} />
          </button>
        )}
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  onClick={isMobile ? onClose : undefined}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-green-50 text-green-600 font-medium' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <Icon 
                    size={20} 
                    className={isActive ? 'text-green-600' : 'text-gray-500'} 
                  />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );

  return sidebarContent;
};

export default LeftSidebar;