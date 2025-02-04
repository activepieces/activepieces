import {
  QueryClient,
  usePrefetchQuery,
  useSuspenseQuery,
} from '@tanstack/react-query';

import { PlatformWithoutSensitiveData } from '@activepieces/shared';

import { platformApi } from '../lib/platforms-api';

const PLATFORM_KEY = ['platform'];

export const platformHooks = {
  prefetchPlatform: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    usePrefetchQuery({
      queryKey: PLATFORM_KEY,
      queryFn: platformApi.getCurrentPlatform,
      staleTime: Infinity,
    });
  },
  isCopilotEnabled: () => {
    const { platform } = platformHooks.useCurrentPlatform();
    return Object.keys(platform?.copilotSettings?.providers ?? {}).length > 0;
  },
  useCurrentPlatform: () => {
    const query = useSuspenseQuery({
      queryKey: PLATFORM_KEY,
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
        queryClient.setQueryData(PLATFORM_KEY, platform);
      },
    };
  },
};
