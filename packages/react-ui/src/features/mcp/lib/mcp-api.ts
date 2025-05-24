import { api } from '@/lib/api';
import {
  ListMcpsRequestQuery,
  McpPieceWithConnection,
  McpFlowWithFlow,
  SeekPage,
  UpdateMcpRequestBody,
  McpWithTools,
  UpsertMcpPieceRequestBody,
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

  async getPieces(mcpId: string): Promise<McpPieceWithConnection[]> {
    return await api.get<McpPieceWithConnection[]>(
      `/v1/mcp-tools/pieces`, {
        query: {
          mcpId
        }
      }
    );
  },

  async getFlows(mcpId: string): Promise<McpFlowWithFlow[]> {
    return await api.get<McpFlowWithFlow[]>(
      `/v1/mcp-tools/flows`, {
        query: {
          mcpId
        }
      }
    );
  },

  async upsertPiece(
    mcpId: string,
    request: UpsertMcpPieceRequestBody,
  ): Promise<McpPieceWithConnection> {
    return await api.post(`/v1/mcp-tools/pieces`, {
      query: {
        mcpId
      },
      body: request
    });
  },

  async updateFlows(
    mcpId: string,
    request: UpdateMcpFlowsRequestBody
  ): Promise<McpFlowWithFlow[]> {
    return await api.post(`/v1/mcp-tools/flows`, {
      query: {
        mcpId
      },
      body: request
    });
  },

  async deletePiece(pieceId: string): Promise<void> {
    return await api.delete(`/v1/mcp-tools/pieces`, {
      pieceId
    });
  },

  async deleteFlow(flowId: string): Promise<void> {
    return await api.delete(`/v1/mcp-tools/flows`, {
      flowId
    });
  },
};


