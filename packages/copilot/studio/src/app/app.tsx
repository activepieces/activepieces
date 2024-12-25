import { WebSocketProvider } from './WebSocketContext';
import { Header } from './components/ui/header';
import { ControllerSidebar } from './_components/controller-sidebar';
import { MainContent } from './_components/main-content';
import { ScenariosPanel } from './_components/scenarios-panel';
import { TestConfigProvider } from './TestConfigContext';

function AppContent() {
  console.debug('Rendering AppContent component');

  return (
    <div className="h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        <ControllerSidebar />
        <MainContent />
        <ScenariosPanel />
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
