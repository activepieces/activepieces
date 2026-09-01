import {
  ListMcpActivityRequestQuery,
  ListMcpActivityResponse,
  McpActivityPayload,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const mcpActivityApi = {
  list(request: ListMcpActivityRequestQuery): Promise<ListMcpActivityResponse> {
    return api.get<ListMcpActivityResponse>('/v1/mcp-activity', request);
  },

  getPayload(id: string): Promise<McpActivityPayload> {
    return api.get<McpActivityPayload>(`/v1/mcp-activity/${id}/payload`);
  },
};
