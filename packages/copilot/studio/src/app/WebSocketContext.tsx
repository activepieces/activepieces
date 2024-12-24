import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface WebSocketContextType {
  ws: WebSocket | null;
  isConnected: boolean;
  error: string | null;
}

const WebSocketContext = createContext<WebSocketContextType>({
  ws: null,
  isConnected: false,
  error: null
});

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:3002');

    socket.onopen = () => {
      console.debug('WebSocket connected');
      setIsConnected(true);
      setError(null);
      setWs(socket);
    };

    socket.onerror = () => {
      console.error('WebSocket error');
      setError('Failed to connect to test server');
      setIsConnected(false);
      setWs(null);
    };

    socket.onclose = () => {
      console.debug('WebSocket disconnected');
      setIsConnected(false);
      setWs(null);
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ ws, isConnected, error }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  return useContext(WebSocketContext);
} 