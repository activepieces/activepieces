import { QueryClient, useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { authenticationSession } from '@/lib/authentication-session';
import { platformUserApi } from '@/lib/platform-user-api';
import {
  SeekPage,
  UserWithMetaInformation,
  UserWithMetaInformationAndProject,
} from '@activepieces/shared';

export const platformUserHooks = {
  useUsers: () => {
    return useQuery<SeekPage<UserWithMetaInformation>, Error>({
      queryKey: ['users'],
      queryFn: async () => {
        const results = await platformUserApi.list();
        return results;
      },
    });
  },
  useCurrentUser: () => {
    const userId = authenticationSession.getCurrentUserId();
    return useSuspenseQuery<UserWithMetaInformationAndProject | null, Error>({
      queryKey: ['currentUser', userId],
      queryFn: async () => {
        if (!userId) {
          return null;
        }
        const result = await platformUserApi.getCurrentUser();
        return result;
      },
      staleTime: Infinity,
    });
  },
  invalidateCurrentUser: (queryClient: QueryClient) => {
    const userId = authenticationSession.getCurrentUserId();
    queryClient.invalidateQueries({ queryKey: ['currentUser', userId] });
  },
};
