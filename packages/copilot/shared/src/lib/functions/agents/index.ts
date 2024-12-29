import { BaseAgentConfig } from '../../copilot-shared';

export enum AgentCommandUpdate {
    AGENT_TEST_STARTED = 'AGENT_TEST_STARTED',
    AGENT_TEST_COMPLETED = 'AGENT_TEST_COMPLETED',
    AGENT_TEST_ERROR = 'AGENT_TEST_ERROR',
    AGENT_REGISTRY_UPDATED = 'AGENT_REGISTRY_UPDATED'

  }

export enum AgentCommand {
    TEST_AGENT = 'TEST_AGENT',
    GET_AGENT_REGISTRY = 'GET_AGENT_REGISTRY'
  }

export interface AgentRegistryEntry {
  name: string;
  config: BaseAgentConfig;
}

export interface GetAgentRegistryResponse {
  type: AgentCommandUpdate.AGENT_REGISTRY_UPDATED;
  data: Record<string, BaseAgentConfig>;
}
