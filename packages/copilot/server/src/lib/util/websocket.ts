import { Server, Socket } from "socket.io";
import { SystemUpdate, WebsocketChannelTypes, WebsocketCopilotCommand } from "@activepieces/copilot-shared";
import { handleError } from './websocket-utils';
import { commandRegistry } from "../websocket/command-registry";

export function startWebSocketServer() {
  const io = new Server(3002, {
    cors: {
      origin: "*"
    }
  });

  io.on(WebsocketChannelTypes.CONNECT, (socket: Socket) => {

    // Handle all incoming messages using the command registry
    socket.on(WebsocketChannelTypes.COMMAND, async (message: { command: WebsocketCopilotCommand; data: any }) => {
      try {
        console.debug('[WebSocket] Handling command:', message.command);
        const handler = commandRegistry.getHandler(message.command);
        
        if (handler) {
          await handler.handle(socket, message.data);
        } else {
          console.warn('[WebSocket] No handler found for command:', message.command);
        }
      } catch (error) {
        handleError(socket, error, `Handling command: ${message.command}`);
      }
    });

    socket.on(WebsocketChannelTypes.GET_STATE, () => {
      console.debug('[WebSocket] Getting state');
      socket.emit(WebsocketChannelTypes.SET_RESULT, {
        type: SystemUpdate.STATE,
        data: {
          state: 'connected'
        }
      });
    });

    socket.on(WebsocketChannelTypes.DISCONNECT, () => {
      console.debug('[WebSocket] Connection closed');
    });
  });
}