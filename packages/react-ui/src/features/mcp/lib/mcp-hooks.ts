import { useQuery } from '@tanstack/react-query';

import { authenticationSession } from '@/lib/authentication-session';
import {
  McpWithPieces,
  ListMcpsRequestQuery,
  SeekPage,
} from '@activepieces/shared';

import { mcpApi } from './mcp-api';

export const mcpHooks = {
  useMcps: (request: Omit<ListMcpsRequestQuery, 'projectId'>) => {
    const projectId = authenticationSession.getProjectId() ?? '';
    if (projectId === '') {
      console.error(
        'trying to use projectId when the authentication session is not set',
      );
    }
    return useQuery<SeekPage<McpWithPieces>, Error>({
      queryKey: ['mcp-servers', request, projectId],
      queryFn: () =>
        mcpApi.list({
          ...request,
          projectId,
        }),
      staleTime: 0,
    });
  },
  useMcp: (id: string) => {
    return useQuery<McpWithPieces, Error>({
      queryKey: ['mcp', id],
      queryFn: () => mcpApi.get(id),
      enabled: !!id,
    });
  },
};
