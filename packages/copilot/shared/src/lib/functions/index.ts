// Command categories
export enum PieceCommand {
  SEARCH_PIECES = 'SEARCH_PIECES'
}

export enum TestCommand {
  RUN_TESTS = 'RUN_TESTS'
}

export enum AgentCommand {
  TEST_AGENT = 'TEST_AGENT',
  GET_AGENT_REGISTRY = 'GET_AGENT_REGISTRY'
}

export type WebsocketCopilotCommand = 
  | PieceCommand
  | TestCommand
  | AgentCommand;

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

export interface RunTestsRequest {
  command: TestCommand.RUN_TESTS;
  data: {
    scenarioTitle: string;
    agentConfig?: any;
  };
}

export type WebsocketRequest = 
  | SearchPiecesRequest
  | TestAgentRequest
  | RunTestsRequest
  | GetAgentRegistryRequest;

export interface PieceSearchResult {
  pieceName: string;
  content: string;
  logoUrl: string;
  relevanceScore: number;
}

  
  