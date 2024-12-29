




import { SystemCommand } from "../copilot-shared";
import { AgentCommand } from "./agents";
import { PieceCommand } from "./search-pieces";
import { TestRegistryCommand } from "./tester";


export type WebsocketCopilotCommand = 
  | PieceCommand
  | AgentCommand
  | SystemCommand
  | TestRegistryCommand;

export interface SearchPiecesRequest {
  command: PieceCommand.SEARCH_PIECES;
  data: {
    query: string;
  };
}

export interface TestAgentRequest {
  command: AgentCommand.TEST_AGENT;
  data: {
    agentName: string;
    prompt: string;
  };
}

export interface GetAgentRegistryRequest {
  command: AgentCommand.GET_AGENT_REGISTRY;
  data: Record<string, never>;
}


export type WebsocketRequest = 
  | SearchPiecesRequest
  | TestAgentRequest
  | GetAgentRegistryRequest;

export interface PieceSearchResult {
  pieceName: string;
  content: string;
  logoUrl: string;
  relevanceScore: number;
}

  
  
export * from "./search-pieces";
export * from "./tester";
export * from "./agents";
