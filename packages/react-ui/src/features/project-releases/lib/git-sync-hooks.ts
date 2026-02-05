import { useQuery } from '@tanstack/react-query';

import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { GitBranchType } from '@activepieces/ee-shared';
import { isNil, Permission } from '@activepieces/shared';

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
  useShowPushToGit: () => {
    const { platform } = platformHooks.useCurrentPlatform();
    const { gitSync } = gitSyncHooks.useGitSync(
      authenticationSession.getProjectId()!,
      platform.plan.environmentsEnabled,
    );
    const userHasPermissionToPushToGit = useAuthorization().checkAccess(
      Permission.WRITE_PROJECT_RELEASE,
    );

    return (
      userHasPermissionToPushToGit &&
      !isNil(gitSync) &&
      gitSync.branchType === GitBranchType.DEVELOPMENT
    );
  },
};
