import { api } from '@/lib/api';
import {
  ListMcpsRequestQuery,
  McpPieceStatus,
  McpPieceWithConnection,
  McpWithActions,
  SeekPage,
  UpdateMcpRequestBody,
  UpdateMcpActionsRequestBody,
  McpActionWithConnection,
} from '@activepieces/shared';

export const mcpApi = {
  async list(request: ListMcpsRequestQuery): Promise<SeekPage<McpWithActions>> {
    return await api.get<SeekPage<McpWithActions>>('/v1/mcp-servers', request);
  },

  async get(id: string): Promise<McpWithActions> {
    return await api.get<McpWithActions>(`/v1/mcp-servers/${id}`);
  },

  async create(name: string): Promise<McpWithActions> {
    return await api.post<McpWithActions>('/v1/mcp-servers', { name });
  },

  async update(id: string, request: UpdateMcpRequestBody): Promise<McpWithActions> {
    return await api.post<McpWithActions>(`/v1/mcp-servers/${id}`, request);
  },

  async delete(id: string): Promise<void> {
    return await api.delete(`/v1/mcp-servers/${id}`);
  },

  async rotateToken(id: string): Promise<McpWithActions> {
    return await api.post<McpWithActions>(`/v1/mcp-servers/${id}/rotate`);
  },

  async getPieces(mcpId: string): Promise<{ pieces: McpPieceWithConnection[] }> {
    return await api.get<{ pieces: McpPieceWithConnection[] }>(
      `/v1/mcp-tools/${mcpId}/pieces`
    );
  },

  async getActions(mcpId: string): Promise<{ actions: McpActionWithConnection[] }> {
    return await api.get<{ actions: McpActionWithConnection[] }>(
      `/v1/mcp-tools/${mcpId}/actions`
    );
  },

  async updateActions(
    mcpId: string,
    request: UpdateMcpActionsRequestBody
  ): Promise<McpWithActions> {
    return await api.post(`/v1/mcp-tools/${mcpId}/actions`, request);
  },
};
