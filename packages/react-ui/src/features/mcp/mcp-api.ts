import { api } from '@/lib/api';
import { MCPSchema } from '@activepieces/shared';

interface UpdateMCPParams {
  id: string;
  token?: string;
  connectionsIds?: string[];
}

export const mcpApi = {
  async get() {
    return await api.get<MCPSchema>(`/v1/mcp`);
  },
  async update({ id, token, connectionsIds }: UpdateMCPParams) {
    return await api.post<MCPSchema>(`/v1/mcp/${id}`, {
      token,
      connectionsIds,
    });
  },
  async rotateToken(id: string) {
    return await api.post<MCPSchema>(`/v1/mcp/${id}/rotate`);
  },
};
