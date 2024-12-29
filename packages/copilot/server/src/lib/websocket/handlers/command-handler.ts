import { Socket } from "socket.io";
import { WebsocketCopilotCommand, WebsocketEventTypes } from "@activepieces/copilot-shared";

export type WebSocketCommand = WebsocketCopilotCommand | WebsocketEventTypes;

export interface WebSocketCommandData {
  command: WebSocketCommand;
  data: Record<string, any>;
}

export interface WebSocketCommandHandler<T extends Record<string, any> = Record<string, any>> {
  command: WebSocketCommand;
  handle: (socket: Socket, data: T) => Promise<void>;
}

export const createCommandHandler = <T extends Record<string, any>>(
  command: WebSocketCommand,
  handleFn: (socket: Socket, data: T) => Promise<void>
): WebSocketCommandHandler<T> => ({
  command,
  handle: handleFn,
}); 