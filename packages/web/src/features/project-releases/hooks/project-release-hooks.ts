import { DiffReleaseRequest, ProjectSyncPlan } from '@activepieces/shared';
import { useMutation, useQuery } from '@tanstack/react-query';

import { internalErrorToast } from '@/components/ui/sonner';
import { authenticationSession } from '@/lib/authentication-session';

import { projectReleaseApi } from '../api/project-release-api';

export const projectReleaseKeys = {
  all: ['project-releases'] as const,
  detail: (releaseId: string) => ['release', releaseId] as const,
};

export const projectReleaseQueries = {
  useProjectReleases: () =>
    useQuery({
      queryKey: projectReleaseKeys.all,
      queryFn: () =>
        projectReleaseApi.list({
          projectId: authenticationSession.getProjectId()!,
        }),
      meta: { showErrorDialog: true, loadSubsetOptions: {} },
    }),
  useProjectRelease: (releaseId: string, enabled: boolean) =>
    useQuery({
      queryKey: projectReleaseKeys.detail(releaseId),
      queryFn: () => projectReleaseApi.get(releaseId),
      enabled,
    }),
};

export const projectReleaseMutations = {
  useDiffRelease: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (plan: ProjectSyncPlan) => void;
    onError: () => void;
  }) => {
    return useMutation({
      mutationFn: (request: DiffReleaseRequest) =>
        projectReleaseApi.diff(request),
      onSuccess,
      onError: () => {
        onError();
        internalErrorToast();
      },
    });
  },
  useApplyRelease: ({ onSuccess }: { onSuccess: () => void }) => {
    return useMutation({
      mutationFn: (request: Parameters<typeof projectReleaseApi.create>[0]) =>
        projectReleaseApi.create(request),
      onSuccess,
    });
  },
};
