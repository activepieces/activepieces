import {
  PopulatedMcpServer,
  UpdateMcpServerRequest,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const mcpApi = {
  async get(projectId: string): Promise<PopulatedMcpServer> {
    return await api.get<PopulatedMcpServer>(
      `/v1/projects/${projectId}/mcp-server`,
    );
  },

  async update(
    projectId: string,
    request: UpdateMcpServerRequest,
  ): Promise<PopulatedMcpServer> {
    return await api.post<PopulatedMcpServer>(
      `/v1/projects/${projectId}/mcp-server`,
      request,
    );
  },

  async rotateToken(projectId: string): Promise<PopulatedMcpServer> {
    return await api.post<PopulatedMcpServer>(
      `/v1/projects/${projectId}/mcp-server/rotate`,
    );
  },
};
