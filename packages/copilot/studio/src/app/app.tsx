import { WebSocketProvider } from './WebSocketContext';
import { Header } from './components/ui/header';
import { ControllerPanel } from './components/controllers';
import { TestConfigProvider } from './TestConfigContext';
import { TestResults } from './components/test-results';
import { Scenarios } from './components/scenarios';
import { AgentDrawerProvider } from './AgentDrawerContext';
import { AgentDrawer } from './components/agents/_components';

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
      <TestConfigProvider>
        <AgentDrawerProvider>
          <AppContent />
        </AgentDrawerProvider>
      </TestConfigProvider>
    </WebSocketProvider>
  );
}

export default App;
