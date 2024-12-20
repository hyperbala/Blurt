'use client'

import { createContext, useContext, useState } from 'react';

const TopicContext = createContext();

export function TopicProvider({ children }) {
  const [selectedTopic, setSelectedTopic] = useState(null);

  return (
    <TopicContext.Provider value={{ selectedTopic, setSelectedTopic }}>
      {children}
    </TopicContext.Provider>
  );
}

export function useTopicContext() {
  const context = useContext(TopicContext);
  if (context === undefined) {
    throw new Error('useTopicContext must be used within a TopicProvider');
  }
  return context;
}