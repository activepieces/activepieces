import { api } from '@/lib/api';
import {
  ListMcpsRequestQuery,
  McpPieceWithConnection,
  McpActionWithConnection,
  McpFlowWithFlow,
  SeekPage,
  UpdateMcpRequestBody,
  UpdateMcpActionsRequestBody,
  McpWithTools,
} from '@activepieces/shared';

export const mcpApi = {
  async list(request: ListMcpsRequestQuery): Promise<SeekPage<McpWithTools>> {
    return await api.get<SeekPage<McpWithTools>>('/v1/mcp-servers', request);
  },

  async get(id: string): Promise<McpWithTools> {
    return await api.get<McpWithTools>(`/v1/mcp-servers/${id}`);
  },

  async create(name: string): Promise<McpWithTools> {
    return await api.post<McpWithTools>('/v1/mcp-servers', { name });
  },

  async update(id: string, request: UpdateMcpRequestBody): Promise<McpWithTools> {
    return await api.post<McpWithTools>(`/v1/mcp-servers/${id}`, request);
  },

  async delete(id: string): Promise<void> {
    return await api.delete(`/v1/mcp-servers/${id}`);
  },

  async rotateToken(id: string): Promise<McpWithTools> {
    return await api.post<McpWithTools>(`/v1/mcp-servers/${id}/rotate`);
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

  async getFlows(mcpId: string): Promise<{ flows: McpFlowWithFlow[] }> {
    return await api.get<{ flows: McpFlowWithFlow[] }>(
      `/v1/mcp-tools/${mcpId}/flows`
    );
  },

  async updateActions(
    mcpId: string,
    request: UpdateMcpActionsRequestBody
  ): Promise<McpWithTools> {
    return await api.post(`/v1/mcp-tools/${mcpId}/actions`, request);
  },
};
