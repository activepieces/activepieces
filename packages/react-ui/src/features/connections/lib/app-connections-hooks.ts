import { useQuery } from '@tanstack/react-query';

import { authenticationSession } from '@/lib/authentication-session';
import { ListAppConnectionsRequestQuery } from '@activepieces/shared';

import { appConnectionsApi } from './app-connections-api';

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
