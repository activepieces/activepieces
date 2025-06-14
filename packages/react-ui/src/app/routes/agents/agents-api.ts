import { api } from '@/lib/api';
import {
  Agent,
  CreateAgentRequest,
  UpdateAgentRequest,
  RunAgentRequest,
  ListAgentsQueryParams,
  SeekPage,
  Todo,
} from '@activepieces/shared';

export const agentsApi = {
  async list(params?: ListAgentsQueryParams): Promise<SeekPage<Agent>> {
    const searchParams = new URLSearchParams();
    if (params?.limit) {
      searchParams.append('limit', params.limit.toString());
    }
    if (params?.cursor) {
      searchParams.append('cursor', params.cursor);
    }

    const queryString = searchParams.toString();
    const url = `/v1/agents${queryString ? `?${queryString}` : ''}`;

    return await api.get<SeekPage<Agent>>(url);
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

  async run(id: string, request: RunAgentRequest): Promise<Todo> {
    return await api.post<Todo>(`/v1/agents/${id}/todos`, request);
  },

  async delete(id: string): Promise<void> {
    return await api.delete(`/v1/agents/${id}`);
  },
};
