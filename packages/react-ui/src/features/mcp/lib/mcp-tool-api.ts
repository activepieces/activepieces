import { api } from '@/lib/api';
import {
  UpsertMcpToolRequestBody,
  McpToolWithPiece,
} from '@activepieces/shared';

export const mcpToolApi = {
  async list(mcpId: string): Promise<McpToolWithPiece[]> {
    return await api.get<McpToolWithPiece[]>(`/v1/mcp-tools`, {
      query: {
        mcpId,
      },
    });
  },

  async upsert(request: UpsertMcpToolRequestBody): Promise<McpToolWithPiece> {
    return await api.post(`/v1/mcp-tools/`, request);
  },

  async delete(id: string): Promise<void> {
    return await api.delete(`/v1/mcp-tools/${id}`);
  },
};
