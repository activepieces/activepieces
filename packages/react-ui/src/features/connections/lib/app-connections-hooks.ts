import { useQuery } from '@tanstack/react-query';

import { ListAppConnectionsRequestQuery } from '@activepieces/shared';

import { appConnectionsApi } from './app-connections-api';

export const appConnectionsHooks = {
  useConnections: (request: ListAppConnectionsRequestQuery) => {
    return useQuery({
      queryKey: ['app-connections', request.pieceName],
      queryFn: () => {
        return appConnectionsApi.list(request);
      },
      staleTime: 0,
    });
  },
};
