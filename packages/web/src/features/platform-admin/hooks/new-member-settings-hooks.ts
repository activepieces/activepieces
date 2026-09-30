import { UpdatePlatformRequestBody } from '@activepieces/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { platformApi } from '@/api/platforms-api';
import { platformHooks } from '@/hooks/platform-hooks';

export const newMemberSettingsMutations = {
  useUpdateNewMemberSettings: () => {
    const queryClient = useQueryClient();
    const { platform, setCurrentPlatform } = platformHooks.useCurrentPlatform();
    return useMutation({
      mutationFn: (request: NewMemberSettingsRequest) =>
        platformApi.update(request, platform.id),
      onSuccess: (updatedPlatform) => {
        setCurrentPlatform(queryClient, updatedPlatform);
      },
      onError: () => undefined,
    });
  },
};

type NewMemberSettingsRequest = Pick<
  UpdatePlatformRequestBody,
  'defaultProjectIds' | 'autoCreatePersonalProjects'
>;
