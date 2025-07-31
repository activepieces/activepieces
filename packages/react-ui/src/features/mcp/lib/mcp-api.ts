import { api } from '@/lib/api';
import {
  ListMcpsRequest,
  SeekPage,
  UpdateMcpRequestBody,
  McpWithTools,
  CreateMcpRequestBody,
} from '@activepieces/shared';

export const mcpApi = {
  async create(request: CreateMcpRequestBody): Promise<McpWithTools> {
    return await api.post<McpWithTools>('/v1/mcp-servers', request);
  },

  async list(request: ListMcpsRequest): Promise<SeekPage<McpWithTools>> {
    return await api.get<SeekPage<McpWithTools>>('/v1/mcp-servers', request);
  },

  async get(id: string): Promise<McpWithTools> {
    return await api.get<McpWithTools>(`/v1/mcp-servers/${id}`);
  },

  async update(
    id: string,
    request: UpdateMcpRequestBody,
  ): Promise<McpWithTools> {
    return await api.post<McpWithTools>(`/v1/mcp-servers/${id}`, request);
  },

  async rotateToken(id: string): Promise<McpWithTools> {
    return await api.post<McpWithTools>(`/v1/mcp-servers/${id}/rotate`);
  },

  async delete(id: string): Promise<void> {
    return await api.delete(`/v1/mcp-servers/${id}`);
  },
};
