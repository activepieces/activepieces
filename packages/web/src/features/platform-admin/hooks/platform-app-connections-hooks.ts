import { SeekPage } from '@activepieces/core-utils';
import {
  AppConnectionScope,
  AppConnectionStatus,
  PlatformAppConnectionsListItem,
} from '@activepieces/shared';
import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { t } from 'i18next';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import {
  CURSOR_QUERY_PARAM,
  LIMIT_QUERY_PARAM,
} from '@/components/custom/data-table';
import { internalErrorToast } from '@/components/ui/sonner';
import {
  appConnectionsApi,
  appConnectionUtils,
  globalConnectionsApi,
} from '@/features/connections';

import { platformAppConnectionsApi } from '../api/platform-app-connections-api';

export const platformAppConnectionsKeys = {
  all: ['platform-app-connections'] as const,
  lists: () => ['platform-app-connections', 'list'] as const,
  list: (searchParams: string, scopeFilterEnabled: boolean) =>
    [
      'platform-app-connections',
      'list',
      searchParams,
      scopeFilterEnabled,
    ] as const,
  owners: () => ['platform-app-connections', 'owners'] as const,
  summary: () => ['platform-app-connections', 'summary'] as const,
};

export const platformAppConnectionsQueries = {
  useList: ({ scopeFilterEnabled }: { scopeFilterEnabled: boolean }) => {
    const [searchParams] = useSearchParams();
    return useQuery({
      queryKey: platformAppConnectionsKeys.list(
        searchParams.toString(),
        scopeFilterEnabled,
      ),
      staleTime: 0,
      gcTime: 0,
      queryFn: () => {
        const cursor = searchParams.get(CURSOR_QUERY_PARAM);
        const limit = searchParams.get(LIMIT_QUERY_PARAM);
        const params = PLATFORM_CONNECTIONS_PARAMS;
        return platformAppConnectionsApi.list({
          cursor: cursor ?? undefined,
          limit: limit ? parseInt(limit) : undefined,
          displayName: searchParams.get(params.displayName) ?? undefined,
          pieceName: nonEmpty(searchParams.getAll(params.pieceName)),
          status: nonEmpty(
            searchParams.getAll(params.status).filter(isConnectionStatus),
          ),
          scope: scopeFilterEnabled
            ? singleScope(searchParams.getAll(params.scope))
            : undefined,
          projectIds: nonEmpty(searchParams.getAll(params.projectIds)),
          ownerIds: nonEmpty(searchParams.getAll(params.ownerIds)),
        });
      },
    });
  },
  useOwners: () =>
    useQuery({
      queryKey: platformAppConnectionsKeys.owners(),
      queryFn: () => platformAppConnectionsApi.listOwners(),
    }),
  useSummary: () =>
    useQuery({
      queryKey: platformAppConnectionsKeys.summary(),
      queryFn: () => platformAppConnectionsApi.summary(),
    }),
};

export const platformAppConnectionsMutations = {
  useRevalidate: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (connection: PlatformAppConnectionsListItem) =>
        platformAppConnectionsApi.revalidate(connection.id),
      onMutate: (connection) => {
        toast.loading(t('Testing {name}…', { name: connection.displayName }), {
          id: connection.id,
        });
      },
      onSuccess: (revalidated, connection) => {
        queryClient.setQueriesData<SeekPage<PlatformAppConnectionsListItem>>(
          { queryKey: platformAppConnectionsKeys.lists() },
          (page) =>
            page && {
              ...page,
              data: page.data.map((row) =>
                row.id === revalidated.id
                  ? { ...row, status: revalidated.status }
                  : row,
              ),
            },
        );
        refreshListsAndSummary({ queryClient });
        appConnectionUtils.showRevalidationResult({
          toastId: connection.id,
          status: revalidated.status,
          failureDescription:
            connection.scope === AppConnectionScope.PLATFORM
              ? t('This connection is no longer working. Reconnect it.')
              : t(
                  'This connection is no longer working. Someone in its project needs to reconnect it.',
                ),
        });
      },
      onError: (_error, connection) => {
        toast.dismiss(connection.id);
        internalErrorToast();
      },
    });
  },
  useDelete: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (
        connections: Pick<
          PlatformAppConnectionsListItem,
          'id' | 'scope' | 'displayName'
        >[],
      ) => {
        const results = await Promise.allSettled(
          connections.map((connection) =>
            connection.scope === AppConnectionScope.PLATFORM
              ? globalConnectionsApi.delete(connection.id)
              : appConnectionsApi.delete(connection.id),
          ),
        );
        return {
          failed: connections.filter(
            (_connection, index) => results[index].status === 'rejected',
          ),
        };
      },
      onSuccess: ({ failed }) => {
        if (failed.length === 0) {
          return;
        }
        toast.error(
          t(
            '{count, plural, =1 {Could not delete} other {Could not delete these}}',
            {
              count: failed.length,
            },
          ),
          {
            description: failed
              .map((connection) => connection.displayName)
              .join(', '),
          },
        );
      },
      onSettled: () => {
        refreshPlatformConnections({ queryClient });
      },
    });
  },
};

export const platformAppConnectionsCache = {
  refresh: refreshPlatformConnections,
};

function refreshPlatformConnections({
  queryClient,
}: {
  queryClient: QueryClient;
}): Promise<void> {
  return queryClient
    .invalidateQueries({ queryKey: platformAppConnectionsKeys.all })
    .catch(() => undefined);
}

function refreshListsAndSummary({
  queryClient,
}: {
  queryClient: QueryClient;
}): void {
  [
    platformAppConnectionsKeys.lists(),
    platformAppConnectionsKeys.summary(),
  ].forEach((queryKey) =>
    queryClient.invalidateQueries({ queryKey }).catch(() => undefined),
  );
}

function nonEmpty<T>(values: T[]): T[] | undefined {
  return values.length > 0 ? values : undefined;
}

function isConnectionStatus(value: string): value is AppConnectionStatus {
  return Object.values<string>(AppConnectionStatus).includes(value);
}

function singleScope(values: string[]): AppConnectionScope | undefined {
  const scopes = Object.values(AppConnectionScope).filter((scope) =>
    values.includes(scope),
  );
  return scopes.length === 1 ? scopes[0] : undefined;
}

export const PLATFORM_CONNECTIONS_PARAMS = {
  displayName: 'displayName',
  status: 'status',
  pieceName: 'pieceName',
  projectIds: 'projectIds',
  ownerIds: 'ownerIds',
  scope: 'scope',
} as const;
