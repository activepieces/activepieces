import { api } from '@/lib/api';
import {
  ListMcpsRequestQuery,
  McpPieceWithConnection,
  McpFlowWithFlow,
  SeekPage,
  UpdateMcpRequestBody,
  McpWithTools,
  UpdateMcpPieceRequestBody,
  UpdateMcpFlowsRequestBody,
} from '@activepieces/shared';

export const mcpApi = {
  async create(name: string): Promise<McpWithTools> {
    return await api.post<McpWithTools>('/v1/mcp-servers', { name });
  },

  async list(request: ListMcpsRequestQuery): Promise<SeekPage<McpWithTools>> {
    return await api.get<SeekPage<McpWithTools>>('/v1/mcp-servers', request);
  },

  async get(id: string): Promise<McpWithTools> {
    return await api.get<McpWithTools>(`/v1/mcp-servers/${id}`);
  },

  async update(id: string, request: UpdateMcpRequestBody): Promise<McpWithTools> {
    return await api.post<McpWithTools>(`/v1/mcp-servers/${id}`, request);
  },

  async rotateToken(id: string): Promise<McpWithTools> {
    return await api.post<McpWithTools>(`/v1/mcp-servers/${id}/rotate`);
  },

  async delete(id: string): Promise<void> {
    return await api.delete(`/v1/mcp-servers/${id}`);
  },

  async getPieces(mcpId: string): Promise<{ pieces: McpPieceWithConnection[] }> {
    return await api.get<{ pieces: McpPieceWithConnection[] }>(
      `/v1/mcp-tools/${mcpId}/pieces`
    );
  },


  async getFlows(mcpId: string): Promise<{ flows: McpFlowWithFlow[] }> {
    return await api.get<{ flows: McpFlowWithFlow[] }>(
      `/v1/mcp-tools/${mcpId}/flows`
    );
  },

  async updatePiece(
    mcpId: string,
    request: UpdateMcpPieceRequestBody
  ): Promise<McpWithTools> {
    return await api.post(`/v1/mcp-tools/${mcpId}/pieces`, request);
  },

  async updateFlow(
    mcpId: string,
    request: UpdateMcpFlowsRequestBody
  ): Promise<McpWithTools> {
    return await api.post(`/v1/mcp-tools/${mcpId}/flows`, request);
  },
};
