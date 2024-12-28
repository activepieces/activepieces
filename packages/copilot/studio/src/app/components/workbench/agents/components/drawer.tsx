import { X } from 'lucide-react';
import { useAgentDrawer } from '../../../../AgentDrawerContext';
import { AgentsList } from './agents-list';
import { cn } from '../../../../../lib/utils';

export const AgentDrawer = () => {
  console.debug('Rendering AgentDrawer');
  
  const { isOpen, closeDrawer } = useAgentDrawer();

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          'fixed inset-0 bg-gray-900/50 transition-opacity z-40',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Close button */}
        <button
          onClick={closeDrawer}
          className="absolute right-4 top-4 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Close drawer"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Content */}
        <div className="h-full">
          <AgentsList />
        </div>
      </div>
    </>
  );
}; 