import { FlowAiProviderMigrationStatus } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';

import { aiProviderApi } from '@/features/platform-admin';

export const aiProviderMigrationKeys = {
  list: (cursor?: string) => ['ai-provider-migrations', cursor] as const,
  detail: (id: string) => ['ai-provider-migrations', id] as const,
};

export function useAiProviderMigrations({
  cursor,
  limit = 10,
}: {
  cursor?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: aiProviderMigrationKeys.list(cursor),
    queryFn: () => aiProviderApi.listMigrations({ cursor, limit }),
    refetchInterval: (query) => {
      const hasRunning = query.state.data?.data.some(
        (m) => m.status === FlowAiProviderMigrationStatus.RUNNING,
      );
      return hasRunning ? 3000 : false;
    },
  });
}
