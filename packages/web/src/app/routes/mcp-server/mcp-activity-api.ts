import { SeekPage } from '@activepieces/core-utils';
import {
  ListMcpActivityRequestQuery,
  McpActivityPayload,
  PopulatedMcpActivity,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const mcpActivityApi = {
  list(
    request: ListMcpActivityRequestQuery,
  ): Promise<SeekPage<PopulatedMcpActivity>> {
    return api.get<SeekPage<PopulatedMcpActivity>>('/v1/mcp-activity', request);
  },

  getPayload(id: string): Promise<McpActivityPayload> {
    return api.get<McpActivityPayload>(`/v1/mcp-activity/${id}/payload`);
  },
};
