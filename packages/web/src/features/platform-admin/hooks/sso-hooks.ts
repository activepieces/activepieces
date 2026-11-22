import { UpdatePlatformRequestBody } from '@activepieces/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { platformApi } from '@/api/platforms-api';
import { flagsHooks } from '@/hooks/flags-hooks';

export const ssoMutations = {
  useUpdatePlatformSso: ({
    platformId,
    refetch,
    onSuccess,
  }: {
    platformId: string;
    refetch: () => Promise<void>;
    onSuccess?: () => void;
  }) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (request: UpdatePlatformRequestBody) => {
        await platformApi.update(request, platformId);
        await Promise.all([
          refetch(),
          queryClient.invalidateQueries({ queryKey: flagsHooks.queryKey }),
        ]);
      },
      onSuccess: () => {
        if (onSuccess) {
          onSuccess();
        }
      },
    });
  },
};
