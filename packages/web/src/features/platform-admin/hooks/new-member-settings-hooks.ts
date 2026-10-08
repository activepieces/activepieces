import { UpdatePlatformRequestBody } from '@activepieces/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { platformApi } from '@/api/platforms-api';
import { platformHooks } from '@/hooks/platform-hooks';

import { personalProjectsApi } from '../api/personal-projects-api';

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
  useCreateMissingPersonalProjects: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: () => personalProjectsApi.createMissing(),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: PERSONAL_PROJECTS_SUMMARY_QUERY_KEY,
        });
      },
      onError: () => undefined,
    });
  },
};

export const newMemberSettingsQueries = {
  usePersonalProjectsSummary: ({ enabled }: { enabled: boolean }) => {
    return useQuery({
      queryKey: PERSONAL_PROJECTS_SUMMARY_QUERY_KEY,
      queryFn: () => personalProjectsApi.summary(),
      enabled,
    });
  },
};

const PERSONAL_PROJECTS_SUMMARY_QUERY_KEY = ['personal-projects-summary'];

type NewMemberSettingsRequest = Pick<
  UpdatePlatformRequestBody,
  'defaultProjectIds' | 'autoCreatePersonalProjects'
>;
