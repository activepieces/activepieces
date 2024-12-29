import { Socket } from "socket.io";
import { WebsocketCopilotResult, WebsocketChannelTypes, SystemUpdate } from "@activepieces/copilot-shared";



export function addResult(socket: Socket | null, result: WebsocketCopilotResult) {
  if (!socket) return;
  
  try {
    socket.emit(WebsocketChannelTypes.SET_RESULT, result);
  } catch (error) {
    handleError(socket, error, 'Adding result');
  }
}


export function handleError(socket: Socket, error: unknown, context: string) {
  console.error(`[WebSocket] Error ${context}:`, error);
  
  // Send a generic error message to the client
  socket.emit(WebsocketChannelTypes.SET_RESULT, {
    type: SystemUpdate.ERROR,
    data: {
      message: `Failed while ${context.toLowerCase()}`,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  });
} 