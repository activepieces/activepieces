import { api } from '@/lib/api';
import {
  Agent,
  CreateAgentRequest,
  UpdateAgentRequestBody,
  ListAgentsQueryParams,
  ListAgentRunsQueryParams,
  SeekPage,
  AgentRun,
  RunAgentRequestBody,
  EnhancedAgentPrompt,
  EnhaceAgentPrompt,
} from '@activepieces/shared';

export const agentsApi = {
  async list(params?: ListAgentsQueryParams): Promise<SeekPage<Agent>> {
    return await api.get<SeekPage<Agent>>(`/v1/agents`, params);
  },

  async get(id: string): Promise<Agent> {
    return await api.get<Agent>(`/v1/agents/${id}`);
  },
  async findByExteranlId(externalId: string): Promise<Agent | null> {
    const seekPage = await agentsApi.list({
      externalIds: [externalId],
    });
    return seekPage.data?.[0] ?? null;
  },

  async enhanceAgentPrompt(
    request: EnhaceAgentPrompt,
  ): Promise<EnhancedAgentPrompt> {
    return await api.post<EnhancedAgentPrompt>(
      `/v1/agents/enhance-prompt`,
      request,
    );
  },

  async create(request: CreateAgentRequest): Promise<Agent> {
    return await api.post<Agent>(`/v1/agents`, request);
  },

  async update(id: string, request: UpdateAgentRequestBody): Promise<Agent> {
    return await api.post<Agent>(`/v1/agents/${id}`, request);
  },

  async delete(id: string): Promise<void> {
    return await api.delete(`/v1/agents/${id}`);
  },
};

export const agentRunsApi = {
  async list(params: ListAgentRunsQueryParams): Promise<SeekPage<AgentRun>> {
    return await api.get<SeekPage<AgentRun>>(`/v1/agent-runs`, params);
  },
  async get(id: string): Promise<AgentRun> {
    return await api.get<AgentRun>(`/v1/agent-runs/${id}`);
  },
  async run(request: RunAgentRequestBody): Promise<AgentRun> {
    return await api.post<AgentRun>(`/v1/agent-runs`, request);
  },
};
