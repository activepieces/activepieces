import { SeekPage } from '@activepieces/core-utils';
import {
  ListMcpOAuthGrantsRequestQuery,
  McpOAuthGrant,
  RevokeMcpOAuthGrantsRequestBody,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const mcpGrantsApi = {
  listMine(
    request: ListMcpOAuthGrantsRequestQuery,
  ): Promise<SeekPage<McpOAuthGrant>> {
    return api.get<SeekPage<McpOAuthGrant>>('/v1/mcp-oauth/grants/me', request);
  },

  revokeMine(request: RevokeMcpOAuthGrantsRequestBody): Promise<void> {
    return api.post<void>('/v1/mcp-oauth/grants/me/revoke', request);
  },
};
