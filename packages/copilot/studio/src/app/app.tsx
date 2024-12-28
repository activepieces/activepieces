import { Header } from './components/ui/header';
import { SubHeader } from './components/ui/sub-header';
import { ControllerPanel } from './components/controllers';
import { TestResults } from './components/test-results';
import { Scenarios } from './components/scenarios';
import { AgentDrawerProvider } from './AgentDrawerContext';
import { AgentDrawer } from './components/agents/components';
import { WebSocketProvider } from './providers/websocket-provider';
import { useState } from 'react';

function AppContent() {
  console.debug('Rendering AppContent');
  const [isWorkbenchOpen, setIsWorkbenchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'prompt' | 'evaluate'>('prompt');

  const handlePromptClick = () => {
    setActiveTab('prompt');
  };

  const handleEvaluateClick = () => {
    setActiveTab('evaluate');
  };

  const renderWorkbenchContent = () => {
    if (activeTab === 'prompt') {
      return (
        <div className="flex-1 flex overflow-hidden">
          <ControllerPanel />
          <TestResults />
        </div>
      );
    } else {
      return (
        <div className="flex-1 flex overflow-hidden">
          <Scenarios />
          <TestResults />
        </div>
      );
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <Header onWorkbenchToggle={setIsWorkbenchOpen} />
      <SubHeader 
        isWorkbenchOpen={isWorkbenchOpen}
        onPromptClick={handlePromptClick}
        onEvaluateClick={handleEvaluateClick}
        activeTab={activeTab}
      />
      <AgentDrawer />
      
      {isWorkbenchOpen ? (
        renderWorkbenchContent()
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <p>Select Workbench or Studio to get started</p>
        </div>
      )}
    </div>
  );
}

export function App() {
  return (
    <WebSocketProvider>
      <AgentDrawerProvider>
        <AppContent />
      </AgentDrawerProvider>
    </WebSocketProvider>
  );
}

export default App;
