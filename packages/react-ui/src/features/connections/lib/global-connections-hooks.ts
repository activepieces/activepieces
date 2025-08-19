import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { UseFormReturn } from 'react-hook-form';

import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import {
  AppConnectionWithoutSensitiveData,
  ListGlobalConnectionsRequestQuery,
} from '@activepieces/shared';

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

export const globalConnectionsQueries = {
  useGlobalConnections: ({
    request,
    extraKeys,
    staleTime,
    gcTime,
  }: UseGlobalConnectionsProps) =>
    useQuery({
      queryKey: ['globalConnections', ...extraKeys],
      staleTime,
      gcTime,
      queryFn: () => {
        return globalConnectionsApi.list(request);
      },
    }),
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
        toast({
          title: t('Error deleting connections'),
          variant: 'destructive',
        });
      },
    }),
  useUpdateGlobalConnection: (
    refetch: () => void,
    setIsOpen: (isOpen: boolean) => void,
    editConnectionForm: UseFormReturn<{
      displayName: string;
      projectIds: string[];
    }>,
  ) =>
    useMutation<
      AppConnectionWithoutSensitiveData,
      Error,
      {
        connectionId: string;
        displayName: string;
        projectIds: string[];
        currentName: string;
      }
    >({
      mutationFn: async ({
        connectionId,
        displayName,
        projectIds,
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
        });
      },
      onSuccess: () => {
        refetch();
        toast({
          title: t('Success'),
          description: t('Connection has been updated.'),
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
          toast(INTERNAL_ERROR_TOAST);
        }
      },
    }),
};
