import { isNil } from '@activepieces/core-utils';
import { PlatformWithoutSensitiveData } from '@activepieces/shared';
import {
  QueryClient,
  useMutation,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { StatusCodes } from 'http-status-codes';
import { t } from 'i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { platformApi } from '@/api/platforms-api';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import {
  MUTATION_ERROR_TOAST_ID,
  mutationFeedback,
} from '@/lib/mutation-feedback';

import { flagsHooks } from './flags-hooks';

const PLATFORM_STALE_TIME_MS = 10 * 1000;

export const platformHooks = {
  useDeletePlatform: () => {
    const navigate = useNavigate();
    return useMutation({
      mutationFn: async () => {
        await platformApi.deletePlatform();
      },
      onSuccess: () => {
        toast.success(t('Platform deleted successfully'));
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
    const query = useSuspenseQuery(currentPlatformQueryOptions());
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
      onError: (error) => {
        if (messages?.error === null) {
          return;
        }
        if (!isRejectedLicenseKey(error)) {
          mutationFeedback.error({
            error,
            title: t("Couldn't activate the license key"),
          });
          return;
        }
        mutationFeedback.markShown(error);
        toast.error(
          messages?.error ?? t('Activation failed, invalid license key'),
          {
            id: MUTATION_ERROR_TOAST_ID,
            description: api.serverErrorMessage(error),
          },
        );
      },
    });
  },
};

function currentPlatformQueryOptions() {
  return {
    queryKey: ['platform', authenticationSession.getPlatformId()],
    queryFn: platformApi.getCurrentPlatform,
    staleTime: PLATFORM_STALE_TIME_MS,
  };
}

function isRejectedLicenseKey(error: unknown): boolean {
  const status = api.isError(error) ? error.response?.status : undefined;
  return (
    status !== undefined &&
    status >= StatusCodes.BAD_REQUEST &&
    status < StatusCodes.INTERNAL_SERVER_ERROR
  );
}

export { currentPlatformQueryOptions };

export type UseUpdateLicenseKeyParams = {
  queryClient: QueryClient;
  messages?: {
    success?: string | null;
    error?: string | null;
  };
};
