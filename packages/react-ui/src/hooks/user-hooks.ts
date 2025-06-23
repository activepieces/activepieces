import { QueryClient, useSuspenseQuery } from '@tanstack/react-query';

import { authenticationSession } from '@/lib/authentication-session';
import { userApi } from '@/lib/user-api';
import { UserWithMetaInformationAndProject } from '@activepieces/shared';

export const userHooks = {
  useCurrentUser: () => {
    const userId = authenticationSession.getCurrentUserId();
    const token = authenticationSession.getToken();
    const expired = authenticationSession.isJwtExpired(token!);
    return useSuspenseQuery<UserWithMetaInformationAndProject | null, Error>({
      queryKey: ['currentUser', userId],
      queryFn: async () => {
        // Skip user data fetch if JWT is expired to prevent redirect to sign-in page
        // This is especially important for embedding scenarios where we need to accept
        // a new JWT token rather than triggering the global error handler

        if (!userId || expired) {
          return null;
        }
        try {
          const result = await userApi.getCurrentUser();
          return result;
        } catch (error) {
          console.error(error);
          return null;
        }
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
