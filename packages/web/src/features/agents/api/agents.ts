import { SeekPage } from '@activepieces/core-utils';
import {
  Agent,
  AgentWithUsage,
  GetAgentRequest,
  AgentSummary,
  CreateAgentRequest,
  DraftAgentRequest,
  DraftAgentResponse,
  ListAgentsRequest,
  UpdateAgentRequest,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const agentsApi = {
  list(request: ListAgentsRequest): Promise<SeekPage<AgentSummary>> {
    return api.get<SeekPage<AgentSummary>>('/v1/agents', request);
  },
  get(id: string, request?: GetAgentRequest): Promise<AgentWithUsage> {
    return api.get<AgentWithUsage>(`/v1/agents/${id}`, {
      ...(request?.includeUsage === true ? { includeUsage: 'true' } : {}),
    });
  },
  create(request: CreateAgentRequest): Promise<Agent> {
    return api.post<Agent>('/v1/agents', request);
  },
  update(id: string, request: UpdateAgentRequest): Promise<Agent> {
    return api.post<Agent>(`/v1/agents/${id}`, request);
  },
  draft(request: DraftAgentRequest): Promise<DraftAgentResponse> {
    return api.post<DraftAgentResponse>('/v1/agents/draft', request);
  },
  delete(id: string): Promise<void> {
    return api.delete<void>(`/v1/agents/${id}`);
  },
};
