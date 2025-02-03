import {
  QueryClient,
  usePrefetchQuery,
  useSuspenseQuery,
} from '@tanstack/react-query';

import { PlatformWithoutSensitiveData } from '@activepieces/shared';

import { platformApi } from '../lib/platforms-api';

const setCurrentPlatform = (
  queryClient: QueryClient,
  platform: PlatformWithoutSensitiveData,
) => {
  queryClient.setQueryData(['platform'], platform);
};
export const platformHooks = {
  prefetchPlatform: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    usePrefetchQuery({
      queryKey: ['platform'],
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
      queryKey: ['platform'],
      queryFn: platformApi.getCurrentPlatform,
      staleTime: Infinity,
    });
    return {
      platform: query.data,
      refetch: async () => {
        await query.refetch();
      },
      setCurrentPlatform,
    };
  },
};
