import { useQuery } from '@tanstack/react-query';

import { flagsHooks } from '@/hooks/flags-hooks';
import { authenticationApi } from '@/lib/authentication-api';
import { authenticationSession } from '@/lib/authentication-session';
import {
  ApEdition,
  ApFlagId,
  isNil,
  Permission,
  PlatformRole,
} from '@activepieces/shared';

export const useAuthorization = () => {
  const { data: edition } = flagsHooks.useFlag(ApFlagId.EDITION);

  const { data: projectRole, isLoading } = useQuery({
    queryKey: ['project-role', authenticationSession.getProjectId()],
    queryFn: async () => {
      const projectRole = await authenticationApi.me();
      return projectRole;
    },
    enabled: !isNil(edition) && edition !== ApEdition.COMMUNITY,
  });

  const checkAccess = (permission: Permission) => {
    if (isLoading || edition === ApEdition.COMMUNITY) {
      return true;
    }
    return projectRole?.permissions?.includes(permission) ?? true;
  };

  return { checkAccess };
};

export const useShowPlatformAdminDashboard = () => {
  const platformRole = authenticationSession.getUserPlatformRole();
  const { data: isPlatformDemo } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_PLATFORM_DEMO,
  );
  return isPlatformDemo || platformRole === PlatformRole.ADMIN;
};
