
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm shadow-md p-3 sm:p-4 border-b border-gray-700">
      <div className="flex items-center space-x-3 sm:space-x-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-cyan-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 6.5l-1-1M11 10l-1-1M17 13l-1-1M8 16l-1-1" />
        </svg>
        <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-bold text-white truncate">Mermaid Diagram Generator</h1>
            <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">Create professional diagrams from code with a real-time preview.</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
