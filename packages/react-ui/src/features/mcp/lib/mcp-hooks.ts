import { useQuery } from '@tanstack/react-query';

import { mcpApi } from './mcp-api';
import { McpWithPieces, ListMcpsRequestQuery, SeekPage } from '@activepieces/shared';
import { authenticationSession } from '@/lib/authentication-session';


export const mcpHooks = {
  useMcpsList: (request: Omit<ListMcpsRequestQuery, 'projectId'>) => {
    const projectId = authenticationSession.getProjectId() ?? '';
    if (projectId === '') {
      console.error(
        'trying to use projectId when the authentication session is not set',
      );
    }
    return useQuery<SeekPage<McpWithPieces>, Error>({
      queryKey: ['mcp-list', projectId, request], 
      queryFn: () => mcpApi.list({
        ...request, 
        projectId, 
      }),
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
