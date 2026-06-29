import { ListPieceRunsRequestQuery } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';

import { platformHooks } from '@/hooks/platform-hooks';

import { pieceRunsApi } from '../api/piece-runs-api';

export const pieceRunsQueries = {
  usePieceRuns: ({ request, extraKeys }: UsePieceRunsProps) => {
    const { platform } = platformHooks.useCurrentPlatform();
    return useQuery({
      queryKey: ['piece-runs', ...extraKeys],
      meta: { showErrorDialog: true, loadSubsetOptions: {} },
      enabled: platform.plan.headlessSdkEnabled,
      queryFn: () => pieceRunsApi.list(request),
    });
  },
};

type UsePieceRunsProps = {
  request: ListPieceRunsRequestQuery;
  extraKeys: unknown[];
};
