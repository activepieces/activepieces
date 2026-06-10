import { McpServer, UpdateMcpServerRequest } from '@activepieces/shared';

import { api } from '@/lib/api';

async function get(): Promise<McpServer> {
  return api.get<McpServer>('/v1/mcp-server');
}

async function update(request: UpdateMcpServerRequest): Promise<McpServer> {
  return api.post<McpServer>('/v1/mcp-server', request);
}

export const platformMcpApi = {
  get,
  update,
};
