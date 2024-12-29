import { WebsocketCopilotCommand, RunTestsParams } from "@activepieces/copilot-shared";
import { WebSocketCommand, WebSocketCommandHandler } from "./handlers/command-handler";
import { searchPiecesHandler } from "./handlers/search-pieces.handler";

type AnyCommandHandler = 
  | WebSocketCommandHandler<{ query: string }>
  | WebSocketCommandHandler<RunTestsParams>
  | WebSocketCommandHandler<Record<string, never>>;

const handlers = new Map<WebSocketCommand, AnyCommandHandler>([
  [WebsocketCopilotCommand.SEARCH_PIECES, searchPiecesHandler],
]);

export const getHandler = (command: WebSocketCommand) => handlers.get(command);

export const hasHandler = (command: WebSocketCommand): boolean => handlers.has(command);

export const commandRegistry = {
  getHandler,
  hasHandler,
}; 