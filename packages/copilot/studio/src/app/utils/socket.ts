import { io } from 'socket.io-client';

// Create a single socket instance
export const socket = io('http://localhost:3002', {
  transports: ['websocket'],
});

// Add event listeners for connection status
socket.on('connect', () => {
  console.log('WebSocket connected');
});

socket.on('disconnect', () => {
  console.log('WebSocket disconnected');
});

socket.on('connect_error', (error) => {
  console.error('WebSocket connection error:', error);
}); 