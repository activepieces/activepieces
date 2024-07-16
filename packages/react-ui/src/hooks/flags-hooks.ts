import { ApFlagId } from '@activepieces/shared';
import { QueryClient, useQuery } from '@tanstack/react-query';

import { flagsApi } from '../lib/flags-api';

export const flagsHooks = {
  useFlag: <T>(flagId: ApFlagId, queryClient: QueryClient) => {
    return useQuery<T | null, Error>({
      queryKey: ['flag', flagId],
      queryFn: async () => {
        const flags = await cacheFlagsIfNotCached(queryClient);
        const value = flags?.[flagId] ?? null;
        if (typeof value === 'number' && typeof (0 as T) === 'number') {
          return Number(value) as T | null;
        }
        if (typeof (0 as T) === 'boolean' && typeof value === 'string') {
          return (value === 'true') as T | null;
        }
        return value as T | null;
      },
      staleTime: Infinity,
    });
  },
};

async function cacheFlagsIfNotCached(
  queryClient: QueryClient
): Promise<Record<ApFlagId, unknown>> {
  const cachedFlags = queryClient.getQueryData<Record<ApFlagId, unknown>>([
    'flags',
  ]);
  if (cachedFlags) {
    return cachedFlags;
  }
  const flags = await flagsApi.getAll();
  queryClient.setQueryData(['flags'], flags);
  return flags;
}
