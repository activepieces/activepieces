import { usePrefetchQuery, useSuspenseQuery } from '@tanstack/react-query';

import { platformApi } from '../lib/platforms-api';

export const platformHooks = {
  prefetchPlatform: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    usePrefetchQuery({
      queryKey: ['platform'],
      queryFn: platformApi.getCurrentPlatform,
      staleTime: Infinity,
    });
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
    };
  },
};
