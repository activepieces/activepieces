import { ModelOptionsSurface } from '@activepieces/shared';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { aiProviderApi } from '@/features/platform-admin/api/ai-provider-api';

export const aiModelHooks = {
  useModelOptions: ({
    projectId,
    surface,
    tierId,
  }: {
    projectId: string;
    surface: ModelOptionsSurface;
    tierId?: string;
  }) =>
    useQuery({
      queryKey: ['ai-model-options', projectId, surface, tierId],
      queryFn: () =>
        aiProviderApi.listModelOptions({ projectId, surface, tierId }),
      placeholderData: keepPreviousData,
    }),
};
