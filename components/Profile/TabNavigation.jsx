// components/Profile/TabNavigation.jsx
'use client';

export default function TabNavigation({ activeTab, onTabChange, isOwnProfile }) {
  // Define different sets of tabs based on whether it's own profile or not
  const tabs = isOwnProfile 
    ? ['Posts', 'Questions', 'Saved', 'Liked']
    : ['Posts', 'Questions'];
  
  return (
    <nav className="flex justify-between gap-3 mb-6">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab.toLowerCase())}
          className={`px-4 py-2 rounded-full text-sm flex-1 transition-colors ${
            activeTab === tab.toLowerCase()
              ? 'bg-green-600 text-white'
              : 'bg-green-50 text-green-800 hover:bg-green-100'
          }`}
        >
          {tab}
        </button>
      ))}
    </nav>
  );
}