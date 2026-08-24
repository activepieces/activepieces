import {
  ListMcpOAuthGrantsRequestQuery,
  ListMcpOAuthGrantsResponse,
  RevokeMcpOAuthGrantsRequestBody,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const mcpGrantsApi = {
  list(
    request: ListMcpOAuthGrantsRequestQuery,
  ): Promise<ListMcpOAuthGrantsResponse> {
    return api.get<ListMcpOAuthGrantsResponse>('/v1/mcp-oauth/grants', request);
  },

  revoke(request: RevokeMcpOAuthGrantsRequestBody): Promise<void> {
    return api.post<void>('/v1/mcp-oauth/grants/revoke', request);
  },
};
