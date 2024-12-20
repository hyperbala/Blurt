//components/TrendingSidebar.jsx
'use client'
import React, { useState, useEffect } from 'react';
import { TrendingUp, Settings, Hash, X } from 'lucide-react';
import { useTopicContext } from '../contexts/TopicContext';

const TrendingSidebar = ({ isMobile, onClose }) => {
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const { selectedTopic, setSelectedTopic } = useTopicContext();

  useEffect(() => {
    const fetchTrendingTopics = async () => {
      try {
        const response = await fetch('/api/trending');
        const data = await response.json();
        setTrendingTopics(data.slice(0, 3));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching trending topics:', error);
        setLoading(false);
      }
    };

    fetchTrendingTopics();
  }, []);

  const handleTopicClick = (topic) => {
    setSelectedTopic(selectedTopic?.title === topic.title ? null : topic);
    if (isMobile) onClose();
  };

  const sidebarContent = (
    <div className={`${isMobile ? 'pt-12' : 'sticky top-[100px]'} space-y-4`}>
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Trending</h2>
          </div>
          {isMobile ? (
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X size={24} />
            </button>
          ) : (
            <Settings className="w-5 h-5 text-gray-600 hover:text-green-600 cursor-pointer" />
          )}
        </div>

        {loading ? (
          <div className="p-4 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
          </div>
        ) : trendingTopics.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No trending topics at the moment
          </div>
        ) : (
          <div>
            {trendingTopics.map((topic, index) => (
              <div
                key={index}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200 border-b border-gray-200 last:border-none ${
                  selectedTopic?.title === topic.title ? 'bg-green-50' : ''
                }`}
                onClick={() => handleTopicClick(topic)}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Hash className="w-4 h-4" />
                    <span className="text-xs font-medium">Trending</span>
                  </div>
                  <p className="font-semibold text-gray-900">{topic.title}</p>
                  <p className="text-sm text-gray-500">
                    {topic.postsCount} {topic.postsCount === 1 ? 'post' : 'posts'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return sidebarContent;
};

export default TrendingSidebar;
