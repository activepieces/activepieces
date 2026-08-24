import { SeekPage } from '@activepieces/core-utils';
import {
  ListMcpOAuthClientsRequestQuery,
  McpOAuthClientRow,
  RevokeMcpOAuthClientsRequestBody,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const mcpClientsApi = {
  listMine(
    request: ListMcpOAuthClientsRequestQuery,
  ): Promise<SeekPage<McpOAuthClientRow>> {
    return api.get<SeekPage<McpOAuthClientRow>>(
      '/v1/mcp-oauth/clients/me',
      request,
    );
  },

  revokeMine(request: RevokeMcpOAuthClientsRequestBody): Promise<void> {
    return api.post<void>('/v1/mcp-oauth/clients/me/revoke', request);
  },
};
