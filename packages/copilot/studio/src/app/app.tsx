import { TestResults } from './_components/test-results';
import { Scenarios } from './_components/scenarios';
import { WebSocketProvider, useWebSocket } from './WebSocketContext';

interface AlertBannerProps {
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  icon?: React.ReactNode;
}

const AlertBanner: React.FC<AlertBannerProps> = ({ type, title, message, icon }) => {
  const bgColor = {
    warning: 'bg-yellow-50',
    error: 'bg-red-50',
    info: 'bg-blue-50'
  }[type];

  const textColor = {
    warning: 'text-yellow-800',
    error: 'text-red-800',
    info: 'text-blue-800'
  }[type];

  const borderColor = {
    warning: 'border-yellow-200',
    error: 'border-red-200',
    info: 'border-blue-200'
  }[type];

  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-4 mb-6`}>
      <div className="flex items-start">
        {icon && <div className="flex-shrink-0">{icon}</div>}
        <div className={`${icon ? 'ml-3' : ''}`}>
          <h3 className={`text-sm font-medium ${textColor}`}>{title}</h3>
          <div className={`mt-2 text-sm ${textColor}`}>
            <p>{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const WarningIcon = () => (
  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

function AppContent() {
  const { isConnected, hasEmbeddings } = useWebSocket();

  return (
    <div className="h-screen bg-gray-100 overflow-hidden">
      <div className="h-full p-6 flex flex-col">
        <div className="flex-none mb-6">
          <h1 className="text-3xl font-bold">Copilot Studio</h1>
          
          {isConnected && hasEmbeddings === false && (
            <AlertBanner
              type="warning"
              title="Embeddings Required"
              message="Please generate embeddings before running test results. Run the embeddings generation command in your terminal."
              icon={<WarningIcon />}
            />
          )}
        </div>
        
        <div className="flex-1 min-h-0">
          <div className="grid grid-cols-2 gap-6 h-full">
          
            <div className="grid grid-rows-2 gap-6 h-full min-h-0">
        
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
