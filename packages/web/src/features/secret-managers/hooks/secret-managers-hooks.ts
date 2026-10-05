import {
  ConnectSecretManagerRequest,
  SecretManagerConnectionWithStatus,
} from '@activepieces/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { mutationFeedback } from '@/lib/mutation-feedback';

import { secretManagersApi } from '../api/secret-managers-api';

export const secretManagersHooks = {
  useListSecretManagerConnections: ({
    connectedOnly,
    listForPlatform,
  }: {
    connectedOnly?: boolean;
    listForPlatform?: boolean;
  } = {}) => {
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
      onSuccess: async (created) => {
        await queryClient.invalidateQueries({ queryKey: ['secret-managers'] });
        toast.success(t('{name} connected', { name: created.name }));
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
      onSuccess: async (updated) => {
        await queryClient.invalidateQueries({ queryKey: ['secret-managers'] });
        toast.success(t('{name} saved', { name: updated.name }));
        onSuccess();
      },
      onError,
    });
  },
  useDeleteSecretManagerConnection: () => {
    const queryClient = useQueryClient();
    return useMutation<void, Error, string>({
      mutationFn: async (id) => {
        await secretManagersApi.delete(id);
        await queryClient.invalidateQueries({ queryKey: ['secret-managers'] });
      },
      onError: (error) => {
        mutationFeedback.error({
          error,
          title: t("Couldn't delete the vault"),
        });
      },
    });
  },
  useClearCache: () => {
    const queryClient = useQueryClient();
    return useMutation<void, Error, string | undefined>({
      mutationFn: (connectionId) => secretManagersApi.clearCache(connectionId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['secret-managers'] });
        toast.success(t('Fresh values are fetched on the next run'));
      },
      onError: (error) => {
        mutationFeedback.error({
          error,
          title: t("Couldn't clear the cached values"),
        });
      },
    });
  },
};
