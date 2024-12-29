import { createContext, useContext, useState, ReactNode } from 'react';

interface AgentDrawerContextType {
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const AgentDrawerContext = createContext<AgentDrawerContextType | undefined>(undefined);

export function AgentDrawerProvider({ children }: { children: ReactNode }) {  
  const [isOpen, setIsOpen] = useState(false);

  const openDrawer = () => {
    console.debug('Opening agent drawer');
    setIsOpen(true);
  };

  const closeDrawer = () => {
    console.debug('Closing agent drawer');
    setIsOpen(false);
  };

  return (
    <AgentDrawerContext.Provider value={{ isOpen, openDrawer, closeDrawer }}>
      {children}
    </AgentDrawerContext.Provider>
  );
}

export function useAgentDrawer() {
  const context = useContext(AgentDrawerContext);
  if (context === undefined) {
    throw new Error('useAgentDrawer must be used within an AgentDrawerProvider');
  }
  return context;
} 