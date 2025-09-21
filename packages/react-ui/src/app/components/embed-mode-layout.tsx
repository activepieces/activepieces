import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useEmbedMode } from '@/hooks/use-embed-mode';
import { cn } from '@/lib/utils';

interface EmbedModeLayoutProps {
  children: React.ReactNode;
}

export const EmbedModeLayout: React.FC<EmbedModeLayoutProps> = ({ children }) => {
  const { isEmbedMode } = useEmbedMode();
  const location = useLocation();
  const navigate = useNavigate();

  // If not in embed mode, render children normally
  if (!isEmbedMode) {
    return <>{children}</>;
  }

  // In embed mode, render minimal layout with tabs
  const currentPath = location.pathname;
  
  const tabs = [
    { path: '/flows', label: 'Flows' },
    { path: '/tables', label: 'Tables' },
    { path: '/connections', label: 'Connections' },
  ];

  const handleTabClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="h-screen w-full flex flex-col">
      {/* Minimal top tabs bar */}
      <div className="border-b bg-background px-4 py-2">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.path}
              onClick={() => handleTabClick(tab.path)}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                currentPath === tab.path || currentPath.startsWith(tab.path + '/')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};
