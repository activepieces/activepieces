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
    return useQuery<AppConnectionWithoutSensitiveData[]>({
      queryKey: ['app-connections', request.pieceName],
      queryFn: async () => {
        const localConnections = await appConnectionsApi.list({
          ...request,
          projectId: authenticationSession.getProjectId() ?? '',
        });
        return [...localConnections.data];
      },
      staleTime: 0,
    });
  },
};
