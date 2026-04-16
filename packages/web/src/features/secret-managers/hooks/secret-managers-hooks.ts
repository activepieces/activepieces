import {
  ConnectSecretManagerRequest,
  SecretManagerConnectionWithStatus,
} from '@activepieces/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';

import { secretManagersApi } from '../api/secret-managers-api';

export const secretManagersHooks = {
  useListSecretManagerConnections: ({
    connectedOnly,
    listForPlatform,
  }: { connectedOnly?: boolean; listForPlatform?: boolean } = {}) => {
    const { platform } = platformHooks.useCurrentPlatform();
    const projectId = listForPlatform
      ? undefined
      : authenticationSession.getProjectId()!;
    return useQuery<SecretManagerConnectionWithStatus[]>({
      queryKey: ['secret-managers', projectId],
      queryFn: async () => {
        const result = await secretManagersApi.list({ projectId });
        if (connectedOnly) {
          return result.data.filter(
            (connection) => connection.connection?.connected,
          );
        }
        return result.data;
      },
      enabled: platform.plan.secretManagersEnabled,
      meta: { showErrorDialog: true, loadSubsetOptions: {} },
    });
  },
  useCreateSecretManagerConnection: ({
    onSuccess,
    onError,
  }: {
    onSuccess: () => void;
    onError: (error: Error) => void;
  }) => {
    const queryClient = useQueryClient();
    return useMutation<
      SecretManagerConnectionWithStatus,
      Error,
      ConnectSecretManagerRequest
    >({
      mutationFn: secretManagersApi.create,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['secret-managers'] });
        toast.success(t('Connected successfully'));
        onSuccess();
      },
      onError,
    });
  },
  useUpdateSecretManagerConnection: ({
    onSuccess,
    onError,
  }: {
    onSuccess: () => void;
    onError: (error: Error) => void;
  }) => {
    const queryClient = useQueryClient();
    return useMutation<
      SecretManagerConnectionWithStatus,
      Error,
      { id: string; config: ConnectSecretManagerRequest }
    >({
      mutationFn: ({ id, config }) => secretManagersApi.update(id, config),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['secret-managers'] });
        toast.success(t('Updated successfully'));
        onSuccess();
      },
      onError,
    });
  },
  useDeleteSecretManagerConnection: () => {
    const queryClient = useQueryClient();
    return useMutation<void, Error, string>({
      mutationFn: (id) => secretManagersApi.delete(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['secret-managers'] });
        toast.success(t('Deleted successfully'));
      },
    });
  },
  useClearCache: () => {
    const queryClient = useQueryClient();
    return useMutation<void, Error, string | undefined>({
      mutationFn: (connectionId) => secretManagersApi.clearCache(connectionId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['secret-managers'] });
        toast.success(t('Cache cleared successfully'));
      },
    });
  },
};
