import { ModelOptionsSurface } from '@activepieces/shared';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { aiProviderApi } from '@/features/platform-admin/api/ai-provider-api';

export const aiModelHooks = {
  useModelOptions: ({
    projectId,
    surface,
    tierId,
    enabled = true,
  }: {
    projectId: string;
    surface: ModelOptionsSurface;
    tierId?: string;
    enabled?: boolean;
  }) =>
    useQuery({
      enabled,
      queryKey: ['ai-model-options', projectId, surface, tierId],
      queryFn: () =>
        aiProviderApi.listModelOptions({ projectId, surface, tierId }),
      placeholderData: keepPreviousData,
    }),
};
