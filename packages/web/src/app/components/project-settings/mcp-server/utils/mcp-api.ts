import { PopulatedMcpServer } from '@activepieces/shared';

import { api } from '@/lib/api';

export const mcpApi = {
  async get(projectId: string): Promise<PopulatedMcpServer> {
    return await api.get<PopulatedMcpServer>(
      `/v1/projects/${projectId}/mcp-server`,
    );
  },

  async rotateToken(projectId: string): Promise<PopulatedMcpServer> {
    return await api.post<PopulatedMcpServer>(
      `/v1/projects/${projectId}/mcp-server/rotate`,
    );
  },
};
