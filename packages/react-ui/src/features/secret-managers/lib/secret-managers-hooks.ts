import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { platformHooks } from '@/hooks/platform-hooks';
import {
  ConnectSecretManagerRequest,
  DisconnectSecretManagerRequest,
  SecretManagerProviderMetaData,
} from '@activepieces/ee-shared';

import { secretManagersApi } from './secret-managers-api';

export const secretManagersHooks = {
  useSecretManagers: ({ connectedOnly }: { connectedOnly?: boolean } = {}) => {
    const { platform } = platformHooks.useCurrentPlatform();
    return useQuery<SecretManagerProviderMetaData[]>({
      queryKey: ['secret-managers'],
      queryFn: async () => {
        const secretManagers = await secretManagersApi.list();
        if (connectedOnly) {
          return secretManagers.data.filter(
            (secretManager) => secretManager.connected,
          );
        }
        return secretManagers.data;
      },
      enabled: platform.plan.secretManagersEnabled,
    });
  },
  useConnectSecretManager: () => {
    const queryClient = useQueryClient();
    return useMutation<void, Error, ConnectSecretManagerRequest>({
      mutationFn: secretManagersApi.connect,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['secret-managers'] });
        toast.success(t('Connected successfully'));
      },
    });
  },
  useDisconnectSecretManager: () => {
    const queryClient = useQueryClient();
    return useMutation<void, Error, DisconnectSecretManagerRequest>({
      mutationFn: secretManagersApi.disconnect,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['secret-managers'] });
        toast.success(t('Disconnected successfully'));
      },
    });
  },
};
