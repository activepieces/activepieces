import {
  ApEdition,
  ApFlagId,
  isNil,
  Permission,
  PlatformRole,
} from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';

import { authenticationApi } from '@/api/authentication-api';
import { platformApi } from '@/api/platforms-api';
import { flagsHooks } from '@/hooks/flags-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { authenticationSession } from '@/lib/authentication-session';

export const useAuthorization = () => {
  const { data: edition } = flagsHooks.useFlag(ApFlagId.EDITION);

  const platformId = authenticationSession.getPlatformId();
  const { data: projectRole, isLoading } = useQuery({
    queryKey: ['project-role', authenticationSession.getProjectId()],
    queryFn: async () => {
      const platform = await platformApi.getCurrentPlatform();
      if (platform.plan.projectRolesEnabled) {
        const projectRole = await authenticationApi.getCurrentProjectRole({
          projectId: authenticationSession.getProjectId() ?? '',
        });
        return projectRole;
      }
      return null;
    },
    retry: false,
    enabled:
      !isNil(edition) && edition !== ApEdition.COMMUNITY && !isNil(platformId),
  });

  const checkAccess = (permission: Permission) => {
    if (isLoading || edition === ApEdition.COMMUNITY) {
      return true;
    }
    return projectRole?.permissions?.includes(permission) ?? true;
  };

  return { checkAccess };
};

export const useIsPlatformAdmin = () => {
  const platformRole = userHooks.getCurrentUserPlatformRole();
  return platformRole === PlatformRole.ADMIN;
};
