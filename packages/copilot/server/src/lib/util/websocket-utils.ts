import { Socket } from "socket.io";
import { WebsocketCopilotResult, WebsocketEventTypes } from "@activepieces/copilot-shared";



export function addResult(socket: Socket | null, result: WebsocketCopilotResult) {
  if (!socket) return;
  
  try {
    socket.emit(WebsocketEventTypes.UPDATE_RESULTS, result);
  } catch (error) {
    handleError(socket, error, 'Adding result');
  }
}


export function handleError(socket: Socket, error: unknown, context: string) {
  console.error(`[WebSocket] Error ${context}:`, error);
  
  // Send a generic error message to the client
  socket.emit('message', {
    type: 'ERROR',
    data: {
      message: `Failed while ${context.toLowerCase()}`,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  });
} 