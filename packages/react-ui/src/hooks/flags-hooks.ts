import { ApFlagId } from '@activepieces/shared';
import {
  QueryClient,
  usePrefetchQuery,
  useSuspenseQuery,
} from '@tanstack/react-query';

import { flagsApi, FlagsMap } from '../lib/flags-api';

export const flagsHooks = {
  prefetchFlags: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    usePrefetchQuery<FlagsMap, Error>({
      queryKey: ['flags'],
      queryFn: flagsApi.getAll,
    });
  },
  useFlags: () => {
    return useSuspenseQuery<FlagsMap, Error>({
      queryKey: ['flags'],
      queryFn: flagsApi.getAll,
    });
  },
  useFlag: <T>(flagId: ApFlagId, queryClient: QueryClient) => {
    return useSuspenseQuery<T | null, Error>({
      queryKey: ['flag', flagId],
      queryFn: async () => {
        const flags = await cacheFlagsIfNotCached(queryClient);
        const value = flags?.[flagId] ?? null;
        if (typeof value === 'number' && typeof (0 as T) === 'number') {
          return Number(value) as T | null;
        }
        if (typeof (0 as T) === 'boolean') {
          return (value === 'true' || value === true) as T | null;
        }
        return value as T | null;
      },
      staleTime: Infinity,
    });
  },
};

async function cacheFlagsIfNotCached(
  queryClient: QueryClient,
): Promise<FlagsMap> {
  const cachedFlags = queryClient.getQueryData<FlagsMap>(['flags']);
  if (cachedFlags) {
    return cachedFlags;
  }
  const flags = await flagsApi.getAll();
  queryClient.setQueryData(['flags'], flags);
  return flags;
}
