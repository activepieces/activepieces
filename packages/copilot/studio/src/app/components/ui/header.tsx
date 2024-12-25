'use client';

import { Settings } from 'lucide-react';

export const Header = () => {
  return (
    <header className="flex h-14 items-center border-b bg-white px-6 text-gray-600 shadow-sm">
      <div className="flex items-center gap-8">
        <h1 className="text-lg font-semibold text-gray-900">
          Copilot Studio
        </h1>
        
        <nav className="flex items-center gap-6">
          <a 
            href="#dashboard" 
            className="text-sm font-medium hover:text-gray-900 transition-colors"
          >
            Dashboard
          </a>
          <a 
            href="#workbench" 
            className="text-sm font-medium hover:text-gray-900 transition-colors"
          >
            Workbench
          </a>
        </nav>
      </div>
      
      <div className="flex flex-1 items-center justify-end gap-4">
        <a 
          href="#feedback" 
          className="text-sm font-medium hover:text-gray-900 transition-colors"
        >
          Feedback
        </a>
        <a 
          href="#settings" 
          className="flex items-center hover:text-gray-900 transition-colors"
        >
          <Settings className="h-5 w-5" />
        </a>
      </div>
    </header>
  );
}; 