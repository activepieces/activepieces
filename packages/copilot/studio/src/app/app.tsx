import { TestResults } from './components/test-results';
import { Scenarios } from './components/scenarios';
import { WebSocketProvider } from './WebSocketContext';
import { Header } from './components/ui/header';

function AppContent() {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 bg-gray-100 overflow-hidden">
        <div className="h-full p-6 flex flex-col">
          <div className="flex-1 min-h-0">
            <div className="grid grid-cols-2 gap-6 h-full">
              <div className="grid grid-rows-1 gap-6 h-full min-h-0">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 overflow-hidden min-h-0">
                  <Scenarios />
                </div>
              </div>

              <div className="grid grid-rows-1 gap-6 h-full min-h-0">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 overflow-hidden min-h-0">
                  <TestResults />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function App() {
  return (
    <WebSocketProvider>
      <AppContent />
    </WebSocketProvider>
  );
}

export default App;
