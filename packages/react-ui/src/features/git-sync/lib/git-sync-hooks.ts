import { useQuery } from '@tanstack/react-query';

import { gitSyncApi } from './git-sync-api';

export const gitSyncHooks = {
  useGitSync: (projectId: string, enabled: boolean) => {
    const query = useQuery({
      queryKey: ['git-sync', projectId],
      queryFn: () => gitSyncApi.get(projectId),
      staleTime: Infinity,
      enabled: enabled,
    });
    return {
      gitSync: query.data,
      isLoading: query.isLoading,
      refetch: query.refetch,
    };
  },
};
