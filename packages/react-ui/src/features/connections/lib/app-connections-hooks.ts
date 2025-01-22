import { useQuery } from '@tanstack/react-query';

import { authenticationSession } from '@/lib/authentication-session';
import {
  AppConnectionWithoutSensitiveData,
  ListAppConnectionsRequestQuery,
} from '@activepieces/shared';

import { appConnectionsApi } from './app-connections-api';

export const appConnectionsHooks = {
  useConnections: (
    request: Omit<ListAppConnectionsRequestQuery, 'projectId'>,
  ) => {
    const projectId = authenticationSession.getProjectId() ?? '';
    if (projectId === '') {
      console.error(
        'trying to use projectId when the authentication session is not set',
      );
    }
    return useQuery<AppConnectionWithoutSensitiveData[]>({
      queryKey: ['app-connections', request.pieceName, projectId],
      queryFn: async () => {
        const localConnections = await appConnectionsApi.list({
          ...request,
          projectId,
        });
        return [...localConnections.data];
      },
      staleTime: 0,
    });
  },
};
