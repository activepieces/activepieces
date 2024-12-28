import { WebSocketProvider } from './WebSocketContext';
import { Header } from './components/ui/header';
import { ControllerPanel } from './components/controllers';
import { TestConfigProvider } from './TestConfigContext';
import { TestResults } from './components/test-results';
import { Scenarios } from './components/scenarios';


function AppContent() {

  return (
    <div className="h-screen flex flex-col">
      <Header />
      
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
        <AppContent />
      </TestConfigProvider>
    </WebSocketProvider>
  );
}

export default App;
