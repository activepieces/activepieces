import { UpdatePlatformRequestBody } from '@activepieces/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { platformApi } from '@/api/platforms-api';
import { flagsHooks } from '@/hooks/flags-hooks';
import { api } from '@/lib/api';

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
        await refetch();
        await queryClient.invalidateQueries({ queryKey: flagsHooks.queryKey });
      },
      onSuccess: () => {
        if (onSuccess) {
          onSuccess();
        }
      },
      onError: (error) => {
        toast.error(
          api.extractServerErrorMessage(
            error,
            t("Couldn't update single sign-on settings"),
          ),
        );
      },
    });
  },
};
