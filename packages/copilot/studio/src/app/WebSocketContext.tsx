import { State, WebsocketEventTypes, WebsocketCopilotResult } from '@activepieces/copilot-shared';
import {
  createContext,
  useContext,
  useEffect,
  ReactNode,
  useState,
  useRef,
} from 'react';
import { Socket, io } from 'socket.io-client';

interface WebSocketContextType {
  socket: Socket | null;
  state: State | null;
  results: WebsocketCopilotResult[];
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  state: null,
  results: [],
});

export function WebSocketProvider({ children }: { children: ReactNode }) {
  // Use useRef to maintain a single socket instance across re-renders
  const socketRef = useRef<Socket | null>(null);
  const [results, setResults] = useState<WebsocketCopilotResult[]>([]);
  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    // Only create socket if it doesn't exist
    if (!socketRef.current) {
      socketRef.current = io('http://localhost:3002', {
        transports: ['websocket'],
      });
    }

    const socket = socketRef.current;

    if (!socket.connected) {
      socket.connect();
      socket.emit(WebsocketEventTypes.GET_STATE);
    }

    socket.on(WebsocketEventTypes.RESPONSE_GET_STATE, (data: State) => {
      setState(data);
    });

    socket.on(WebsocketEventTypes.UPDATE_RESULTS, (result: WebsocketCopilotResult) => {
      setResults((prevResults) => [...prevResults, result]);
    });

    return () => {
      socket.off(WebsocketEventTypes.RESPONSE_GET_STATE);
      socket.off(WebsocketEventTypes.UPDATE_RESULTS);
    };
  }, []); // Empty dependency array since we're using ref

  return (
    <WebSocketContext.Provider value={{ socket: socketRef.current, state, results }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  return useContext(WebSocketContext);
}
