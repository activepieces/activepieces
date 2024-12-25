import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface WebSocketContextType {
  ws: WebSocket | null;
  isConnected: boolean;
  error: string | null;
  hasEmbeddings: boolean | null;
}

const WebSocketContext = createContext<WebSocketContextType>({
  ws: null,
  isConnected: false,
  error: null,
  hasEmbeddings: null
});

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasEmbeddings, setHasEmbeddings] = useState<boolean | null>(null);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:3002');

    socket.onopen = () => {
      console.debug('WebSocket connected');
      setIsConnected(true);
      setError(null);
      setWs(socket);
      
      // Check for embeddings status immediately after connection
      socket.send(JSON.stringify({ type: 'CHECK_EMBEDDINGS' }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'EMBEDDINGS_STATUS') {
          console.debug('Received embeddings status:', data.hasEmbeddings);
          setHasEmbeddings(data.hasEmbeddings);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    socket.onerror = () => {
      console.error('WebSocket error');
      setError('Failed to connect to test server');
      setIsConnected(false);
      setWs(null);
      setHasEmbeddings(null);
    };

    socket.onclose = () => {
      console.debug('WebSocket disconnected');
      setIsConnected(false);
      setWs(null);
      setHasEmbeddings(null);
    };

    return () => {
      socket.close();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ ws, isConnected, error, hasEmbeddings }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  return useContext(WebSocketContext);
} 