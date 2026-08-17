import { SeekPage } from '@activepieces/core-utils';
import {
  Agent,
  AgentSummary,
  AgentTemplate,
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
  get(id: string): Promise<Agent> {
    return api.get<Agent>(`/v1/agents/${id}`);
  },
  create(request: CreateAgentRequest): Promise<Agent> {
    return api.post<Agent>('/v1/agents', request);
  },
  update(id: string, request: UpdateAgentRequest): Promise<Agent> {
    return api.post<Agent>(`/v1/agents/${id}`, request);
  },
  publish(id: string): Promise<Agent> {
    return api.post<Agent>(`/v1/agents/${id}/publish`, {});
  },
  unpublish(id: string): Promise<Agent> {
    return api.post<Agent>(`/v1/agents/${id}/unpublish`, {});
  },
  delete(id: string): Promise<void> {
    return api.delete<void>(`/v1/agents/${id}`);
  },
  templates(): Promise<SeekPage<AgentTemplate>> {
    return api.get<SeekPage<AgentTemplate>>('/v1/agents/templates');
  },
  draft(request: DraftAgentRequest): Promise<DraftAgentResponse> {
    return api.post<DraftAgentResponse>('/v1/agents/draft', request);
  },
};
