import { Header } from './components/ui/header';
import { AgentDrawerProvider } from './AgentDrawerContext';
import { AgentDrawer } from './components/workbench/agents/components';
import { WebSocketProvider } from './providers/websocket-provider';
import { useState } from 'react';
import { Workbench } from './components/workbench';

function AppContent() {
  console.debug('Rendering AppContent');
  const [isWorkbenchOpen, setIsWorkbenchOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col">
      <Header onWorkbenchToggle={setIsWorkbenchOpen} />
      <AgentDrawer />
      <Workbench isOpen={isWorkbenchOpen} />
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
