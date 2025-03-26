import { api } from '@/lib/api';
import { MCP } from '@activepieces/ee-shared';

export const mcpApi = {
  async get() {
    return await api.get<MCP>(`/v1/mcp`);
  },
  async updateConnections(mcpId: string, connectionsIds: string[]) {
    return await api.patch<MCP>(`/v1/mcp/${mcpId}/connections`, { connectionsIds });
  },
};
