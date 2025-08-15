import { api } from '@/lib/api';
import {
  CreateAgentRequest,
  UpdateAgentRequestBody,
  ListAgentsQueryParams,
  ListAgentRunsQueryParams,
  SeekPage,
  AgentRun,
  RunAgentRequestBody,
  EnhancedAgentPrompt,
  EnhaceAgentPrompt,
  PopulatedAgent,
} from '@activepieces/shared';

export const agentsApi = {
  async list(
    params?: ListAgentsQueryParams,
  ): Promise<SeekPage<PopulatedAgent>> {
    return await api.get<SeekPage<PopulatedAgent>>(`/v1/agents`, params);
  },

  async get(id: string): Promise<PopulatedAgent> {
    return await api.get<PopulatedAgent>(`/v1/agents/${id}`);
  },
  async findByExteranlId(externalId: string): Promise<PopulatedAgent | null> {
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

  async create(request: CreateAgentRequest): Promise<PopulatedAgent> {
    return await api.post<PopulatedAgent>(`/v1/agents`, request);
  },

  async update(
    id: string,
    request: UpdateAgentRequestBody,
  ): Promise<PopulatedAgent> {
    return await api.post<PopulatedAgent>(`/v1/agents/${id}`, request);
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
