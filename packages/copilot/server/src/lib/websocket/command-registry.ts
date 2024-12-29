import { AgentCommand, PieceCommand, TestCommand, WebsocketCopilotCommand } from "@activepieces/copilot-shared";
import { WebSocketCommandHandler } from "./handlers/command-handler";
import { searchPiecesHandler } from "./handlers/search-pieces.handler";
import { testAgentHandler } from "./handlers/test-agent.handler";
import { getAgentRegistryHandler } from "./handlers/get-agent-registry.handler";

type AnyCommandHandler = 
  | WebSocketCommandHandler<{ query: string }>
  | WebSocketCommandHandler<{ agentName: string, prompt: string }>
  | WebSocketCommandHandler<Record<string, never>>;

const handlers = new Map<WebsocketCopilotCommand, AnyCommandHandler>([
  [PieceCommand.SEARCH_PIECES, searchPiecesHandler],
  [AgentCommand.TEST_AGENT, testAgentHandler],
  [AgentCommand.GET_AGENT_REGISTRY, getAgentRegistryHandler],
]);

export const getHandler = (command: WebsocketCopilotCommand) => handlers.get(command);

export const hasHandler = (command: WebsocketCopilotCommand): boolean => handlers.has(command);

export const commandRegistry = {
  getHandler,
  hasHandler,
}; 