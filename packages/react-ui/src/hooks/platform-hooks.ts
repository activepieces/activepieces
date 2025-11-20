import {
  QueryClient,
  useMutation,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { t } from 'i18next';
import { useNavigate } from 'react-router-dom';

import { toast } from '@/components/ui/use-toast';
import { authenticationSession } from '@/lib/authentication-session';
import { PlatformWithoutSensitiveData } from '@activepieces/shared';

import { platformApi } from '../lib/platforms-api';

import { flagsHooks } from './flags-hooks';

export const platformHooks = {
  useDeleteAccount: () => {
    const navigate = useNavigate();
    return useMutation({
      mutationFn: async () => {
        await platformApi.deleteAccount();
      },
      onSuccess: () => {
        toast({
          title: t('Success'),
          description: t('Account deleted successfully'),
        });
        navigate('/sign-in');
      },
    });
  },
  useCurrentPlatform: () => {
    const currentPlatformId = authenticationSession.getPlatformId();
    const query = useSuspenseQuery({
      queryKey: ['platform', currentPlatformId],
      queryFn: platformApi.getCurrentPlatform,
      staleTime: Infinity,
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
  useIsCloudPlatform: () => {
    const currentPlatformId = authenticationSession.getPlatformId();
    const query = useSuspenseQuery({
      queryKey: ['is-cloud-platform', currentPlatformId],
      queryFn: platformApi.isCloudPlatform,
      staleTime: Infinity,
    });
    return query.data;
  },
  useUpdateLisenceKey: (queryClient: QueryClient) => {
    const currentPlatformId = authenticationSession.getPlatformId();

    return useMutation({
      mutationFn: async (tempLicenseKey: string) => {
        if (tempLicenseKey.trim() === '') return;
        await platformApi.verifyLicenseKey(tempLicenseKey.trim());
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['platform', currentPlatformId],
        });
        queryClient.invalidateQueries({
          queryKey: flagsHooks.queryKey,
        });
        toast({
          title: t('Success'),
          description: t('License activated successfully!'),
        });
      },
      onError: () => {
        toast({
          title: t('Error'),
          description: t('Activation failed, invalid license key'),
          variant: 'destructive',
        });
      },
    });
  },
};
