import React, { useState } from 'react';
import MindMap from '../components/MindMap';
import ChatInterface from '../components/ChatInterface';

interface MindMapNode {
  id: string;
  content: string;
  priority: 'A' | 'B' | 'C';
  children: MindMapNode[];
}

const Home: React.FC = () => {
  const [mindMap, setMindMap] = useState<MindMapNode | null>(null);

  const updateMindMap = (newMindMap: MindMapNode) => {
    setMindMap(newMindMap);
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-2xl font-bold">Mindmap Maker</h1>
      </header>
      <div className="flex flex-grow">
        <div className="flex-grow">
          <MindMap mindMap={mindMap} updateMindMap={updateMindMap} />
        </div>
        <div className="w-1/4 min-w-[300px]">
          <ChatInterface mindMap={mindMap} updateMindMap={updateMindMap} />
        </div>
      </div>
    </div>
  );
};

export default Home;