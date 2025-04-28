import { QueryClient, useSuspenseQuery } from '@tanstack/react-query';

import { authenticationSession } from '@/lib/authentication-session';
import { PlatformWithoutSensitiveData } from '@activepieces/shared';

import { platformApi } from '../lib/platforms-api';

export const platformHooks = {
  isCopilotEnabled: () => {
    const { platform } = platformHooks.useCurrentPlatform();
    return Object.keys(platform?.copilotSettings?.providers ?? {}).length > 0;
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
};
