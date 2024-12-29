import { Socket } from "socket.io";
import { WebsocketCopilotCommand } from "@activepieces/copilot-shared";

export interface WebSocketCommandData {
  command: WebsocketCopilotCommand;
  data: Record<string, any>;
}

export interface WebSocketCommandHandler<T extends Record<string, any> = Record<string, any>> {
  command: WebsocketCopilotCommand;
  handle: (socket: Socket, data: T) => Promise<void>;
}

export const createCommandHandler = <T extends Record<string, any>>(
  command: WebsocketCopilotCommand,
  handleFn: (socket: Socket, data: T) => Promise<void>
): WebSocketCommandHandler<T> => ({
  command,
  handle: handleFn,
}); 