import { useQuery } from '@tanstack/react-query';

import { authenticationSession } from '@/lib/authentication-session';
import {
  AppConnectionWithoutSensitiveData,
  ListAppConnectionsRequestQuery,
} from '@activepieces/shared';

import { appConnectionsApi } from './app-connections-api';
import { globalConnectionsApi } from './global-connections-api';

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
        const globalConnections = await globalConnectionsApi.list({
          ...request
        });
        return [...localConnections.data, ...globalConnections.data];
      },
      staleTime: 0,
    });
  },
};
