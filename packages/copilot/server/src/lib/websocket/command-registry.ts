import { WebsocketCopilotCommand, RunTestsParams } from "@activepieces/copilot-shared";
import { WebSocketCommand, WebSocketCommandHandler } from "./handlers/command-handler";
import { searchPiecesHandler } from "./handlers/search-pieces.handler";
import { testAgentHandler } from "./handlers/test-agent.handler";

type AnyCommandHandler = 
  | WebSocketCommandHandler<{ query: string }>
  | WebSocketCommandHandler<RunTestsParams>
  | WebSocketCommandHandler<{ agentName: string, prompt: string }>
  | WebSocketCommandHandler<Record<string, never>>;

const handlers = new Map<WebSocketCommand, AnyCommandHandler>([
  [WebsocketCopilotCommand.SEARCH_PIECES, searchPiecesHandler],
  [WebsocketCopilotCommand.TEST_AGENT, testAgentHandler],
]);

export const getHandler = (command: WebSocketCommand) => handlers.get(command);

export const hasHandler = (command: WebSocketCommand): boolean => handlers.has(command);

export const commandRegistry = {
  getHandler,
  hasHandler,
}; 