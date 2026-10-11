import { isNil } from '@activepieces/core-utils';
import { PlatformWithoutSensitiveData } from '@activepieces/shared';
import {
  QueryClient,
  useMutation,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { t } from 'i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { platformApi } from '@/api/platforms-api';
import { authenticationSession } from '@/lib/authentication-session';
import { mutationFeedback } from '@/lib/mutation-feedback';

import { flagsHooks } from './flags-hooks';

export const platformHooks = {
  useDeletePlatform: () => {
    const navigate = useNavigate();
    return useMutation({
      mutationFn: async () => {
        await platformApi.deletePlatform();
      },
      onSuccess: () => {
        mutationFeedback.success(t('Platform deleted'));
        navigate('/sign-in');
      },
      onError: (error) => {
        mutationFeedback.error({
          error,
          title: t("Couldn't delete the platform"),
        });
      },
    });
  },
  useCurrentPlatform: () => {
    const currentPlatformId = authenticationSession.getPlatformId();
    const query = useSuspenseQuery({
      queryKey: ['platform', currentPlatformId],
      queryFn: platformApi.getCurrentPlatform,
      staleTime: 10 * 1000,
    });
    return {
      platform: query.data,
      refetch: async () => {
        await query.refetch();
      },
      setCurrentPlatform: (
        queryClient: QueryClient,
        platform: PlatformWithoutSensitiveData,
      ) => {
        queryClient.setQueryData(['platform', currentPlatformId], platform);
      },
    };
  },
  useUpdateLisenceKey: ({
    queryClient,
    messages,
  }: UseUpdateLicenseKeyParams) => {
    const currentPlatformId = authenticationSession.getPlatformId();

    return useMutation({
      mutationFn: async (tempLicenseKey: string) => {
        if (tempLicenseKey.trim() === '') return;
        await platformApi.activateLicenseKey(tempLicenseKey.trim());
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['platform', currentPlatformId],
        });
        queryClient.invalidateQueries({
          queryKey: flagsHooks.queryKey,
        });
        queryClient.invalidateQueries({
          queryKey: ['platform-billing-subscription'],
        });
        const successMessage =
          messages?.success === undefined
            ? t('License activated successfully!')
            : messages.success;
        if (!isNil(successMessage)) {
          toast.success(successMessage);
        }
      },
      onError: () => {
        const errorMessage =
          messages?.error === undefined
            ? t('Activation failed, invalid license key')
            : messages.error;
        if (!isNil(errorMessage)) {
          toast.error(errorMessage);
        }
      },
    });
  },
};

export type UseUpdateLicenseKeyParams = {
  queryClient: QueryClient;
  messages?: {
    success?: string | null;
    error?: string | null;
  };
};
