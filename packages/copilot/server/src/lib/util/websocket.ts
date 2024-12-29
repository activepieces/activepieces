import { Server, Socket } from "socket.io";
import { WebsocketChannelTypes, WebsocketCopilotCommand } from "@activepieces/copilot-shared";
import { handleError } from './websocket-utils';
import { commandRegistry } from "../websocket/command-registry";
import { WebSocketCommandData } from "../websocket/handlers/command-handler";

export function startWebSocketServer() {
  const io = new Server(3002, {
    cors: {
      origin: "*"
    }
  });

  io.on('connection', (socket: Socket) => {
    console.debug('[WebSocket] New connection established');

    // Handle all incoming messages using the command registry
    socket.on('message', async (message: { command: WebsocketCopilotCommand; data: any }) => {
      try {
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

    socket.on('disconnect', () => {
      console.debug('[WebSocket] Connection closed');
    });
  });
}