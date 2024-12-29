import { Header } from './components/ui/header';
import { AgentDrawerProvider } from './AgentDrawerContext';
import { AgentDrawer } from './components/workbench/agents/components';
import { WebSocketProvider } from './providers/websocket-provider';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Workbench } from './components/workbench';
import { Functions } from './components/functions';

function AppContent() {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <AgentDrawer />
      <Routes>
        <Route path="/" element={<Navigate to="/workbench" replace />} />
        <Route path="/workbench" element={<Workbench />} />
        <Route path="/functions" element={<Functions />} />
      </Routes>
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
