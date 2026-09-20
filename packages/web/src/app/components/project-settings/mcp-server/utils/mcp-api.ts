import {
  McpReachResponse,
  ProjectMcpServerResponse,
  UpdateMcpServerRequest,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const mcpApi = {
  async reach(): Promise<McpReachResponse> {
    return await api.get<McpReachResponse>('/v1/mcp-server/reach');
  },

  async get(projectId: string): Promise<ProjectMcpServerResponse> {
    return await api.get<ProjectMcpServerResponse>(
      `/v1/projects/${projectId}/mcp-server`,
    );
  },

  async update(
    projectId: string,
    request: UpdateMcpServerRequest,
  ): Promise<ProjectMcpServerResponse> {
    return await api.post<ProjectMcpServerResponse>(
      `/v1/projects/${projectId}/mcp-server`,
      request,
    );
  },

  async rotateToken(projectId: string): Promise<ProjectMcpServerResponse> {
    return await api.post<ProjectMcpServerResponse>(
      `/v1/projects/${projectId}/mcp-server/rotate`,
    );
  },
};
