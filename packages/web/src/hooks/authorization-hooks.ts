import { Permission, PlatformRole } from '@activepieces/shared';

import { userHooks } from '@/hooks/user-hooks';

export const useAuthorization = () => {
  const checkAccess = (_permission: Permission) => true;
  return { checkAccess, isFetchingProjectRole: false };
};

export const useIsPlatformAdmin = () => {
  const platformRole = userHooks.getCurrentUserPlatformRole();
  return platformRole === PlatformRole.ADMIN;
};
