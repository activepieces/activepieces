'use client';

import { Menu, Settings } from 'lucide-react';
import { useAgentDrawer } from '../../AgentDrawerContext';

interface HeaderProps {
  onWorkbenchToggle: (isOpen: boolean) => void;
}

export function Header({ onWorkbenchToggle }: HeaderProps) {
  console.debug('Rendering Header');
  const { openDrawer } = useAgentDrawer();

  return (
    <header className="flex h-14 items-center border-b bg-white px-6 text-gray-600 shadow-sm">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-4">
          <button
            onClick={openDrawer}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Open agents menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            Copilot Studio
          </h1>
        </div>
        
        <nav className="flex items-center gap-6">
          <button 
            onClick={() => onWorkbenchToggle(true)}
            className="text-sm font-medium hover:text-gray-900 transition-colors"
          >
            Workbench
          </button>
          <button 
            className="text-sm font-medium hover:text-gray-900 transition-colors"
          >
            Studio
          </button>
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
} 