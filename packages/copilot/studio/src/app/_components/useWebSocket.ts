import { useEffect, useState, useRef, useCallback } from 'react';

export interface WebSocketState {
  ws: WebSocket | null;
  isConnected: boolean;
  error: string | null;
}

export function useWebSocket(url: string): WebSocketState {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number>();
  const connectAttempts = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  const connect = useCallback(() => {
    try {
      // Clear any existing connection
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      // Don't try to reconnect too many times
      if (connectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
        setError('Maximum reconnection attempts reached. Please refresh the page.');
        return;
      }

      const socket = new WebSocket(url);
      wsRef.current = socket;

      socket.onopen = () => {
        console.debug('WebSocket connected');
        setIsConnected(true);
        setError(null);
        connectAttempts.current = 0; // Reset attempts on successful connection
      };

      socket.onerror = () => {
        if (wsRef.current === socket) {
          setIsConnected(false);
          connectAttempts.current++;
          
          if (connectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
            setError('Failed to connect to test server. Please refresh the page.');
          } else {
            setError('Connection error - attempting to reconnect...');
          }
        }
      };

      socket.onclose = () => {
        if (wsRef.current === socket) {
          console.debug('WebSocket disconnected');
          setIsConnected(false);
          
          // Only attempt to reconnect if we haven't reached the maximum attempts
          if (connectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
            const backoffTime = Math.min(1000 * Math.pow(2, connectAttempts.current), 10000);
            reconnectTimeoutRef.current = window.setTimeout(() => {
              connect();
            }, backoffTime);
          }
        }
      };

    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError('Failed to create WebSocket connection');
      setIsConnected(false);
    }
  }, [url]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return {
    ws: wsRef.current,
    isConnected,
    error
  };
} 