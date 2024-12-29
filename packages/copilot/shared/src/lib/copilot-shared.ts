import { AgentCommandUpdate } from "./functions/agents";
import { PieceCommandUpdate } from "./functions/search-pieces";
import { TestRegistryCommandUpdate } from "./functions/tester";

export enum WebsocketChannelTypes {
  CONNECT = 'connection',
  DISCONNECT = 'disconnect',
  COMMAND = 'command',
  UPDATE_RESULT = 'update_result',
  SET_RESULT = 'set_result',
  GET_STATE = 'get_state',

}


export enum SystemUpdate {
  ERROR = 'ERROR',
  STATE = 'STATE'
}

// Combined type for all possible updates
export type WebsocketCopilotUpdate = 
  | PieceCommandUpdate
  | AgentCommandUpdate
  | TestRegistryCommandUpdate
  | SystemUpdate;

// Type-safe result interface
export type WebsocketCopilotResult<T = any> = {
  type: WebsocketCopilotUpdate;
  data: T;
}

export interface BaseAgentConfig {
  enabled: boolean;
  model: string;
  temperature: number;
  maxSteps: number;
  tools: Array<{
    name: string;
    function: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, unknown>;
      required: string[];
    };
  }>;
  systemPrompt: string;
  outputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  };
}

export interface RunTestsParams {
  scenarioTitle: string;
  agentConfig?: BaseAgentConfig;
}

export enum SystemCommand {
  ERROR = 'ERROR',
}


