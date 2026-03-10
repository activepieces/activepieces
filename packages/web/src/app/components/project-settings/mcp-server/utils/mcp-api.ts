import { PopulatedMcpServer } from '@activepieces/shared';

import { api } from '@/lib/api';

export const mcpApi = {
  async get(): Promise<PopulatedMcpServer> {
    return await api.get<PopulatedMcpServer>(`/v1/mcp-server`);
  },
};
