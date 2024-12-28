'use client';

import { NavLink, useLocation } from 'react-router-dom';
import { Menu, Settings, Bell, HelpCircle } from 'lucide-react';
import { useAgentDrawer } from '../../AgentDrawerContext';

export const Header = () => {
  const location = useLocation();
  const { openDrawer } = useAgentDrawer();

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="h-14 px-4 flex items-center justify-between">
        {/* Left section: Logo and Navigation */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={openDrawer}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Open agents menu"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              Copilot Studio
            </h1>
          </div>

          <nav className="flex items-center space-x-1">
            <NavLink
              to="/workbench"
              className={({ isActive }) =>
                `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              Workbench
            </NavLink>
            <NavLink
              to="/functions"
              className={({ isActive }) =>
                `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              Functions
            </NavLink>
          </nav>
        </div>

        {/* Right section: Actions */}
        <div className="flex items-center space-x-2">
          <button
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            aria-label="Help"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          <button
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>
          <button
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
          <div className="h-6 w-px bg-gray-200 mx-2"></div>
          <button className="flex items-center space-x-2 px-2 py-1 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium">
              AP
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}; 