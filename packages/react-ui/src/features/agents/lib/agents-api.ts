import { api } from '@/lib/api';
import {
  Agent,
  CreateAgentRequest,
  UpdateAgentRequest,
  ListAgentsQueryParams,
  SeekPage,
} from '@activepieces/shared';

export const agentsApi = {
  async list(params?: ListAgentsQueryParams): Promise<SeekPage<Agent>> {
    const query = {
      limit: params?.limit ?? 100,
      cursor: params?.cursor ?? '',
    };

    return await api.get<SeekPage<Agent>>(`/v1/agents`, query);
  },

  async get(id: string): Promise<Agent> {
    return await api.get<Agent>(`/v1/agents/${id}`);
  },

  async create(request: CreateAgentRequest): Promise<Agent> {
    return await api.post<Agent>(`/v1/agents`, request);
  },

  async update(id: string, request: UpdateAgentRequest): Promise<Agent> {
    return await api.post<Agent>(`/v1/agents/${id}`, request);
  },

  async delete(id: string): Promise<void> {
    return await api.delete(`/v1/agents/${id}`);
  },
};
