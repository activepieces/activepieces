import { AgentCommand, GetTestRegistryRequest, PieceCommand, TestRegistryCommand, WebsocketCopilotCommand } from "@activepieces/copilot-shared";
import { WebSocketCommandHandler } from "./handlers/command-handler";
import { searchPiecesHandler } from "./handlers/search-pieces.handler";
import { testAgentHandler } from "./handlers/test-agent.handler";
import { getAgentRegistryHandler } from "./handlers/get-agent-registry.handler";
import { getTestRegistryHandler } from './handlers/get-test-registry.handler'

type AnyCommandHandler = 
  | WebSocketCommandHandler<{ query: string }>
  | WebSocketCommandHandler<{ agentName: string, prompt: string, testId: string }>
  | WebSocketCommandHandler<Record<string, never>>
  | WebSocketCommandHandler<GetTestRegistryRequest>

const handlers = new Map<WebsocketCopilotCommand, AnyCommandHandler>([
  [PieceCommand.SEARCH_PIECES, searchPiecesHandler],
  [AgentCommand.TEST_AGENT, testAgentHandler],
  [AgentCommand.GET_AGENT_REGISTRY, getAgentRegistryHandler],
  [TestRegistryCommand.GET_TEST_REGISTRY, getTestRegistryHandler],
]);

export const getHandler = (command: WebsocketCopilotCommand) => handlers.get(command);

export const hasHandler = (command: WebsocketCopilotCommand): boolean => handlers.has(command);

export const commandRegistry = {
  getHandler,
  hasHandler,
  [TestRegistryCommand.GET_TEST_REGISTRY]: getTestRegistryHandler,
} as const; 