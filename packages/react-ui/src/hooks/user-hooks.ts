import { QueryClient, useSuspenseQuery } from '@tanstack/react-query';

import { authenticationSession } from '@/lib/authentication-session';
import { userApi } from '@/lib/user-api';
import { UserWithMetaInformationAndProject } from '@activepieces/shared';

export const userHooks = {
  useCurrentUser: () => {
    const userId = authenticationSession.getCurrentUserId();
    return useSuspenseQuery<UserWithMetaInformationAndProject | null, Error>({
      queryKey: ['currentUser', userId],
      queryFn: async () => {
        if (!userId) {
          return null;
        }
        const result = await userApi.getCurrentUser();
        return result;
      },
      staleTime: Infinity,
    });
  },
  invalidateCurrentUser: (queryClient: QueryClient) => {
    const userId = authenticationSession.getCurrentUserId();
    queryClient.invalidateQueries({ queryKey: ['currentUser', userId] });
  },
  getCurrentUserPlatformRole: () => {
    const { data: user } = userHooks.useCurrentUser();
    return user?.platformRole;
  },
};
