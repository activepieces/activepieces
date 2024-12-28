import { Header } from './components/ui/header';
import { ControllerPanel } from './components/controllers';
import { TestResults } from './components/test-results';
import { Scenarios } from './components/scenarios';
import { AgentDrawerProvider } from './AgentDrawerContext';
import { AgentDrawer } from './components/agents/_components';
import { WebSocketProvider } from './providers/websocket-provider';

function AppContent() {
  console.debug('Rendering AppContent');

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <AgentDrawer />
      
      <div className="flex-1 flex overflow-hidden">
        <ControllerPanel />
        <TestResults />
        <Scenarios />
      </div>
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
