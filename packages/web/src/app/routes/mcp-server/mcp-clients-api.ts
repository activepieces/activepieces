import { SeekPage } from '@activepieces/core-utils';
import {
  ListMcpOAuthClientsRequestQuery,
  ListProjectMcpOAuthClientsRequestQuery,
  McpOAuthClientRow,
  RevokeMcpOAuthClientsRequestBody,
  RevokeProjectMcpOAuthClientsRequestBody,
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

  listForProject(
    request: ListProjectMcpOAuthClientsRequestQuery,
  ): Promise<SeekPage<McpOAuthClientRow>> {
    return api.get<SeekPage<McpOAuthClientRow>>(
      '/v1/mcp-oauth/clients',
      request,
    );
  },

  revokeForProject(
    request: RevokeProjectMcpOAuthClientsRequestBody,
  ): Promise<void> {
    return api.post<void>('/v1/mcp-oauth/clients/revoke', request);
  },
};
