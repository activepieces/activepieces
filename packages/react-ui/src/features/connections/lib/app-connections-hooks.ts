import { ListAppConnectionsRequestQuery } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';

import { appConnectionsApi } from './app-connections-api';

import { authenticationSession } from '@/lib/authentication-session';

export const appConnectionsHooks = {
  useConnections: (
    request: Omit<ListAppConnectionsRequestQuery, 'projectId'>,
  ) => {
    return useQuery({
      queryKey: ['app-connections', request.pieceName],
      queryFn: () => {
        return appConnectionsApi.list({
          ...request,
          projectId: authenticationSession.getProjectId() ?? '',
        });
      },
      staleTime: 0,
    });
  },
};
