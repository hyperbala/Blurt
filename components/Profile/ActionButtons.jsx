'use client';

import React from 'react';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/react";

const ActionButtons = ({ onSortChange }) => {
  return (
    <div className="flex gap-3 mb-6">
      <button className="px-4 py-2 bg-white border border-green-200 rounded-full text-sm text-green-700 hover:bg-green-50 transition-colors flex items-center gap-1">
        <span>+</span> Create Post
      </button>
      
      <Dropdown>
        <DropdownTrigger>
          <button className="px-4 py-2 bg-white border border-green-200 rounded-full text-sm text-green-700 hover:bg-green-50 transition-colors flex items-center gap-1">
            Sort by <span className="ml-1">▼</span>
          </button>
        </DropdownTrigger>
        <DropdownMenu 
          aria-label="Sort options"
        >
          <DropdownItem onClick={() => onSortChange('new')}>Newest</DropdownItem>
          <DropdownItem onClick={() => onSortChange('old')}>Oldest</DropdownItem>
          <DropdownItem onClick={() => onSortChange('liked')}>Most Liked</DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
};

export default ActionButtons;