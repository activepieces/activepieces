import {
  AppConnectionWithoutSensitiveData,
  ListGlobalConnectionsRequestQuery,
} from '@activepieces/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import { internalErrorToast } from '@/components/ui/sonner';
import { platformHooks } from '@/hooks/platform-hooks';

import { globalConnectionsApi } from './api/global-connections';
import {
  NoProjectSelected,
  ConnectionNameAlreadyExists,
  isConnectionNameUnique,
} from './utils';

type UseGlobalConnectionsProps = {
  request: ListGlobalConnectionsRequestQuery;
  extraKeys: any[];
  staleTime?: number;
  gcTime?: number;
};

const GLOBAL_CONNECTIONS_QUERY_KEY = 'globalConnections';
export const globalConnectionsQueries = {
  getGlobalConnectionsQueryKey: (extraKeys: string[]) => [
    GLOBAL_CONNECTIONS_QUERY_KEY,
    ...extraKeys,
  ],
  useGlobalConnections: ({
    request,
    extraKeys,
    staleTime,
    gcTime,
  }: UseGlobalConnectionsProps) => {
    const { platform } = platformHooks.useCurrentPlatform();
    return useQuery({
      queryKey: [GLOBAL_CONNECTIONS_QUERY_KEY, ...extraKeys],
      staleTime,
      gcTime,
      enabled: platform.plan.globalConnectionsEnabled,
      queryFn: () => {
        return globalConnectionsApi.list(request);
      },
    });
  },
};

export const globalConnectionsMutations = {
  useBulkDeleteGlobalConnections: (refetch: () => void) =>
    useMutation({
      mutationFn: async (ids: string[]) => {
        await Promise.all(ids.map((id) => globalConnectionsApi.delete(id)));
      },
      onSuccess: () => {
        refetch();
      },
      onError: () => {
        internalErrorToast();
      },
    }),
  useUpdateGlobalConnection: (
    refetch: () => void,
    setIsOpen: (isOpen: boolean) => void,
    editConnectionForm: UseFormReturn<{
      displayName: string;
      projectIds: string[];
      preSelectForNewProjects: boolean;
    }>,
  ) =>
    useMutation<
      AppConnectionWithoutSensitiveData,
      Error,
      {
        connectionId: string;
        displayName: string;
        projectIds: string[];
        preSelectForNewProjects: boolean;
        currentName: string;
      }
    >({
      mutationFn: async ({
        connectionId,
        displayName,
        projectIds,
        preSelectForNewProjects,
        currentName,
      }) => {
        if (
          !(await isConnectionNameUnique(true, displayName)) &&
          displayName !== currentName
        ) {
          throw new ConnectionNameAlreadyExists();
        }
        if (projectIds.length === 0) {
          throw new NoProjectSelected();
        }
        return globalConnectionsApi.update(connectionId, {
          displayName,
          projectIds,
          preSelectForNewProjects,
        });
      },
      onSuccess: () => {
        refetch();
        toast.success(t('Connection has been updated.'), {
          duration: 3000,
        });
        setIsOpen(false);
      },
      onError: (error) => {
        if (error instanceof ConnectionNameAlreadyExists) {
          editConnectionForm.setError('displayName', {
            message: error.message,
          });
        } else if (error instanceof NoProjectSelected) {
          editConnectionForm.setError('projectIds', {
            message: error.message,
          });
        } else {
          internalErrorToast();
        }
      },
    }),
};
