import { AppConnectionScope, AppConnectionStatus } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';

import {
  CURSOR_QUERY_PARAM,
  LIMIT_QUERY_PARAM,
} from '@/components/custom/data-table';

import { platformAppConnectionsApi } from '../api/platform-app-connections-api';

export const platformAppConnectionsKeys = {
  list: ({
    searchParams,
    scopeFilterEnabled,
  }: {
    searchParams: string;
    scopeFilterEnabled: boolean;
  }) =>
    ['platform-app-connections', searchParams, { scopeFilterEnabled }] as const,
  owners: () => ['platform-app-connections', 'owners'] as const,
};

export const platformAppConnectionsQueries = {
  useList: ({ scopeFilterEnabled }: { scopeFilterEnabled: boolean }) => {
    const [searchParams] = useSearchParams();
    return useQuery({
      queryKey: platformAppConnectionsKeys.list({
        searchParams: searchParams.toString(),
        scopeFilterEnabled,
      }),
      staleTime: 0,
      gcTime: 0,
      retry: false,
      queryFn: () => {
        const cursor = searchParams.get(CURSOR_QUERY_PARAM);
        const limit = searchParams.get(LIMIT_QUERY_PARAM);
        const status = searchParams.getAll('status') as AppConnectionStatus[];
        const projectIds = searchParams.getAll('projectIds');
        const ownerIds = searchParams.getAll('ownerIds');
        const scope = scopeFilterEnabled
          ? singleScope(searchParams.getAll('scope'))
          : undefined;
        return platformAppConnectionsApi.list({
          cursor: cursor ?? undefined,
          limit: limit ? parseInt(limit) : undefined,
          displayName: searchParams.get('displayName') ?? undefined,
          pieceName: searchParams.get('pieceName') ?? undefined,
          status: status.length > 0 ? status : undefined,
          projectIds: projectIds.length > 0 ? projectIds : undefined,
          ownerIds: ownerIds.length > 0 ? ownerIds : undefined,
          scope,
        });
      },
    });
  },
  useOwners: () =>
    useQuery({
      queryKey: platformAppConnectionsKeys.owners(),
      queryFn: () => platformAppConnectionsApi.listOwners(),
    }),
};

function singleScope(values: string[]): AppConnectionScope | undefined {
  const scopes = Object.values(AppConnectionScope).filter((scope) =>
    values.includes(scope),
  );
  return scopes.length === 1 ? scopes[0] : undefined;
}
